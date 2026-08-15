import certifi
from pymongo import AsyncMongoClient
from app.config.settings import settings

client = AsyncMongoClient(
    settings.MONGODB_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=800,
    connectTimeoutMS=800,
    socketTimeoutMS=800
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