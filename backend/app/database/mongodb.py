from pymongo import AsyncMongoClient
from app.config.settings import settings

client = AsyncMongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB]