from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.routes import health, auth

app = FastAPI(
    title="LabFlow API",
    description="Backend REST API for the LabFlow Programming Laboratory Management System.",
    version="1.0.0"
)

app.add_middleware(
    SessionMiddleware,
    secret_key="labflow-dev-secret"
)

app.include_router(
    health.router,
    prefix="/api/v1/health",
    tags=["Health"]
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)