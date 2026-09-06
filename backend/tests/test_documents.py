"""Medical documentation upload / download / admin approval."""
from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import NotFound

from tests.conftest import dev_auth


@pytest.fixture
def fake_bucket():
    bucket = MagicMock()
    blob = MagicMock()
    blob.exists.return_value = True
    blob.size = 1234
    blob.content_type = "application/pdf"
    blob.download_as_bytes.return_value = b"%PDF-1.4"
    bucket.blob.return_value = blob
    return bucket


@pytest.fixture
def patched(db, fake_bucket):
    with patch("app.documents.get_firestore_client", return_value=db), \
         patch("app.routes.get_firestore_client", return_value=db), \
         patch("app.documents.get_bucket", return_value=fake_bucket), \
         patch("app.documents.signed_url", return_value="https://signed.example/x"):
        yield


def approve(db, uid):
    db.store[f"users/{uid}"] = {"uploadApproved": True}


def add_doc(db, status, uid="u1", doc_id="d1", size=1024):
    db.store[f"patientDocuments/{uid}/items/{doc_id}"] = {
        "id": doc_id, "name": "wypis.pdf", "date": "2026-03-01", "size": size,
        "status": status, "objectPath": f"{status}/{uid}/{doc_id}.pdf", "createdAt": "t",
    }


UPLOAD = {"name": "wypis.pdf", "date": "2026-03-01", "size": 1024}


# ---------------------------------------------------------------------------
# /me


def test_me_defaults_false(client, patched):
    res = client.get("/me", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json() == {"isAdmin": False, "uploadApproved": False}


# ---------------------------------------------------------------------------
# upload-url


def test_upload_requires_approval(client, patched):
    res = client.post("/documents/upload-url", json=UPLOAD, headers=dev_auth("u1"))
    assert res.status_code == 403


def test_upload_url_creates_pending_entry(client, patched, db):
    approve(db, "u1")
    res = client.post("/documents/upload-url", json=UPLOAD, headers=dev_auth("u1"))
    assert res.status_code == 200
    body = res.json()
    assert body["uploadUrl"].startswith("https://")
    assert body["headers"]["Content-Type"] == "application/pdf"
    entry = db.store[f"patientDocuments/u1/items/{body['documentId']}"]
    assert entry["status"] == "pending"
    assert entry["objectPath"] == f"pending/u1/{body['documentId']}.pdf"
    # pending entries are not listed
    assert client.get("/documents", headers=dev_auth("u1")).json() == []


@pytest.mark.parametrize("bad", [
    {**UPLOAD, "size": 50 * 1024 * 1024 + 1},
    {**UPLOAD, "name": "skan.jpg"},
    {**UPLOAD, "size": 0},
])
def test_upload_rejects_invalid_request(client, patched, db, bad):
    approve(db, "u1")
    assert client.post("/documents/upload-url", json=bad, headers=dev_auth("u1")).status_code == 422


def test_upload_enforces_per_patient_total(client, patched, db):
    approve(db, "u1")
    add_doc(db, "ready", doc_id="old", size=199 * 1024 * 1024)
    req = {**UPLOAD, "size": 2 * 1024 * 1024}
    res = client.post("/documents/upload-url", json=req, headers=dev_auth("u1"))
    assert res.status_code == 400
    assert "200 MB" in res.json()["detail"]


def test_guest_uploads_into_owner_profile(client, patched, db):
    approve(db, "guest")
    db.store["userAccess/guest"] = {"ownerUid": "owner"}
    res = client.post("/documents/upload-url", json=UPLOAD, headers=dev_auth("guest"))
    assert res.status_code == 200
    entry = db.store[f"patientDocuments/owner/items/{res.json()['documentId']}"]
    assert entry["uploadedBy"] == "guest"


# ---------------------------------------------------------------------------
# complete


def test_complete_promotes_to_ready(client, patched, db, fake_bucket):
    add_doc(db, "pending")
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json()["size"] == 1234  # real size from storage, not the client's claim
    entry = db.store["patientDocuments/u1/items/d1"]
    assert entry["status"] == "ready"
    assert entry["objectPath"] == "ready/u1/d1.pdf"
    fake_bucket.copy_blob.assert_called_once()
    fake_bucket.blob.return_value.delete.assert_called_once()
    listed = client.get("/documents", headers=dev_auth("u1")).json()
    assert listed == [{"id": "d1", "name": "wypis.pdf", "date": "2026-03-01", "size": 1234}]


def test_complete_without_object(client, patched, db, fake_bucket):
    add_doc(db, "pending")
    fake_bucket.blob.return_value.reload.side_effect = NotFound("missing")
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 400
    assert db.store["patientDocuments/u1/items/d1"]["status"] == "pending"


@pytest.mark.parametrize("attr,value", [
    ("size", 50 * 1024 * 1024 + 1),
    ("content_type", "image/jpeg"),
])
def test_complete_rejects_bad_object(client, patched, db, fake_bucket, attr, value):
    add_doc(db, "pending")
    setattr(fake_bucket.blob.return_value, attr, value)
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 400
    assert "patientDocuments/u1/items/d1" not in db.store
    fake_bucket.blob.return_value.delete.assert_called_once()


def test_complete_rejects_fake_pdf_by_magic(client, patched, db, fake_bucket):
    add_doc(db, "pending")
    fake_bucket.blob.return_value.download_as_bytes.return_value = b"MZ\x90\x00\x03"
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 400
    assert "patientDocuments/u1/items/d1" not in db.store


# ---------------------------------------------------------------------------
# download / delete


def test_download_url_for_ready_doc(client, patched, db):
    add_doc(db, "ready")
    res = client.get("/documents/d1/download-url", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json()["url"].startswith("https://")


def test_download_url_pending_is_404(client, patched, db):
    add_doc(db, "pending")
    assert client.get("/documents/d1/download-url", headers=dev_auth("u1")).status_code == 404


def test_other_user_cannot_see_documents(client, patched, db):
    add_doc(db, "ready", uid="u1")
    assert client.get("/documents", headers=dev_auth("u2")).json() == []
    assert client.get("/documents/d1/download-url", headers=dev_auth("u2")).status_code == 404
    assert client.delete("/documents/d1", headers=dev_auth("u2")).status_code == 404
    assert "patientDocuments/u1/items/d1" in db.store


def test_guest_can_open_owner_documents(client, patched, db):
    add_doc(db, "ready", uid="owner")
    db.store["userAccess/guest"] = {"ownerUid": "owner"}
    assert [d["id"] for d in client.get("/documents", headers=dev_auth("guest")).json()] == ["d1"]
    assert client.get("/documents/d1/download-url", headers=dev_auth("guest")).status_code == 200


def test_delete_removes_object_and_entry(client, patched, db, fake_bucket):
    add_doc(db, "ready")
    res = client.delete("/documents/d1", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert "patientDocuments/u1/items/d1" not in db.store
    fake_bucket.blob.return_value.delete.assert_called_once()


# ---------------------------------------------------------------------------
# admin


def test_admin_endpoints_require_admin_flag(client, patched, db):
    assert client.get("/admin/users", headers=dev_auth("u1")).status_code == 403
    res = client.put("/admin/users/u2/approval", json={"approved": True}, headers=dev_auth("u1"))
    assert res.status_code == 403
    assert "users/u2" not in db.store


def test_admin_lists_and_approves(client, patched, db):
    db.store["users/admin"] = {"isAdmin": True}
    db.store["patientProfiles/u2"] = {"imie_nazwisko": "Jan Kowalski"}
    u2 = MagicMock(uid="u2", email="u2@example.com")
    with patch("app.documents.firebase_auth.get_users", return_value=MagicMock(users=[u2])) as get_users:
        res = client.get("/admin/users", headers=dev_auth("admin"))
    assert res.status_code == 200
    assert get_users.call_count == 1  # one batched lookup, not one call per user
    by_uid = {u["uid"]: u for u in res.json()}
    assert by_uid["u2"] == {
        "uid": "u2", "email": "u2@example.com", "name": "Jan Kowalski",
        "isAdmin": False, "uploadApproved": False,
    }
    assert by_uid["admin"]["isAdmin"] is True

    res = client.put("/admin/users/u2/approval", json={"approved": True}, headers=dev_auth("admin"))
    assert res.status_code == 200
    assert db.store["users/u2"]["uploadApproved"] is True
    assert db.store["users/u2"]["approvedBy"] == "admin"
    # approval now unlocks upload for u2
    assert client.post("/documents/upload-url", json=UPLOAD, headers=dev_auth("u2")).status_code == 200
