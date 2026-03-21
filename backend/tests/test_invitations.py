from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from tests.conftest import mock_doc, dev_auth


def future_ts() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()


def past_ts() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()


# ---------------------------------------------------------------------------
# POST /invite
# ---------------------------------------------------------------------------

def test_create_invite_owner_gets_token(client):
    no_access = mock_doc(None)  # resolve_uid: user is owner
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = no_access

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/invite", headers=dev_auth("owner-uid"))

    assert res.status_code == 200
    assert "token" in res.json()
    mock_db.collection().document().set.assert_called_once()


def test_create_invite_guest_is_forbidden(client):
    # resolve_uid returns a different ownerUid → user is a guest
    access_doc = mock_doc({"ownerUid": "real-owner"})
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = access_doc

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/invite", headers=dev_auth("guest-uid"))

    assert res.status_code == 403


# ---------------------------------------------------------------------------
# GET /invite/{token}
# ---------------------------------------------------------------------------

def test_get_invite_valid(client):
    invite = {"ownerUid": "owner-1", "expiresAt": future_ts(), "used": False}
    invite_doc = mock_doc(invite)
    profile_doc = mock_doc({"imie_nazwisko": "Jan Kowalski"})
    caller_profile = mock_doc(None)  # caller has no existing data

    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [
        invite_doc,      # invitation doc
        profile_doc,     # owner's profile (child name)
        caller_profile,  # caller's profile (has existing data check)
    ]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/invite/some-token", headers=dev_auth("caller-uid"))

    assert res.status_code == 200
    body = res.json()
    assert body["ownerUid"] == "owner-1"
    assert body["childName"] == "Jan Kowalski"
    assert body["hasExistingData"] is False


def test_get_invite_not_found(client):
    no_access = mock_doc(None)
    missing = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [no_access, missing]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/invite/bad-token", headers=dev_auth())

    assert res.status_code == 404


def test_get_invite_already_used(client):
    invite = {"ownerUid": "owner-1", "expiresAt": future_ts(), "used": True}
    invite_doc = mock_doc(invite)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = invite_doc

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/invite/used-token", headers=dev_auth())

    assert res.status_code == 410


def test_get_invite_expired(client):
    invite = {"ownerUid": "owner-1", "expiresAt": past_ts(), "used": False}
    invite_doc = mock_doc(invite)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = invite_doc

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/invite/expired-token", headers=dev_auth())

    assert res.status_code == 410


# ---------------------------------------------------------------------------
# POST /accept-invite/{token}
# ---------------------------------------------------------------------------

def test_accept_invite_success(client):
    invite = {"ownerUid": "owner-1", "expiresAt": future_ts(), "used": False}
    invite_doc = mock_doc(invite)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = invite_doc

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/accept-invite/valid-token", headers=dev_auth("new-uid"))

    assert res.status_code == 200
    mock_db.collection().document().set.assert_called_once()
    mock_db.collection().document().update.assert_called_once()


def test_accept_invite_own_invite_rejected(client):
    invite = {"ownerUid": "same-uid", "expiresAt": future_ts(), "used": False}
    invite_doc = mock_doc(invite)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = invite_doc

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/accept-invite/self-token", headers=dev_auth("same-uid"))

    assert res.status_code == 400


def test_accept_invite_expired(client):
    invite = {"ownerUid": "owner-1", "expiresAt": past_ts(), "used": False}
    invite_doc = mock_doc(invite)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = invite_doc

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.post("/accept-invite/expired-token", headers=dev_auth())

    assert res.status_code == 410
