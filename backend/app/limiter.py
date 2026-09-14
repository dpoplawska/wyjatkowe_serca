from fastapi import Request
from slowapi import Limiter


def get_real_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host


# Default applies to every route (SlowAPIMiddleware); sensitive routes set
# tighter per-route limits. Keyed by client IP, so a family behind one NAT
# shares a budget — generous enough that autosave never hits it.
limiter = Limiter(key_func=get_real_ip, default_limits=["120/minute"])
