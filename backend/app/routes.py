from fastapi import APIRouter, HTTPException
from app.models import PaymentRequest, PaymentResponse
from app.utils import create_payment
from typing import Any, Dict

router = APIRouter()

@router.post("/payments", response_model=PaymentResponse)
def create_payment_endpoint(payment_request: PaymentRequest) -> PaymentResponse:
    try:
        payment_response = create_payment(payment_request)
        return payment_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
