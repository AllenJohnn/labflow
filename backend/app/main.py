import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config.settings import settings
from app.database.mongodb import check_database_connection
from app.database.indexes import create_indexes
from app.services.admin_service import init_default_admin
from app.services.faculty_service import init_default_faculty, init_default_lab_data
from app.services.student_service import init_default_student
from app.routes import health, auth, student, faculty, admin

async def async_db_init():
    try:
        await check_database_connection()
        await create_indexes()
        await init_default_admin()
        await init_default_faculty()
        await init_default_student()
        await init_default_lab_data()
        print("[Database] Initialization completed successfully.")
    except Exception as e:
        print(f"[Database] Startup initialization notice: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(async_db_init())
    yield

from fastapi.responses import JSONResponse
from app.services.admin_service import is_maintenance_active, get_system_settings

app = FastAPI(
    title="LabFlow API",
    description="Backend REST API for the LabFlow Programming Laboratory Management System.",
    version="1.0.0",
    lifespan=lifespan
)

@app.middleware("http")
async def maintenance_middleware(request: Request, call_next):
    path = request.url.path
    if (
        path.startswith("/api/v1/admin")
        or path.startswith("/api/v1/health")
        or path.startswith("/api/v1/auth")
        or path.startswith("/docs")
        or path.startswith("/openapi.json")
    ):
        return await call_next(request)

    if is_maintenance_active():
        sys_settings = await get_system_settings()
        if sys_settings.get("maintenance_mode", False):
            return JSONResponse(
                status_code=503,
                content={
                    "status": "maintenance",
                    "detail": sys_settings.get(
                        "maintenance_message",
                        "Maintenance in progress. The system is temporarily unavailable while maintenance is being performed. Please try again later."
                    ),
                    "expected_return": sys_settings.get("expected_return", "Shortly"),
                    "maintenance_mode": True
                }
            )

    return await call_next(request)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
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
