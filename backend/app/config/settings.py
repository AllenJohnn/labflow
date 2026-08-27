from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME = "LabFlow API"
    VERSION = "1.0.0"

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    MONGODB_URI = os.getenv("MONGODB_URI", "")
    MONGODB_DB = os.getenv("MONGODB_DB", "labflow")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # LabFlow Phase 2 IDE Demo Mode
    IDE_DEMO_MODE = os.getenv("IDE_DEMO_MODE", "true").lower() in ("true", "1", "yes")
    DEMO_EXERCISE_IDS = ["nsa-ex1", "nsa-ex2"]
    DEMO_STUDENT_EMAIL = os.getenv("DEFAULT_STUDENT_EMAIL", "student@fisat.ac.in")

    # LabFlow Phase 3 IDE Execution Sandbox (Judge0)
    IDE_EXECUTION_ENABLED = os.getenv("IDE_EXECUTION_ENABLED", "true").lower() in ("true", "1", "yes")
    JUDGE0_API_URL = os.getenv("JUDGE0_API_URL", "") # e.g. https://judge0-ce.p.rapidapi.com
    JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY", "")
    IDE_EXECUTION_TIMEOUT_SECONDS = float(os.getenv("IDE_EXECUTION_TIMEOUT_SECONDS", "5.0"))
    IDE_MAX_OUTPUT_BYTES = int(os.getenv("IDE_MAX_OUTPUT_BYTES", "65536")) # 64KB
    IDE_MEMORY_LIMIT_KB = int(os.getenv("IDE_MEMORY_LIMIT_KB", "128000")) # 128MB

settings = Settings()
