from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    PROJECT_NAME = "LabFlow API"
    VERSION = "1.0.0"

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")

    MONGODB_URI = os.getenv("MONGODB_URI", "")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "labflow")


settings = Settings()