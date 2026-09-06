"""Medical documentation (PDF) upload/download for the patient app.

Files never pass through this service — Cloud Run caps request bodies at
32 MB. Instead the client gets a short-lived V4 signed URL, PUTs the file
straight to Cloud Storage, then calls `complete`, where the object is
verified (size, content type, %PDF magic) and promoted from `pending/` to
`ready/`. A bucket lifecycle rule deletes anything left under `pending/`
after one day, so abandoned uploads never cost anything.

Authorization stays here: the signed URLs are the only way to touch the
bucket from outside, and they are issued per call after the usual checks.
"""
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

import google.auth
from google.auth.transport import requests as gauth_requests
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as firebase_auth
from firebase_admin import storage as firebase_storage
from pydantic import BaseModel, Field

from app.db import get_firestore_client, initialize_firestore
from app.routes import resolve_uid, verify_token

router = APIRouter()

DOCUMENTS_BUCKET = os.getenv("DOCUMENTS_BUCKET", "wyjatkowe-serca-documents")
MAX_FILE_BYTES = 50 * 1024 * 1024  # per document
MAX_TOTAL_BYTES = 200 * 1024 * 1024  # per patient, ready + pending
UPLOAD_URL_TTL = timedelta(minutes=15)
DOWNLOAD_URL_TTL = timedelta(minutes=10)
PDF_CONTENT_TYPE = "application/pdf"


class UploadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    size: int = Field(gt=0)


class ApprovalRequest(BaseModel):
    approved: bool


# ---------------------------------------------------------------------------
# helpers


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _bucket():
    initialize_firestore()
    return firebase_storage.bucket(DOCUMENTS_BUCKET)


def _signed_url(blob, method: str, ttl: timedelta, **kwargs) -> str:
    """V4 signed URL. On Cloud Run there is no private key, so sign through the
    IAM signBlob API using the runtime service account's access token."""
    creds, _ = google.auth.default()
    if hasattr(creds, "sign_bytes"):  # service-account key file (local dev)
        return blob.generate_signed_url(version="v4", expiration=ttl, method=method, **kwargs)
    creds.refresh(gauth_requests.Request())
    return blob.generate_signed_url(
        version="v4",
        expiration=ttl,
        method=method,
        service_account_email=creds.service_account_email,
        access_token=creds.token,
        **kwargs,
    )


def _items(db_client, owner_uid: str):
    return db_client.collection("patientDocuments").document(owner_uid).collection("items")


def _user_flags(db_client, uid: str) -> dict:
    doc = db_client.collection("users").document(uid).get()
    data = doc.to_dict() if doc.exists else {}
    return {
        "isAdmin": bool(data.get("isAdmin", False)),
        "uploadApproved": bool(data.get("uploadApproved", False)),
    }


def require_admin(uid: str = Depends(verify_token)) -> str:
    db_client = get_firestore_client()
    if not _user_flags(db_client, uid)["isAdmin"]:
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    return uid


def _public(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "date": doc["date"],
        "size": doc.get("size", 0),
        "createdAt": doc.get("createdAt", ""),
    }


# ---------------------------------------------------------------------------
# user flags


