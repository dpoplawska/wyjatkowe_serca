"""Medical documentation upload / download / admin approval."""
from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import dev_auth


# ---------------------------------------------------------------------------
# tiny in-memory Firestore: enough for collection/document/subcollection,
# get/set/update/delete/stream and one equality `where`.


class FakeSnap:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self.exists = data is not None
        self._data = data

    def to_dict(self):
        return dict(self._data) if self._data is not None else None


class FakeDocRef:
    def __init__(self, store, path):
        self.store = store
        self.path = path

    def get(self):
        return FakeSnap(self.path.split("/")[-1], self.store.get(self.path))

    def set(self, data, merge=False):
        if merge and self.path in self.store:
            self.store[self.path] = {**self.store[self.path], **data}
        else:
            self.store[self.path] = dict(data)

    def update(self, data):
        self.store[self.path].update(data)

    def delete(self):
        self.store.pop(self.path, None)

    def collection(self, name):
        return FakeCollection(self.store, f"{self.path}/{name}")


class FakeCollection:
    def __init__(self, store, path):
        self.store = store
        self.path = path

    def document(self, doc_id):
        return FakeDocRef(self.store, f"{self.path}/{doc_id}")

    def stream(self):
        prefix = self.path + "/"
        for path, data in list(self.store.items()):
            rest = path[len(prefix):]
            if path.startswith(prefix) and "/" not in rest:
                yield FakeSnap(rest, data)


class FakeDb:
    def __init__(self, store=None):
        self.store = store if store is not None else {}

    def collection(self, name):
        return FakeCollection(self.store, name)


@pytest.fixture
def db():
    return FakeDb()


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
         patch("app.documents._bucket", return_value=fake_bucket), \
         patch("app.documents._signed_url", return_value="https://signed.example/x"):
        yield


def approve(db, uid):
    db.store[f"users/{uid}"] = {"uploadApproved": True}


UPLOAD = {"name": "wypis.pdf", "date": "2026-03-01", "size": 1024}


# ---------------------------------------------------------------------------
# /me


def test_me_defaults_false(client, patched):
    res = client.get("/me", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json() == {"uid": "u1", "isAdmin": False, "uploadApproved": False}


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


def test_upload_rejects_oversize_and_non_pdf(client, patched, db):
    approve(db, "u1")
    big = {**UPLOAD, "size": 50 * 1024 * 1024 + 1}
    assert client.post("/documents/upload-url", json=big, headers=dev_auth("u1")).status_code == 400
    jpg = {**UPLOAD, "name": "skan.jpg"}
    assert client.post("/documents/upload-url", json=jpg, headers=dev_auth("u1")).status_code == 400


def test_upload_enforces_per_patient_total(client, patched, db):
    approve(db, "u1")
    db.store["patientDocuments/u1/items/old"] = {
        "id": "old", "name": "a.pdf", "date": "2026-01-01",
        "size": 199 * 1024 * 1024, "status": "ready", "objectPath": "ready/u1/old.pdf",
    }
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


def _pending(db, uid="u1", doc_id="d1"):
    db.store[f"patientDocuments/{uid}/items/{doc_id}"] = {
        "id": doc_id, "name": "wypis.pdf", "date": "2026-03-01", "size": 1024,
        "status": "pending", "objectPath": f"pending/{uid}/{doc_id}.pdf", "createdAt": "t",
    }


def test_complete_promotes_to_ready(client, patched, db, fake_bucket):
    _pending(db)
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json()["size"] == 1234  # real size from storage, not the client's claim
    entry = db.store["patientDocuments/u1/items/d1"]
    assert entry["status"] == "ready"
    assert entry["objectPath"] == "ready/u1/d1.pdf"
    fake_bucket.copy_blob.assert_called_once()
    fake_bucket.blob.return_value.delete.assert_called_once()
    listed = client.get("/documents", headers=dev_auth("u1")).json()
    assert [d["id"] for d in listed] == ["d1"]
    assert "objectPath" not in listed[0]


def test_complete_without_object(client, patched, db, fake_bucket):
    _pending(db)
    fake_bucket.blob.return_value.exists.return_value = False
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 400
    assert db.store["patientDocuments/u1/items/d1"]["status"] == "pending"


@pytest.mark.parametrize("attr,value", [
    ("size", 50 * 1024 * 1024 + 1),
    ("content_type", "image/jpeg"),
])
def test_complete_rejects_bad_object(client, patched, db, fake_bucket, attr, value):
    _pending(db)
    setattr(fake_bucket.blob.return_value, attr, value)
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 400
    assert "patientDocuments/u1/items/d1" not in db.store
    fake_bucket.blob.return_value.delete.assert_called_once()


def test_complete_rejects_fake_pdf_by_magic(client, patched, db, fake_bucket):
    _pending(db)
    fake_bucket.blob.return_value.download_as_bytes.return_value = b"MZ\x90\x00\x03"
    res = client.post("/documents/d1/complete", headers=dev_auth("u1"))
    assert res.status_code == 400
    assert "patientDocuments/u1/items/d1" not in db.store


# ---------------------------------------------------------------------------
# download / delete


def _ready(db, uid="u1", doc_id="d1"):
    db.store[f"patientDocuments/{uid}/items/{doc_id}"] = {
        "id": doc_id, "name": "wypis.pdf", "date": "2026-03-01", "size": 1234,
        "status": "ready", "objectPath": f"ready/{uid}/{doc_id}.pdf", "createdAt": "t",
    }


def test_download_url_for_ready_doc(client, patched, db):
    _ready(db)
    res = client.get("/documents/d1/download-url", headers=dev_auth("u1"))
    assert res.status_code == 200
    assert res.json()["url"].startswith("https://")


def test_download_url_pending_is_404(client, patched, db):
    _pending(db)
    assert client.get("/documents/d1/download-url", headers=dev_auth("u1")).status_code == 404


def test_other_user_cannot_see_documents(client, patched, db):
    _ready(db, uid="u1")
    assert client.get("/documents", headers=dev_auth("u2")).json() == []
    assert client.get("/documents/d1/download-url", headers=dev_auth("u2")).status_code == 404
    assert client.delete("/documents/d1", headers=dev_auth("u2")).status_code == 404
    assert "patientDocuments/u1/items/d1" in db.store


def test_guest_can_open_owner_documents(client, patched, db):
    _ready(db, uid="owner")
    db.store["userAccess/guest"] = {"ownerUid": "owner"}
    assert [d["id"] for d in client.get("/documents", headers=dev_auth("guest")).json()] == ["d1"]
    assert client.get("/documents/d1/download-url", headers=dev_auth("guest")).status_code == 200


def test_delete_removes_object_and_entry(client, patched, db, fake_bucket):
    _ready(db)
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
    with patch("app.documents.firebase_auth.get_user", side_effect=Exception("no auth in tests")):
        res = client.get("/admin/users", headers=dev_auth("admin"))
    assert res.status_code == 200
    by_uid = {u["uid"]: u for u in res.json()}
    assert by_uid["u2"]["name"] == "Jan Kowalski"
    assert by_uid["u2"]["uploadApproved"] is False
    assert by_uid["admin"]["isAdmin"] is True

    res = client.put("/admin/users/u2/approval", json={"approved": True}, headers=dev_auth("admin"))
    assert res.status_code == 200
    assert db.store["users/u2"]["uploadApproved"] is True
    assert db.store["users/u2"]["approvedBy"] == "admin"
    # approval now unlocks upload for u2
    assert client.post("/documents/upload-url", json=UPLOAD, headers=dev_auth("u2")).status_code == 200
