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
