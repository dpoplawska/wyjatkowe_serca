"""
Documentation for Paynow API at https://docs.paynow.pl/
"""

import os
import hmac
import hashlib
import base64
import uuid
import json
from typing import Any

import requests
from fastapi import HTTPException
from pydantic import ValidationError

from app.models import PaymentRequest, PaymentResponse

def load_secrets() -> dict[str, str]:
    env = os.getenv('ENV')
    if env == 'dev':
        filename = 'secrets_dev.json'
    elif env == 'prod':
        filename = 'secrets.json'
    else:
        raise RuntimeError("The ENV environment variable must be set to either 'dev' or 'prod'.")
    with open(filename, 'r') as file:
        secrets = json.load(file)
    return secrets

def calculate_hmac(data: str, key: str) -> str:
    hashed_object = hmac.new(key.encode(), data.encode(), hashlib.sha256).digest()
    return base64.b64encode(hashed_object).decode()

def generate_idempotency_key() -> str:
    return str(uuid.uuid4())

def make_post_request(endpoint: str, data: dict[str, Any]) -> dict[str, Any]:
    secrets = load_secrets()
    api_url = secrets["API_URL"]
    api_key = secrets["API_KEY"]
    signature_key = secrets["SIGNATURE_KEY"]
    
    data_str = json.dumps(data)
    signature = calculate_hmac(data_str, signature_key)
    headers = {
        "Api-Key": api_key,
        "Content-Type": "application/json",
        "Signature": signature,
        "Idempotency-Key": generate_idempotency_key()
    }
    response = requests.post(f"{api_url}/{endpoint}", headers=headers, data=data_str)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

def create_payment(payment_request: PaymentRequest) -> PaymentResponse:
    amount_str = str(payment_request.amount * 100)
    payment_data = {
        "amount": amount_str,
        "externalId": str(uuid.uuid4()),
        "description": "dotacja", 
        "buyer": {
            "email": payment_request.email
        }
    }
    response_data = make_post_request("v1/payments", payment_data)
    try:
        payment_response = PaymentResponse(**response_data)
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=e.errors())
    return payment_response
