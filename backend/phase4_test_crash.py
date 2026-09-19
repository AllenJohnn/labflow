import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=True)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        res_login = await client.post("/auth/admin/login", json={"email": "admin@fisat.ac.in", "password": "admin123"})
        headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
        
        ann_payload = {
            "title": "Admin Announcement",
            "content": "Test broadcast",
            "audience": "all"
        }
        res_ann = await client.post("/admin/announcements", json=ann_payload, headers=headers)
        print(f"Create Announcement: {res_ann.status_code}")

asyncio.run(main())
