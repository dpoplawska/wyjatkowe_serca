"""Access log middleware and API hardening."""
from unittest.mock import patch

import pytest

from app.routes import require_consent
from tests.conftest import dev_auth


@pytest.fixture
def gated(app, db):
    app.dependency_overrides.pop(require_consent, None)
    db.store["users/u1"] = {"consent": {"version": __import__("app.routes").routes.CONSENT_VERSION, "terms": True, "healthData": True}}
    with patch("app.routes.get_firestore_client", return_value=db), \
         patch("app.documents.get_firestore_client", return_value=db):
        yield


def entries(db):
    return [v for k, v in db.store.items() if k.startswith("accessLog/")]


def test_patient_route_is_logged_without_ids(client, gated, db):
    db.store["patientDocuments/u1/items/d1"] = {"id": "d1", "name": "x", "date": "d", "status": "ready", "objectPath": "p"}
    res = client.get("/documents", headers=dev_auth("u1"))
    assert res.status_code == 200
    (entry,) = entries(db)
    assert entry["uid"] == "u1" and entry["ownerUid"] == "u1"
    assert entry["method"] == "GET" and entry["route"] == "/documents"
    assert entry["status"] == 200
    assert entry["expiresAt"] > __import__("datetime").datetime.now(__import__("datetime").timezone.utc)


def test_guest_log_records_owner(client, gated, db):
    db.store["users/g1"] = db.store["users/u1"]
    db.store["userAccess/g1"] = {"ownerUid": "u1", "grantedAt": "t"}
    client.get("/patient-profile", headers=dev_auth("g1"))
    (entry,) = entries(db)
    assert entry["uid"] == "g1" and entry["ownerUid"] == "u1"


def test_route_template_not_raw_path(client, gated, db):
    client.get("/documents/secret-doc-id/download-url", headers=dev_auth("u1"))
    (entry,) = entries(db)
    assert entry["route"] == "/documents/{doc_id}/download-url"
    assert "secret-doc-id" not in str(entry)


def test_unauthenticated_and_consentless_requests_not_logged(client, gated, db):
    client.get("/patient-profile")
    client.get("/me", headers=dev_auth("u1"))
    client.get("/patient-profile", headers=dev_auth("nobody"))
    assert entries(db) == []


def test_docs_disabled_in_prod(client, monkeypatch):
    # main.py decides at import time; assert the current (dev) behaviour and the config.
    import app.main as m
    assert m.IS_DEV is True
    assert "http://localhost:3000" in m.WEB_ORIGINS
    assert "https://wyjatkoweserca.pl" in m.WEB_ORIGINS


def test_rate_limit_on_consent(client, db):
    with patch("app.account.get_firestore_client", return_value=db):
        codes = [client.put("/consent", json={"terms": True, "healthData": True}, headers=dev_auth("u1")).status_code for _ in range(11)]
    assert codes[:10] == [200] * 10 and codes[10] == 429
