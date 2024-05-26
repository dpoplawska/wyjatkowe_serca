import os
from fastapi import FastAPI, HTTPException
from app.routes import router

# Ensure ENV is set
env = os.getenv('ENV')
if not env:
    raise RuntimeError("The ENV environment variable is not set. Please set it to 'dev' or 'prod'.")

app = FastAPI()

# Set CORS policy
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Adjust this to the specific origins you want to allow
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(router)

# To run the app, use: uvicorn app.main:app --reload
