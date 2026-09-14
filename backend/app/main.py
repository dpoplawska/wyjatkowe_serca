import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.audit import AccessLogMiddleware
from app.limiter import limiter
from app.routes import router
from app.documents import router as documents_router
from app.account import router as account_router

# Ensure ENV is set
env = os.getenv('ENV')
if not env:
    raise RuntimeError("The ENV environment variable is not set. Please set it to 'dev' or 'prod'.")

IS_DEV = env == "dev"

# Interactive API docs only in dev: the schema lists every patient-data route.
app = FastAPI(
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Browsers only call the API from the website; the mobile app is native.
WEB_ORIGINS = [
    "https://wyjatkoweserca.pl",
    "https://www.wyjatkoweserca.pl",
    "https://wyjatkowe-serca-app.web.app",
    "https://wyjatkowe-serca-app.firebaseapp.com",
]
if IS_DEV:
    WEB_ORIGINS.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=WEB_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AccessLogMiddleware)

app.include_router(router)
app.include_router(documents_router)
app.include_router(account_router)

# To run the app, use: uvicorn app.main:app --reload
