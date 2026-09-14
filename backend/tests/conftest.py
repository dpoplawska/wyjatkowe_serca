import os
os.environ.setdefault("ENV", "dev")

import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient


def mock_doc(data: dict | None):
    """Return a mock Firestore document snapshot."""
    d = MagicMock()
    d.exists = data is not None
    d.to_dict.return_value = data
    return d


def mock_stream(rows: list[dict], ids: list[str] | None = None):
    """Return an iterator of mock Firestore document snapshots."""
    result = []
    for i, data in enumerate(rows):
        m = MagicMock()
        m.id = (ids[i] if ids else f"doc{i}")
        m.to_dict.return_value = data
        result.append(m)
    return iter(result)


@pytest.fixture(scope="session")
def app():
    from app.main import app as _app
    return _app


@pytest.fixture
def client(app):
    return TestClient(app, raise_server_exceptions=False)


# Access log writes go to the in-memory db; rate-limit counters reset per test
# so the session-wide default limit never trips across the suite.
@pytest.fixture(autouse=True)
def isolate_side_effects(db):
    from unittest.mock import patch
    from app.limiter import limiter
    limiter.reset()
    with patch("app.audit.get_firestore_client", return_value=db):
        yield


# The consent gate wraps every patient-data route. Tests that don't exercise
# it bypass the Firestore lookup so their MagicMock call sequences stay put;
# test_consent.py drops the override to test the gate itself.
@pytest.fixture(autouse=True)
def bypass_consent(app):
    from app.routes import require_consent, verify_token
    from fastapi import Depends

    def passthrough(uid: str = Depends(verify_token)) -> str:
        return uid

    app.dependency_overrides[require_consent] = passthrough
    yield
    app.dependency_overrides.pop(require_consent, None)


# Convenience: Authorization header for dev token
def dev_auth(uid: str = "test-uid") -> dict:
    return {"Authorization": f"Bearer dev:{uid}"}


# ---------------------------------------------------------------------------
# In-memory Firestore: collection/document/subcollection paths, get/set/
# update/delete/stream. Prefer this over MagicMock chains when a test touches
# more than one collection or a subcollection.


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

    def add(self, data):
        import uuid
        ref = self.document(uuid.uuid4().hex)
        ref.set(data)
        return None, ref

    def where(self, field, op, value):
        assert op == "=="
        return FakeQuery(self, field, value)

    def stream(self):
        prefix = self.path + "/"
        for path, data in list(self.store.items()):
            rest = path[len(prefix):]
            if path.startswith(prefix) and "/" not in rest:
                yield FakeSnap(rest, data)


class FakeQuery:
    def __init__(self, collection, field, value):
        self.collection, self.field, self.value = collection, field, value

    def stream(self):
        for snap in self.collection.stream():
            if (snap.to_dict() or {}).get(self.field) == self.value:
                yield snap


class FakeDb:
    def __init__(self, store=None):
        self.store = store if store is not None else {}

    def collection(self, name):
        return FakeCollection(self.store, name)


@pytest.fixture
def db():
    return FakeDb()
