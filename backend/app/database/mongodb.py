import certifi
from pymongo import AsyncMongoClient
from app.config.settings import settings

client = AsyncMongoClient(
    settings.MONGODB_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000
)
db = client[settings.MONGODB_DB]


async def check_database_connection():
    try:
        await client.admin.command("ping")
        print(f"[MongoDB] Connection successful. Database: {settings.MONGODB_DB}")
        return True
    except Exception as e:
        print(f"[MongoDB] Connection failed: {e}")
        raise