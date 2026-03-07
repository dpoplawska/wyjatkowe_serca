import base64
import hmac
import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from hashlib import sha256

from fastapi import APIRouter, HTTPException, Request, Header, Depends
import pandas as pd
from firebase_admin import auth as firebase_auth

from app.models import PaymentRequest, PaymentResponse, PaymentNotification, PurchaseRequest, PurchaseResponse, PatientProfileData, MedicationsData, InrData, MeasurementsData
from app.utils import create_payment, load_secrets, create_purchase
from app.db import get_firestore_client, initialize_firestore


router = APIRouter()


def verify_token(authorization: str = Header(...)) -> str:
    """Verify Firebase ID token from Authorization header and return the user UID."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = authorization.removeprefix("Bearer ")
    if os.getenv("ENV") == "dev" and token.startswith("dev:"):
        return token.removeprefix("dev:")
    try:
        initialize_firestore()
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def resolve_uid(uid: str) -> str:
    """If the user has been granted access to another user's data, return that user's UID."""
    db_client = get_firestore_client()
    doc = db_client.collection("userAccess").document(uid).get()
    if doc.exists:
        return doc.to_dict()["ownerUid"]
    return uid


@router.get("/dev/users")
def get_dev_users() -> list[dict]:
    if os.getenv("ENV") != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    initialize_firestore()
    db_client = get_firestore_client()
    uids = {doc.id for doc in db_client.collection("patientProfiles").stream()}
    result = []
    page = firebase_auth.list_users()
    while page:
        for user in page.users:
            if user.uid in uids:
                result.append({"uid": user.uid, "email": user.email or user.uid})
        page = page.get_next_page()
    return result


PATIENT_COLLECTIONS = ["patientProfiles", "medications", "inrHistory", "measurements"]


@router.delete("/dev/users/{uid}")
def dev_delete_user(uid: str) -> dict:
    if os.getenv("ENV") != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    initialize_firestore()
    db_client = get_firestore_client()

    # Determine whether uid is a guest or an owner
    access_doc = db_client.collection("userAccess").document(uid).get()
    is_guest = access_doc.exists
    owner_uid = access_doc.to_dict()["ownerUid"] if is_guest else uid

    # Find all guests pointing to owner_uid (excluding uid being deleted)
    other_guests = [
        doc.id for doc in
        db_client.collection("userAccess").where("ownerUid", "==", owner_uid).stream()
        if doc.id != uid
    ]

    if is_guest:
        # There is always at least the owner → never the only user → just unlink
        db_client.collection("userAccess").document(uid).delete()
        firebase_auth.delete_user(uid)
        return {"deleted_data": False, "message": f"Unlinked guest {uid}; child data preserved under {owner_uid}"}

    # uid is the owner
    if not other_guests:
        # Only user — delete all child data
        for col in PATIENT_COLLECTIONS:
            db_client.collection(col).document(uid).delete()
        firebase_auth.delete_user(uid)
        return {"deleted_data": True, "message": f"Deleted owner {uid} and all child data"}

    # Owner has guests — transfer ownership to first guest
    new_owner = other_guests[0]
    remaining_guests = other_guests[1:]

    for col in PATIENT_COLLECTIONS:
        doc = db_client.collection(col).document(uid).get()
        if doc.exists:
            db_client.collection(col).document(new_owner).set(doc.to_dict())
        db_client.collection(col).document(uid).delete()

    # new_owner becomes the real owner — remove their userAccess doc
    db_client.collection("userAccess").document(new_owner).delete()

    # Point remaining guests to new_owner
    for guest_uid in remaining_guests:
        db_client.collection("userAccess").document(guest_uid).set({
            "ownerUid": new_owner,
            "grantedAt": db_client.collection("userAccess").document(guest_uid).get().to_dict().get("grantedAt", ""),
        })

    firebase_auth.delete_user(uid)
    return {"deleted_data": False, "message": f"Deleted owner {uid}; ownership transferred to {new_owner}"}

@router.post("/payments", response_model=PaymentResponse)
def create_payment_endpoint(payment_request: PaymentRequest) -> PaymentResponse:
    try:
        payment_response = create_payment(payment_request)

        try:
            db_client = get_firestore_client()
            payment_ref = db_client.collection("payments").document(payment_response.paymentId)
            payment_ref.set({
                "amount": payment_request.amount,
                "email": payment_request.email,
                "status": payment_response.status
            })
        except Exception as e:
            pass

        return payment_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/total-confirmed")
def total_confirmed_payments():
    db_client = get_firestore_client()
    payments = (
        db_client
        .collection("payments")
        .where("status", "==", "CONFIRMED")
        .stream()
    )

    # get only payments for current month
    current_month_start = pd.Timestamp.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    payments = [payment for payment in payments if pd.Timestamp(payment.to_dict()["modifiedAt"]) >= current_month_start]

    total = sum([payment.to_dict()["amount"] for payment in payments])
    return {"total": total}


@router.post("/payments/status")
async def payment_status(request: Request):
    db_client = get_firestore_client()
    try:
        secrets = load_secrets()
        signature_key = secrets["SIGNATURE_KEY"]
        body = await request.body()
        signature = request.headers.get("Signature")
        logging.info(f"Received payment notification: {body}")

        # verify signature
        calculated_signature = base64.b64encode(hmac.new(signature_key.encode(), body, sha256).digest()).decode()
        if signature != calculated_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")

        # parse payment notification
        notification = PaymentNotification(**json.loads(body))
        logging.info(f"Payment notification parsed successfully: {notification.dict()}")

        # Update status in the appropriate collection (donations or purchases)
        payment_doc = db_client.collection("payments").document(notification.paymentId).get()
        if payment_doc.exists:
            payment_ref = db_client.collection("payments").document(notification.paymentId)
            payment_ref.update({"status": notification.status, "modifiedAt": notification.modifiedAt})
            logging.info("Donation status updated successfully")
        else:
            purchase_doc = db_client.collection("purchases").document(notification.paymentId).get()
            if purchase_doc.exists:
                purchase_ref = db_client.collection("purchases").document(notification.paymentId)
                purchase_ref.update({"status": notification.status, "modifiedAt": notification.modifiedAt})
                logging.info("Purchase status updated successfully")
            else:
                logging.warning("No matching donation or purchase found for paymentId")
                raise HTTPException(status_code=404, detail="No matching donation or purchase found")

        return {"message": "Status updated successfully"}

        return {"message": "Payment status updated successfully"}
    except Exception as e:
        logging.exception("An error occurred while updating payment status")
        raise HTTPException(status_code=500, detail=str(e))


# get items left
@router.get("/purchases/left")
def get_items_left() -> dict:
    MAX_ITEMS = 45
    try:
        db_client = get_firestore_client()
        purchases_stream = db_client.collection("purchases").stream()
        purchases = [
            purchase.to_dict()
            for purchase in purchases_stream
            if purchase.to_dict().get("status") == "CONFIRMED"
        ]
        total_units = sum(purchase.get("units", 1) for purchase in purchases)
        items_left = MAX_ITEMS - total_units
        return {"items_left": items_left}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/purchases", response_model=PurchaseResponse)
def create_purchase_endpoint(purchase_request: PurchaseRequest) -> PurchaseResponse:
    try:
        # don't allow new purchases if items left is 0
        items_left = get_items_left()["items_left"]
        if items_left <= 0:
            raise HTTPException(status_code=400, detail="No items left for purchase")

        purchase_response = create_purchase(purchase_request)

        try:
            db_client = get_firestore_client()
            purchase_ref = db_client.collection("purchases").document(purchase_response.purchaseId)
            purchase_ref.set({
                "amount": purchase_request.amount,
                "units": purchase_request.units,
                "email": purchase_request.email,
                "phone": purchase_request.phone,
                "name": purchase_request.name,
                "address": purchase_request.address,
                "paczkomat": purchase_request.paczkomat,
                "paczkomat_id": purchase_request.paczkomat_id,
                "status": purchase_response.status
            })
        except Exception as e:
            pass

        return purchase_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patient-profile")
def get_patient_profile(uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    doc = db_client.collection("patientProfiles").document(resolve_uid(uid)).get()
    if not doc.exists:
        return {}
    return doc.to_dict()


@router.put("/patient-profile")
def upsert_patient_profile(profile: PatientProfileData, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    db_client.collection("patientProfiles").document(resolve_uid(uid)).set(profile.model_dump())
    return {"message": "Profil zapisany pomyślnie"}


@router.get("/medications")
def get_medications(uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    doc = db_client.collection("medications").document(resolve_uid(uid)).get()
    return doc.to_dict() if doc.exists else {}


@router.put("/medications")
def upsert_medications(data: MedicationsData, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    db_client.collection("medications").document(resolve_uid(uid)).set(data.model_dump())
    return {"message": "Leki zapisane pomyślnie"}


@router.get("/inr")
def get_inr(uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    doc = db_client.collection("inrHistory").document(resolve_uid(uid)).get()
    return doc.to_dict() if doc.exists else {}


@router.put("/inr")
def upsert_inr(data: InrData, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    db_client.collection("inrHistory").document(resolve_uid(uid)).set(data.model_dump())
    return {"message": "Historia INR zapisana pomyślnie"}


@router.get("/measurements")
def get_measurements(uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    doc = db_client.collection("measurements").document(resolve_uid(uid)).get()
    return doc.to_dict() if doc.exists else {}


@router.put("/measurements")
def upsert_measurements(data: MeasurementsData, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    db_client.collection("measurements").document(resolve_uid(uid)).set(data.model_dump())
    return {"message": "Pomiary zapisane pomyślnie"}


@router.post("/invite")
def create_invite(uid: str = Depends(verify_token)) -> dict:
    # Guests cannot create invites (invites must come from the data owner)
    owner_uid = resolve_uid(uid)
    if owner_uid != uid:
        raise HTTPException(status_code=403, detail="Only the data owner can create invitations")
    db_client = get_firestore_client()
    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=7)
    db_client.collection("invitations").document(token).set({
        "ownerUid": uid,
        "createdAt": now.isoformat(),
        "expiresAt": expires.isoformat(),
        "used": False,
    })
    return {"token": token}


@router.get("/invite/{token}")
def get_invite(token: str, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    doc = db_client.collection("invitations").document(token).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Zaproszenie nie istnieje")
    inv = doc.to_dict()
    if inv["used"]:
        raise HTTPException(status_code=410, detail="To zaproszenie zostało już wykorzystane")
    if datetime.fromisoformat(inv["expiresAt"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="To zaproszenie wygasło")
    # Fetch child name for confirmation screen
    profile_doc = db_client.collection("patientProfiles").document(inv["ownerUid"]).get()
    child_name = profile_doc.to_dict().get("imie_nazwisko", "") if profile_doc.exists else ""
    # Check if the accepting user already has their own data
    caller_profile = db_client.collection("patientProfiles").document(uid).get()
    has_existing_data = caller_profile.exists and bool(caller_profile.to_dict().get("imie_nazwisko", ""))
    return {"ownerUid": inv["ownerUid"], "childName": child_name, "hasExistingData": has_existing_data}


@router.post("/accept-invite/{token}")
def accept_invite(token: str, uid: str = Depends(verify_token)) -> dict:
    db_client = get_firestore_client()
    doc = db_client.collection("invitations").document(token).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Zaproszenie nie istnieje")
    inv = doc.to_dict()
    if inv["used"]:
        raise HTTPException(status_code=410, detail="To zaproszenie zostało już wykorzystane")
    if datetime.fromisoformat(inv["expiresAt"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="To zaproszenie wygasło")
    if inv["ownerUid"] == uid:
        raise HTTPException(status_code=400, detail="Nie możesz dołączyć do własnego profilu")
    # Grant access
    db_client.collection("userAccess").document(uid).set({
        "ownerUid": inv["ownerUid"],
        "grantedAt": datetime.now(timezone.utc).isoformat(),
    })
    db_client.collection("invitations").document(token).update({"used": True})
    return {"message": "Dostęp przyznany"}


@router.get("/purchases")
def get_all_purchases(x_password: str = Header(...)) -> list[dict]:
    expected_password = os.getenv("ACCESS_PASSWORD")
    if x_password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    db_client = get_firestore_client()
    purchases_stream = db_client.collection("purchases").stream()
    purchases = [{"id": purchase.id, **purchase.to_dict()} for purchase in purchases_stream]
    return purchases
