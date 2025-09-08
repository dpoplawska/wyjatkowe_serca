import base64
import hmac
import json
import logging
import os
from hashlib import sha256

from fastapi import APIRouter, HTTPException, Request, Header
import pandas as pd

from app.models import PaymentRequest, PaymentResponse, PaymentNotification, PurchaseRequest, PurchaseResponse
from app.utils import create_payment, load_secrets, create_purchase
from app.db import get_firestore_client


router = APIRouter()

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


@router.get("/purchases")
def get_all_purchases(x_password: str = Header(...)) -> list[dict]:
    expected_password = os.getenv("ACCESS_PASSWORD")
    if x_password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    db_client = get_firestore_client()
    purchases_stream = db_client.collection("purchases").stream()
    purchases = [{"id": purchase.id, **purchase.to_dict()} for purchase in purchases_stream]
    return purchases
