from unittest.mock import MagicMock, patch

from tests.conftest import mock_doc, mock_stream


PURCHASE_BODY = {
    "amount": 258,
    "units": 1,
    "email": "buyer@example.com",
    "phone": "123456789",
    "name": "Jan Kowalski",
    "address": "ul. Testowa 1, 00-001 Warszawa",
    "paczkomat": False,
    "paczkomat_id": None,
}


# ---------------------------------------------------------------------------
# GET /purchases/left
# ---------------------------------------------------------------------------

def test_items_left_with_confirmed_purchases(client):
    purchases = [
        {"units": 2, "status": "CONFIRMED"},
        {"units": 3, "status": "CONFIRMED"},
        {"units": 1, "status": "PENDING"},  # not counted
    ]
    mock_db = MagicMock()
    mock_db.collection().stream.return_value = mock_stream(purchases)

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/purchases/left")

    assert res.status_code == 200
    assert res.json()["items_left"] == 40  # 45 - 5 confirmed


def test_items_left_no_purchases(client):
    mock_db = MagicMock()
    mock_db.collection().stream.return_value = iter([])

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/purchases/left")

    assert res.status_code == 200
    assert res.json()["items_left"] == 45


# ---------------------------------------------------------------------------
# POST /purchases
# ---------------------------------------------------------------------------

def test_create_purchase_success(client):
    mock_response = MagicMock()
    mock_response.purchaseId = "pur-123"
    mock_response.redirectUrl = "https://pay.now/redirect"
    mock_response.status = "PENDING"

    mock_db = MagicMock()
    mock_db.collection().stream.return_value = iter([])  # no existing purchases → 45 left

    with patch("app.routes.create_purchase", return_value=mock_response), \
         patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/purchases", json=PURCHASE_BODY)

    assert res.status_code == 200
    assert res.json()["purchaseId"] == "pur-123"
    mock_db.collection().document().set.assert_called_once()


def test_create_purchase_no_items_left(client):
    # 45 units already confirmed
    purchases = [{"units": 45, "status": "CONFIRMED"}]
    mock_db = MagicMock()
    mock_db.collection().stream.return_value = mock_stream(purchases)

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/purchases", json=PURCHASE_BODY)

    assert res.status_code == 400
    assert "No items left" in res.json()["detail"]


def test_create_purchase_invalid_body(client):
    res = client.post("/purchases", json={"amount": 258})  # missing required fields
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# GET /purchases  (admin)
# ---------------------------------------------------------------------------

def test_get_all_purchases_returns_list(client):
    purchases = [
        {**PURCHASE_BODY, "status": "CONFIRMED"},
        {**PURCHASE_BODY, "email": "other@example.com", "status": "PENDING"},
    ]
    mock_db = MagicMock()
    mock_db.collection().stream.return_value = mock_stream(purchases, ids=["pur-1", "pur-2"])

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/purchases", headers={"x-password": "any"})

    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["id"] == "pur-1"
