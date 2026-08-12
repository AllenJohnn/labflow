import asyncio
import ssl
from pymongo import AsyncMongoClient
from app.config.settings import settings

async def main():
    print("Testing MongoDB Atlas connection...")
    print("URI:", settings.MONGODB_URI)
    try:
        client = AsyncMongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True
        )
        res = await client.admin.command("ping")
        print("SUCCESS! MongoDB Atlas connected successfully:", res)
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
