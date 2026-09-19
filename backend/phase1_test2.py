import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        # 3. Expired/malformed JWT
        res4 = await client.get("/student/me", headers={"Authorization": "Bearer malformed.token.here"})
        print(f"Malformed JWT status: {res4.status_code}, error: {res4.json().get('detail')}")

asyncio.run(main())
