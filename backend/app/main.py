from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config.settings import settings
from app.database.indexes import create_indexes
from app.services.admin_service import init_default_admin
from app.services.faculty_service import init_default_faculty
from app.services.student_service import init_default_student
from app.routes import health, auth, student, faculty, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    await init_default_admin()
    await init_default_faculty()
    await init_default_student()
    yield


app = FastAPI(
    title="LabFlow API",
    description="Backend REST API for the LabFlow Programming Laboratory Management System.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

app.include_router(
    student.router,
    prefix="/api/v1/student",
    tags=["Student"]
)

app.include_router(
    faculty.router,
    prefix="/api/v1/faculty",
    tags=["Faculty"]
)

app.include_router(
    admin.router,
    prefix="/api/v1/admin",
    tags=["Admin"]
)