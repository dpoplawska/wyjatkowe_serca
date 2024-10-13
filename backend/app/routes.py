from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request


from app.models import PaymentRequest, PaymentResponse, PaymentNotification
from app.utils import create_payment, load_secrets
from app.db import get_firestore_client

from hashlib import sha256
import hmac
import base64
import json
import logging

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
    payments = db_client.collection("payments").where("status", "==", "CONFIRMED").stream()
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

        # Verify signature
        calculated_signature = base64.b64encode(hmac.new(signature_key.encode(), body, sha256).digest()).decode()
        if signature != calculated_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Parse payment notification
        notification = PaymentNotification(**json.loads(body))
        logging.info(f"Payment notification parsed successfully: {notification.dict()}")

        # Update payment status in Firebase
        payment_ref = db_client.collection("payments").document(notification.paymentId)
        payment_ref.update({"status": notification.status, "modifiedAt": notification.modifiedAt})
        logging.info("Payment status updated successfully")

        return {"message": "Payment status updated successfully"}
    except Exception as e:
        logging.exception("An error occurred while updating payment status")
        raise HTTPException(status_code=500, detail=str(e))
