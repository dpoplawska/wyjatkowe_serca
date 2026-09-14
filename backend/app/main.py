import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.routes import router
from app.documents import router as documents_router
from app.account import router as account_router

# Ensure ENV is set
env = os.getenv('ENV')
if not env:
    raise RuntimeError("The ENV environment variable is not set. Please set it to 'dev' or 'prod'.")

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(documents_router)
app.include_router(account_router)

# To run the app, use: uvicorn app.main:app --reload
