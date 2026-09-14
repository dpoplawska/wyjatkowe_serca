"""Consent record and the consent gate on patient-data routes."""
from unittest.mock import patch

import pytest

from app.routes import CONSENT_VERSION, require_consent
from tests.conftest import dev_auth


@pytest.fixture
def gated(app, db, bypass_consent):
    app.dependency_overrides.pop(require_consent, None)
    with patch("app.routes.get_firestore_client", return_value=db), \
         patch("app.account.get_firestore_client", return_value=db), \
         patch("app.documents.get_firestore_client", return_value=db):
        yield


def consent(db, uid, version=CONSENT_VERSION, terms=True, health=True):
    db.store[f"users/{uid}"] = {"consent": {"version": version, "terms": terms, "healthData": health, "acceptedAt": "t"}}


def test_get_consent_missing(client, gated):
    res = client.get("/consent", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json() == {"accepted": False, "requiredVersion": CONSENT_VERSION, "record": None}


def test_put_consent_requires_both(client, gated):
    res = client.put("/consent", json={"terms": True, "healthData": False}, headers=dev_auth("u1"))
    assert res.status_code == 400


def test_put_consent_stores_record_and_keeps_flags(client, gated, db):
    db.store["users/u1"] = {"isAdmin": True}
    res = client.put("/consent", json={"terms": True, "healthData": True}, headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json()["accepted"] is True
    stored = db.store["users/u1"]
    assert stored["isAdmin"] is True
    assert stored["consent"]["version"] == CONSENT_VERSION
    assert stored["consent"]["acceptedAt"]
    assert client.get("/consent", headers=dev_auth("u1")).json()["accepted"] is True


def test_patient_routes_blocked_without_consent(client, gated):
    for path in ["/patient-profile", "/medications", "/inr", "/measurements", "/access", "/documents"]:
        res = client.get(path, headers=dev_auth("u1"))
        assert res.status_code == 403, path
        assert res.json()["detail"] == "consent_required"


def test_old_consent_version_is_not_enough(client, gated, db):
    consent(db, "u1", version="2000-01-01")
    assert client.get("/patient-profile", headers=dev_auth("u1")).status_code == 403


def test_patient_routes_open_with_consent(client, gated, db):
    consent(db, "u1")
    assert client.get("/patient-profile", headers=dev_auth("u1")).status_code == 200
    assert client.get("/me", headers=dev_auth("u1")).status_code == 200


def test_me_open_without_consent(client, gated):
    assert client.get("/me", headers=dev_auth("u1")).status_code == 200
