"""Cloud Storage access and V4 URL signing.

On Cloud Run there is no service-account key file, so URLs are signed through
the IAM signBlob API using the runtime service account's access token. The
credentials are resolved once and refreshed only when expired.
"""
import os
from datetime import timedelta
from functools import lru_cache

import google.auth
from google.auth.transport import requests as gauth_requests
from firebase_admin import storage as firebase_storage

from app.db import initialize_firestore

DOCUMENTS_BUCKET = os.getenv("DOCUMENTS_BUCKET", "wyjatkowe-serca-documents")


def get_bucket(name: str = DOCUMENTS_BUCKET):
    initialize_firestore()
    return firebase_storage.bucket(name)


@lru_cache(maxsize=1)
def _credentials():
    creds, _ = google.auth.default()
    return creds


def signed_url(blob, method: str, ttl: timedelta, **kwargs) -> str:
    creds = _credentials()
    if hasattr(creds, "sign_bytes"):  # service-account key file (local dev)
        return blob.generate_signed_url(version="v4", expiration=ttl, method=method, **kwargs)
    if not creds.valid:
        creds.refresh(gauth_requests.Request())
    return blob.generate_signed_url(
        version="v4",
        expiration=ttl,
        method=method,
        service_account_email=creds.service_account_email,
        access_token=creds.token,
        **kwargs,
    )
