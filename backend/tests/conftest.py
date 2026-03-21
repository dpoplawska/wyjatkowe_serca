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
