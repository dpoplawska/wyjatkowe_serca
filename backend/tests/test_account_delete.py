"""Self-service account deletion: guests, sole owners, owners with guests."""
from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import dev_auth


@pytest.fixture
def fake_bucket():
    bucket = MagicMock()
    bucket.blob.return_value.exists.return_value = True
    return bucket


@pytest.fixture
def patched(db, fake_bucket):
    with patch("app.account.get_firestore_client", return_value=db), \
         patch("app.account.get_bucket", return_value=fake_bucket), \
         patch("app.account.firebase_auth") as fb:
        yield fb


def seed_owner(db, uid="owner"):
    db.store[f"patientProfiles/{uid}"] = {"imie_nazwisko": "Jan"}
    db.store[f"medications/{uid}"] = {"leki": []}
    db.store[f"inrHistory/{uid}"] = {"entries": []}
    db.store[f"measurements/{uid}"] = {"entries": []}
    db.store[f"users/{uid}"] = {"uploadApproved": True, "consent": {"version": "x"}}
    db.store[f"patientDocuments/{uid}/items/d1"] = {"id": "d1", "objectPath": f"ready/{uid}/d1.pdf"}
    db.store["invitations/tok1"] = {"ownerUid": uid, "used": False}
    db.store["invitations/tok-other"] = {"ownerUid": "someone-else", "used": False}


def add_guest(db, guest, owner="owner"):
    db.store[f"userAccess/{guest}"] = {"ownerUid": owner, "grantedAt": f"t-{guest}"}
    db.store[f"users/{guest}"] = {"consent": {"version": "x"}}


def test_sole_owner_is_fully_erased(client, patched, db, fake_bucket):
    seed_owner(db)
    res = client.delete("/account", headers=dev_auth("owner"))
    assert res.status_code == 200
    assert res.json()["deleted_data"] is True
    assert [k for k in db.store if "owner" in k] == []
    assert db.store["invitations/tok-other"]
    fake_bucket.blob.assert_called_with("ready/owner/d1.pdf")
    fake_bucket.blob.return_value.delete.assert_called_once()
    patched.delete_user.assert_called_once_with("owner")


def test_guest_is_unlinked_and_data_kept(client, patched, db):
    seed_owner(db)
    add_guest(db, "g1")
    res = client.delete("/account", headers=dev_auth("g1"))
    assert res.status_code == 200
    assert res.json()["deleted_data"] is False
    assert "userAccess/g1" not in db.store
    assert "users/g1" not in db.store
    assert db.store["patientProfiles/owner"]["imie_nazwisko"] == "Jan"
    patched.delete_user.assert_called_once_with("g1")


def test_owner_with_guests_transfers_by_default(client, patched, db, fake_bucket):
    seed_owner(db)
    add_guest(db, "g1")
    add_guest(db, "g2")
    res = client.delete("/account", headers=dev_auth("owner"))
    assert res.status_code == 200
    assert res.json()["deleted_data"] is False
    assert db.store["patientProfiles/g1"]["imie_nazwisko"] == "Jan"
    assert db.store["patientDocuments/g1/items/d1"]["objectPath"] == "ready/owner/d1.pdf"
    assert "userAccess/g1" not in db.store
    assert db.store["userAccess/g2"] == {"ownerUid": "g1", "grantedAt": "t-g2"}
    assert "patientProfiles/owner" not in db.store
    assert "invitations/tok1" not in db.store
    fake_bucket.blob.return_value.delete.assert_not_called()
    patched.delete_user.assert_called_once_with("owner")


def test_owner_with_guests_can_purge(client, patched, db, fake_bucket):
    seed_owner(db)
    add_guest(db, "g1")
    res = client.request("DELETE", "/account", json={"purge": True}, headers=dev_auth("owner"))
    assert res.status_code == 200
    assert res.json()["deleted_data"] is True
    assert "patientProfiles/g1" not in db.store
    assert "userAccess/g1" not in db.store
    assert db.store["users/g1"]  # the guest keeps their own account
    fake_bucket.blob.return_value.delete.assert_called_once()
    patched.delete_user.assert_called_once_with("owner")


def test_delete_requires_auth(client, patched):
    assert client.delete("/account").status_code == 422


def test_dev_delete_hidden_outside_dev(client, patched, monkeypatch):
    monkeypatch.setenv("ENV", "prod")
    assert client.delete("/dev/users/owner").status_code == 404