@router.get("/me")
def get_me(uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    return {"uid": uid, **_user_flags(db_client, uid)}


# ---------------------------------------------------------------------------
# documents


@router.get("/documents")
def list_documents(uid: str = Depends(verify_token)) -> list[dict]:
    db_client = get_firestore_client()
    owner_uid = resolve_uid(uid)
    docs = [d.to_dict() for d in _items(db_client, owner_uid).stream()]
    ready = [d for d in docs if d.get("status") == "ready"]
    ready.sort(key=lambda d: (d.get("date", ""), d.get("createdAt", "")), reverse=True)
    return [_public(d) for d in ready]


@router.post("/documents/upload-url")
def create_upload_url(req: UploadRequest, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    if not _user_flags(db_client, uid)["uploadApproved"]:
        raise HTTPException(status_code=403, detail="Wgrywanie dokumentów wymaga zatwierdzenia konta przez fundację")
    if req.size > MAX_FILE_BYTES:
        raise HTTPException(status_code=400, detail="Plik jest za duży (limit 50 MB)")
    if not req.name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Dozwolone są tylko pliki PDF")

    owner_uid = resolve_uid(uid)
    used = sum(d.to_dict().get("size", 0) for d in _items(db_client, owner_uid).stream())
    if used + req.size > MAX_TOTAL_BYTES:
        raise HTTPException(status_code=400, detail="Przekroczono limit 200 MB dokumentów dla tego profilu")

    doc_id = secrets.token_urlsafe(12)
    object_path = f"pending/{owner_uid}/{doc_id}.pdf"
    _items(db_client, owner_uid).document(doc_id).set({
        "id": doc_id,
        "name": req.name,
        "date": req.date,
        "size": req.size,
        "status": "pending",
        "objectPath": object_path,
        "createdAt": _now(),
        "uploadedBy": uid,
    })
    blob = _bucket().blob(object_path)
    try:
        url = _signed_url(
            blob,
            "PUT",
            UPLOAD_URL_TTL,
            content_type=PDF_CONTENT_TYPE,
            headers={"x-goog-content-length-range": f"0,{MAX_FILE_BYTES}"},
        )
    except Exception:
        logging.exception("Failed to sign upload URL for %s", object_path)
        raise HTTPException(status_code=500, detail="Nie udało się przygotować wysyłki pliku")
    return {
        "documentId": doc_id,
        "uploadUrl": url,
        "headers": {
            "Content-Type": PDF_CONTENT_TYPE,
            "x-goog-content-length-range": f"0,{MAX_FILE_BYTES}",
        },
    }


@router.post("/documents/{doc_id}/complete")
def complete_upload(doc_id: str, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    owner_uid = resolve_uid(uid)
    ref = _items(db_client, owner_uid).document(doc_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Nie znaleziono dokumentu")
    meta = snap.to_dict()
    if meta.get("status") == "ready":
        return _public(meta)

    bucket = _bucket()
    pending = bucket.blob(meta["objectPath"])
    if not pending.exists():
        raise HTTPException(status_code=400, detail="Plik nie został wysłany")
    pending.reload()

    def reject(detail: str):
        pending.delete()
        ref.delete()
        raise HTTPException(status_code=400, detail=detail)

    if pending.size is None or pending.size > MAX_FILE_BYTES:
        reject("Plik jest za duży (limit 50 MB)")
    if pending.content_type != PDF_CONTENT_TYPE:
        reject("Dozwolone są tylko pliki PDF")
    if not pending.download_as_bytes(start=0, end=4).startswith(b"%PDF"):
        reject("Plik nie jest poprawnym dokumentem PDF")

    ready_path = f"ready/{owner_uid}/{doc_id}.pdf"
    bucket.copy_blob(pending, bucket, ready_path)
    pending.delete()
    ref.update({"status": "ready", "objectPath": ready_path, "size": pending.size})
    meta.update({"status": "ready", "objectPath": ready_path, "size": pending.size})
    return _public(meta)


@router.get("/documents/{doc_id}/download-url")
def get_download_url(doc_id: str, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    owner_uid = resolve_uid(uid)
    snap = _items(db_client, owner_uid).document(doc_id).get()
    if not snap.exists or snap.to_dict().get("status") != "ready":
        raise HTTPException(status_code=404, detail="Nie znaleziono dokumentu")
    meta = snap.to_dict()
    blob = _bucket().blob(meta["objectPath"])
    try:
        url = _signed_url(
            blob,
            "GET",
            DOWNLOAD_URL_TTL,
            response_disposition=f'inline; filename="{doc_id}.pdf"',
            response_type=PDF_CONTENT_TYPE,
        )
    except Exception:
        logging.exception("Failed to sign download URL for %s", meta["objectPath"])
        raise HTTPException(status_code=500, detail="Nie udało się przygotować pobrania")
    return {"url": url, "expiresInSeconds": int(DOWNLOAD_URL_TTL.total_seconds())}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    owner_uid = resolve_uid(uid)
    ref = _items(db_client, owner_uid).document(doc_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Nie znaleziono dokumentu")
    blob = _bucket().blob(snap.to_dict()["objectPath"])
    if blob.exists():
        blob.delete()
    ref.delete()
    return {"message": "Dokument usunięty"}


# ---------------------------------------------------------------------------
# admin


@router.get("/admin/users")
def admin_list_users(admin_uid: str = Depends(require_admin)) -> list[dict]:
    db_client = get_firestore_client()
    flags = {d.id: d.to_dict() for d in db_client.collection("users").stream()}
    profiles = {d.id: d.to_dict() for d in db_client.collection("patientProfiles").stream()}
    users = []
    for uid in sorted(set(flags) | set(profiles)):
        try:
            email = firebase_auth.get_user(uid).email or ""
        except Exception:
            email = ""
        users.append({
            "uid": uid,
            "email": email,
            "name": profiles.get(uid, {}).get("imie_nazwisko", ""),
            "isAdmin": bool(flags.get(uid, {}).get("isAdmin", False)),
            "uploadApproved": bool(flags.get(uid, {}).get("uploadApproved", False)),
        })
    return users


@router.put("/admin/users/{uid}/approval")
def admin_set_approval(uid: str, req: ApprovalRequest, admin_uid: str = Depends(require_admin)) -> dict:
    db_client = get_firestore_client()
    db_client.collection("users").document(uid).set(
        {"uploadApproved": req.approved, "approvedAt": _now(), "approvedBy": admin_uid},
        merge=True,
    )
    return {"uid": uid, "uploadApproved": req.approved}
