"""Consent record and account deletion (RODO: art. 9 consent, right to erasure).

Consent lives in users/{uid}.consent next to the admin/upload flags. Every
patient-data route depends on `require_consent` (app.routes), so an account
without a current consent record can sign in and read /me but nothing else.

Deletion removes everything the account owns. When the owner has co-guardians
the caller chooses: `purge=False` hands the child's data to the first guest
(the family keeps its history), `purge=True` erases it and unlinks everyone.
"""
import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as firebase_auth
from pydantic import BaseModel

from app.db import get_firestore_client, initialize_firestore
from app.routes import CONSENT_VERSION, consent_record, verify_token
from app.storage import get_bucket

router = APIRouter()

PATIENT_COLLECTIONS = ["patientProfiles", "medications", "inrHistory", "measurements"]


class ConsentRequest(BaseModel):
    terms: bool
    healthData: bool


class DeleteAccountRequest(BaseModel):
    # Only consulted when the caller owns a profile shared with guests.
    purge: bool = False


# ---------------------------------------------------------------------------
# consent


@router.get("/consent")
def get_consent(uid: str = Depends(verify_token)) -> dict:
    rec = consent_record(get_firestore_client(), uid)
    current = bool(rec and rec.get("version") == CONSENT_VERSION and rec.get("terms") and rec.get("healthData"))
    return {"accepted": current, "requiredVersion": CONSENT_VERSION, "record": rec}


@router.put("/consent")
def put_consent(req: ConsentRequest, uid: str = Depends(verify_token)) -> dict:
    if not (req.terms and req.healthData):
        raise HTTPException(status_code=400, detail="Wymagana jest akceptacja regulaminu i zgoda na dane o zdrowiu")
    rec = {
        "version": CONSENT_VERSION,
        "acceptedAt": datetime.now(timezone.utc).isoformat(),
        "terms": True,
        "healthData": True,
    }
    get_firestore_client().collection("users").document(uid).set({"consent": rec}, merge=True)
    return {"accepted": True, "requiredVersion": CONSENT_VERSION, "record": rec}


# ---------------------------------------------------------------------------
# deletion


def _delete_documents(db_client, owner_uid: str) -> None:
    items = db_client.collection("patientDocuments").document(owner_uid).collection("items")
    bucket = None
    for snap in list(items.stream()):
        path = (snap.to_dict() or {}).get("objectPath")
        if path:
            try:
                bucket = bucket or get_bucket()
                blob = bucket.blob(path)
                if blob.exists():
                    blob.delete()
            except Exception:
                logging.exception("Failed to delete blob %s", path)
        items.document(snap.id).delete()
    db_client.collection("patientDocuments").document(owner_uid).delete()


def _move_documents(db_client, src_uid: str, dst_uid: str) -> None:
    # objectPath is stored per item, so the blobs stay where they are.
    src = db_client.collection("patientDocuments").document(src_uid).collection("items")
    dst = db_client.collection("patientDocuments").document(dst_uid).collection("items")
    for snap in list(src.stream()):
        dst.document(snap.id).set(snap.to_dict())
        src.document(snap.id).delete()
    db_client.collection("patientDocuments").document(src_uid).delete()


def _delete_invitations(db_client, owner_uid: str) -> None:
    for snap in list(db_client.collection("invitations").where("ownerUid", "==", owner_uid).stream()):
        db_client.collection("invitations").document(snap.id).delete()


def _delete_auth_user(uid: str) -> None:
    try:
        firebase_auth.delete_user(uid)
    except Exception:
        # Dev accounts have no Firebase user; a missing prod user is already gone.
        logging.warning("Firebase user %s not deleted", uid, exc_info=True)


def delete_account(db_client, uid: str, purge: bool) -> dict:
    access_doc = db_client.collection("userAccess").document(uid).get()
    is_guest = access_doc.exists

    if is_guest:
        db_client.collection("userAccess").document(uid).delete()
        db_client.collection("users").document(uid).delete()
        _delete_auth_user(uid)
        owner_uid = access_doc.to_dict()["ownerUid"]
        return {"deleted_data": False, "message": f"Unlinked guest {uid}; child data preserved under {owner_uid}"}

    guests = [
        snap.id for snap in db_client.collection("userAccess").where("ownerUid", "==", uid).stream()
        if snap.id != uid
    ]

    if not guests or purge:
        for col in PATIENT_COLLECTIONS:
            db_client.collection(col).document(uid).delete()
        _delete_documents(db_client, uid)
        _delete_invitations(db_client, uid)
        for guest_uid in guests:
            db_client.collection("userAccess").document(guest_uid).delete()
        db_client.collection("users").document(uid).delete()
        _delete_auth_user(uid)
        return {"deleted_data": True, "message": f"Deleted owner {uid} and all child data"}

    new_owner, remaining = guests[0], guests[1:]
    for col in PATIENT_COLLECTIONS:
        doc = db_client.collection(col).document(uid).get()
        if doc.exists:
            db_client.collection(col).document(new_owner).set(doc.to_dict())
        db_client.collection(col).document(uid).delete()
    _move_documents(db_client, uid, new_owner)
    _delete_invitations(db_client, uid)

    db_client.collection("userAccess").document(new_owner).delete()
    for guest_uid in remaining:
        ref = db_client.collection("userAccess").document(guest_uid)
        granted = (ref.get().to_dict() or {}).get("grantedAt", "")
        ref.set({"ownerUid": new_owner, "grantedAt": granted})

    db_client.collection("users").document(uid).delete()
    _delete_auth_user(uid)
    return {"deleted_data": False, "message": f"Deleted owner {uid}; ownership transferred to {new_owner}"}


@router.delete("/account")
def delete_own_account(req: DeleteAccountRequest | None = None, uid: str = Depends(verify_token)) -> dict:
    return delete_account(get_firestore_client(), uid, purge=bool(req and req.purge))


@router.delete("/dev/users/{uid}")
def dev_delete_user(uid: str) -> dict:
    if os.getenv("ENV") != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    initialize_firestore()
    return delete_account(get_firestore_client(), uid, purge=False)
