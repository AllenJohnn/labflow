import certifi
from pymongo import AsyncMongoClient
from app.config.settings import settings

class MongoDBWrapper:
    def __init__(self):
        self.client = None
        self.db = None

    def connect(self):
        self.client = AsyncMongoClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=800,
            connectTimeoutMS=800,
            socketTimeoutMS=800
        )
        self.db = self.client[settings.MONGODB_DB]

    async def close(self):
        if self.client:
            await self.client.close()

    def __getattr__(self, name):
        if self.db is None:
            raise RuntimeError("Database connection not initialized")
        return getattr(self.db, name)
        
    def __getitem__(self, name):
        if self.db is None:
            raise RuntimeError("Database connection not initialized")
        return self.db[name]

    @property
    def admin(self):
        if self.client is None:
            raise RuntimeError("Database connection not initialized")
        return self.client.admin

db_wrapper = MongoDBWrapper()

client = db_wrapper
db = db_wrapper

async def check_database_connection():
    try:
        await client.admin.command("ping")
        print(f"[MongoDB] Connection successful. Database: {settings.MONGODB_DB}")
        return True
    except Exception as e:
        print(f"[MongoDB] Connection failed: {e}")
        raise
