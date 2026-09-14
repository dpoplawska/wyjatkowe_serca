"""Access log for patient data (RODO accountability, art. 5(2)).

One document per authenticated request to a patient-data route: who, when,
which route, whose profile, and the status code. Never request or response
bodies. Routes mark themselves by setting request.state.audit_uid (done in
`require_consent`), so anything without it — /me, /consent, payments, dev —
is not logged.

The write happens after the response is sent. Entries carry `expiresAt`
(ACCESS_LOG_RETENTION_DAYS ahead) for a Firestore TTL policy; enable it with
`make firestore-ttl`.
"""
import logging
from datetime import datetime, timedelta, timezone

from starlette.background import BackgroundTask
from starlette.middleware.base import BaseHTTPMiddleware

from app.db import get_firestore_client

ACCESS_LOG_COLLECTION = "accessLog"
ACCESS_LOG_RETENTION_DAYS = 90


def write_access_log(entry: dict) -> None:
    try:
        get_firestore_client().collection(ACCESS_LOG_COLLECTION).add(entry)
    except Exception:
        logging.exception("Failed to write access log entry")


def build_entry(request, status_code: int) -> dict:
    now = datetime.now(timezone.utc)
    route = request.scope.get("route")
    return {
        "uid": request.state.audit_uid,
        "ownerUid": getattr(request.state, "audit_owner_uid", request.state.audit_uid),
        "method": request.method,
        # Route template ("/documents/{doc_id}") rather than the raw path, so
        # document ids never end up in the log.
        "route": getattr(route, "path", request.url.path),
        "status": status_code,
        "at": now.isoformat(),
        "expiresAt": now + timedelta(days=ACCESS_LOG_RETENTION_DAYS),
    }


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if getattr(request.state, "audit_uid", None):
            response.background = BackgroundTask(write_access_log, build_entry(request, response.status_code))
        return response
