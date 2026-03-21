import base64
import hmac
import json
from datetime import datetime, timezone
from hashlib import sha256
from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import mock_doc, mock_stream, dev_auth


SIGNATURE_KEY = "test-signature-key"


def make_signature(body: bytes) -> str:
    return base64.b64encode(hmac.new(SIGNATURE_KEY.encode(), body, sha256).digest()).decode()


# ---------------------------------------------------------------------------
# POST /payments
# ---------------------------------------------------------------------------

def test_create_payment_success(client):
    mock_response = MagicMock()
    mock_response.paymentId = "pay-123"
    mock_response.redirectUrl = "https://pay.now/redirect"
    mock_response.status = "PENDING"

    mock_db = MagicMock()

    with patch("app.routes.create_payment", return_value=mock_response), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/payments", json={"amount": 50, "email": "test@example.com"})

    assert res.status_code == 200
    assert res.json()["paymentId"] == "pay-123"
    assert "redirectUrl" in res.json()
    mock_db.collection().document().set.assert_called_once()


def test_create_payment_with_beneficiary_stored(client):
    mock_response = MagicMock()
    mock_response.paymentId = "pay-456"
    mock_response.redirectUrl = "https://pay.now/redirect"
    mock_response.status = "PENDING"

    mock_db = MagicMock()

    with patch("app.routes.create_payment", return_value=mock_response), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/payments", json={
            "amount": 100,
            "email": "donor@example.com",
            "beneficiary": "WS1 - Danuta Grzyb",
        })

    assert res.status_code == 200
    stored = mock_db.collection().document().set.call_args[0][0]
    assert stored["beneficiary"] == "WS1 - Danuta Grzyb"


def test_create_payment_without_beneficiary_not_stored(client):
    mock_response = MagicMock()
    mock_response.paymentId = "pay-789"
    mock_response.redirectUrl = "https://pay.now/redirect"
    mock_response.status = "PENDING"

    mock_db = MagicMock()

    with patch("app.routes.create_payment", return_value=mock_response), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/payments", json={"amount": 20, "email": "donor@example.com"})

    assert res.status_code == 200
    stored = mock_db.collection().document().set.call_args[0][0]
    assert "beneficiary" not in stored


def test_create_payment_invalid_body(client):
    res = client.post("/payments", json={"amount": 50})  # missing email
    assert res.status_code == 422


def test_create_payment_invalid_amount(client):
    res = client.post("/payments", json={"amount": 0, "email": "test@example.com"})
    assert res.status_code == 422


def test_create_payment_paynow_failure(client):
    with patch("app.routes.create_payment", side_effect=Exception("PayNow down")):
        res = client.post("/payments", json={"amount": 50, "email": "test@example.com"})
    assert res.status_code == 500


# ---------------------------------------------------------------------------
# GET /payments/total-confirmed
# ---------------------------------------------------------------------------

def test_total_confirmed_payments_sums_current_month(client):
    now = datetime.now(timezone.utc)
    month_ts = now.strftime("%Y-%m-%dT12:00:00")  # tz-naive, matches pd.Timestamp.now()

    payments = [
        {"amount": 100, "status": "CONFIRMED", "modifiedAt": month_ts},
        {"amount": 50, "status": "CONFIRMED", "modifiedAt": month_ts},
    ]

    mock_db = MagicMock()
    mock_db.collection().where().stream.return_value = mock_stream(payments)

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/payments/total-confirmed")

    assert res.status_code == 200
    assert res.json()["total"] == 150


def test_total_confirmed_payments_excludes_previous_month(client):
    payments = [
        {"amount": 999, "status": "CONFIRMED", "modifiedAt": "2020-01-15T12:00:00"},
    ]

    mock_db = MagicMock()
    mock_db.collection().where().stream.return_value = mock_stream(payments)

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/payments/total-confirmed")

    assert res.status_code == 200
    assert res.json()["total"] == 0


def test_total_confirmed_payments_empty(client):
    mock_db = MagicMock()
    mock_db.collection().where().stream.return_value = iter([])

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/payments/total-confirmed")

    assert res.status_code == 200
    assert res.json()["total"] == 0


# ---------------------------------------------------------------------------
# POST /payments/status  (PayNow webhook)
# ---------------------------------------------------------------------------

def _webhook_body(payment_id: str = "pay-123", status: str = "CONFIRMED") -> bytes:
    return json.dumps({
        "paymentId": payment_id,
        "externalId": "ext-1",
        "status": status,
        "modifiedAt": "2026-03-21T10:00:00Z",
    }).encode()


def test_payment_status_updates_payment(client):
    body = _webhook_body("pay-123", "CONFIRMED")
    sig = make_signature(body)

    payment_doc = mock_doc({"amount": 50, "email": "x@x.com", "status": "PENDING"})
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = payment_doc

    with patch("app.routes.load_secrets", return_value={"SIGNATURE_KEY": SIGNATURE_KEY}), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/payments/status", content=body, headers={"Signature": sig})

    assert res.status_code == 200
    mock_db.collection().document().update.assert_called_once()


def test_payment_status_updates_purchase_when_payment_not_found(client):
    body = _webhook_body("pur-999", "CONFIRMED")
    sig = make_signature(body)

    missing_doc = mock_doc(None)
    purchase_doc = mock_doc({"amount": 279, "units": 1, "status": "PENDING"})

    mock_db = MagicMock()
    # First call: payments collection (not found), second: purchases collection (found)
    mock_db.collection().document().get.side_effect = [missing_doc, purchase_doc]

    with patch("app.routes.load_secrets", return_value={"SIGNATURE_KEY": SIGNATURE_KEY}), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/payments/status", content=body, headers={"Signature": sig})

    assert res.status_code == 200


def test_payment_status_invalid_signature(client):
    body = _webhook_body()

    with patch("app.routes.load_secrets", return_value={"SIGNATURE_KEY": SIGNATURE_KEY}), \
         patch("app.routes.get_firestore_client", return_value=MagicMock()):
        res = client.post("/payments/status", content=body, headers={"Signature": "bad-sig"})

    assert res.status_code == 400


def test_payment_status_not_found(client):
    body = _webhook_body("unknown-id")
    sig = make_signature(body)

    missing = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = missing

    with patch("app.routes.load_secrets", return_value={"SIGNATURE_KEY": SIGNATURE_KEY}), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/payments/status", content=body, headers={"Signature": sig})

    assert res.status_code == 404


# ---------------------------------------------------------------------------
# GET /payments/all  (admin)
# ---------------------------------------------------------------------------

def test_get_all_payments_returns_list(client):
    payments = [
        {"amount": 50, "email": "a@a.com", "status": "CONFIRMED", "beneficiary": "WS1 - Danuta Grzyb"},
        {"amount": 20, "email": "b@b.com", "status": "PENDING"},
    ]
    mock_db = MagicMock()
    mock_db.collection().stream.return_value = mock_stream(payments, ids=["p1", "p2"])

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/payments/all", headers={"x-password": "any"})

    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["id"] == "p1"
    assert data[0]["beneficiary"] == "WS1 - Danuta Grzyb"
