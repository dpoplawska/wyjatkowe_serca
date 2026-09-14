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
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth as firebase_auth
from google.api_core.exceptions import NotFound
from pydantic import BaseModel, Field

from app.db import get_firestore_client
from app.limiter import limiter
from app.routes import require_consent, resolve_uid, verify_token
from app.storage import get_bucket, signed_url

router = APIRouter()

MAX_FILE_BYTES = 50 * 1024 * 1024  # per document
MAX_TOTAL_BYTES = 200 * 1024 * 1024  # per patient, ready + pending
UPLOAD_URL_TTL = timedelta(minutes=15)
DOWNLOAD_URL_TTL = timedelta(minutes=10)
PDF_CONTENT_TYPE = "application/pdf"
# Signed into the upload URL, so Storage itself rejects anything else.
UPLOAD_HEADERS = {
    "Content-Type": PDF_CONTENT_TYPE,
    "x-goog-content-length-range": f"0,{MAX_FILE_BYTES}",
}


class UploadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200, pattern=r"(?i)\.pdf$")
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    size: int = Field(gt=0, le=MAX_FILE_BYTES)


class ApprovalRequest(BaseModel):
    approved: bool


# ---------------------------------------------------------------------------
# helpers


def _items(db_client, owner_uid: str):
    return db_client.collection("patientDocuments").document(owner_uid).collection("items")


def _flags(data: dict | None) -> dict:
    data = data or {}
    return {
        "isAdmin": bool(data.get("isAdmin", False)),
        "uploadApproved": bool(data.get("uploadApproved", False)),
    }


def _user_flags(db_client, uid: str) -> dict:
    return _flags(db_client.collection("users").document(uid).get().to_dict())


def require_flag(flag: str, detail: str):
    """Dependency: the signed-in account must carry `flag` in users/{uid}."""
    def dependency(uid: str = Depends(require_consent)) -> str:
        if not _user_flags(get_firestore_client(), uid)[flag]:
            raise HTTPException(status_code=403, detail=detail)
        return uid
    return dependency


require_admin = require_flag("isAdmin", "Brak uprawnień administratora")
# Approval is per signed-in account, even when uploading into an owner's
# profile as a guest.
require_upload_approved = require_flag(
    "uploadApproved", "Wgrywanie dokumentów wymaga zatwierdzenia konta przez fundację"
)


def _public(doc: dict) -> dict:
    return {"id": doc["id"], "name": doc["name"], "date": doc["date"], "size": doc.get("size", 0)}


def _emails_by_uid(uids: list[str]) -> dict[str, str]:
    """Batch-resolve e-mail addresses (100 per Identity Toolkit call)."""
    emails: dict[str, str] = {}
    for i in range(0, len(uids), 100):
        chunk = [firebase_auth.UidIdentifier(u) for u in uids[i:i + 100]]
        try:
            for user in firebase_auth.get_users(chunk).users:
                emails[user.uid] = user.email or ""
        except Exception:
            logging.exception("Failed to resolve user e-mails")
    return emails


# ---------------------------------------------------------------------------
# user flags


@router.get("/me")
def get_me(uid: str = Depends(verify_token)) -> dict:
    return _user_flags(get_firestore_client(), uid)


# ---------------------------------------------------------------------------
# documents


@router.get("/documents")
def list_documents(uid: str = Depends(require_consent)) -> list[dict]:
    docs = [d.to_dict() for d in _items(get_firestore_client(), resolve_uid(uid)).stream()]
    ready = [d for d in docs if d.get("status") == "ready"]
    ready.sort(key=lambda d: (d.get("date", ""), d.get("createdAt", "")), reverse=True)
    return [_public(d) for d in ready]


@router.post("/documents/upload-url")
@limiter.limit("20/minute")
def create_upload_url(request: Request, req: UploadRequest, uid: str = Depends(require_upload_approved)) -> dict:
    db_client = get_firestore_client()
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
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "uploadedBy": uid,
    })
    try:
        url = signed_url(get_bucket().blob(object_path), "PUT", UPLOAD_URL_TTL, headers=UPLOAD_HEADERS)
    except Exception:
        logging.exception("Failed to sign upload URL for %s", object_path)
        raise HTTPException(status_code=500, detail="Nie udało się przygotować wysyłki pliku")
    return {"documentId": doc_id, "uploadUrl": url, "headers": UPLOAD_HEADERS}


@router.post("/documents/{doc_id}/complete")
def complete_upload(doc_id: str, uid: str = Depends(require_consent)) -> dict:
    owner_uid = resolve_uid(uid)
    ref = _items(get_firestore_client(), owner_uid).document(doc_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Nie znaleziono dokumentu")
    meta = snap.to_dict()
    if meta.get("status") == "ready":
        return _public(meta)

    bucket = get_bucket()
    pending = bucket.blob(meta["objectPath"])
    try:
        pending.reload()
    except NotFound:
        raise HTTPException(status_code=400, detail="Plik nie został wysłany")

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
    changes = {"status": "ready", "objectPath": ready_path, "size": pending.size}
    ref.update(changes)
    return _public({**meta, **changes})


@router.get("/documents/{doc_id}/download-url")
def get_download_url(doc_id: str, uid: str = Depends(require_consent)) -> dict:
    snap = _items(get_firestore_client(), resolve_uid(uid)).document(doc_id).get()
    if not snap.exists or snap.to_dict().get("status") != "ready":
        raise HTTPException(status_code=404, detail="Nie znaleziono dokumentu")
    object_path = snap.to_dict()["objectPath"]
    try:
        url = signed_url(
            get_bucket().blob(object_path),
            "GET",
            DOWNLOAD_URL_TTL,
            response_disposition=f'inline; filename="{doc_id}.pdf"',
            response_type=PDF_CONTENT_TYPE,
        )
    except Exception:
        logging.exception("Failed to sign download URL for %s", object_path)
        raise HTTPException(status_code=500, detail="Nie udało się przygotować pobrania")
    return {"url": url}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, uid: str = Depends(require_consent)) -> dict:
    ref = _items(get_firestore_client(), resolve_uid(uid)).document(doc_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Nie znaleziono dokumentu")
    blob = get_bucket().blob(snap.to_dict()["objectPath"])
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
    uids = sorted(set(flags) | set(profiles))
    emails = _emails_by_uid(uids)
    return [
        {
            "uid": uid,
            "email": emails.get(uid, ""),
            "name": profiles.get(uid, {}).get("imie_nazwisko", ""),
            **_flags(flags.get(uid)),
        }
        for uid in uids
    ]


@router.put("/admin/users/{uid}/approval")
def admin_set_approval(uid: str, req: ApprovalRequest, admin_uid: str = Depends(require_admin)) -> dict:
    get_firestore_client().collection("users").document(uid).set(
        {
            "uploadApproved": req.approved,
            "approvedAt": datetime.now(timezone.utc).isoformat(),
            "approvedBy": admin_uid,
        },
        merge=True,
    )
    return {"uid": uid, "uploadApproved": req.approved}
