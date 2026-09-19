import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        print("=== Admin Portal Tests ===")
        
        # Login
        res_login = await client.post("/auth/admin/login", json={"email": "admin@fisat.ac.in", "password": "admin123"})
        if res_login.status_code != 200:
            print("Login failed")
            return
        
        headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
        
        # 1. Profile & Stats
        res_me = await client.get("/admin/me", headers=headers)
        print(f"Profile: {res_me.status_code}")
        
        res_stats = await client.get("/admin/dashboard-stats", headers=headers)
        print(f"Stats: {res_stats.status_code}")
        
        # 2. Students & Faculty
        res_stu = await client.get("/admin/students", headers=headers)
        print(f"Students: {res_stu.status_code}")
        
        res_fac = await client.get("/admin/faculty", headers=headers)
        print(f"Faculty: {res_fac.status_code}")
        
        # 3. Settings
        res_set = await client.get("/admin/settings", headers=headers)
        print(f"Settings: {res_set.status_code}")
        
        # 4. Announcements CRUD
        ann_payload = {
            "title": "Admin Announcement",
            "content": "Test broadcast",
            "audience": "all"
        }
        res_ann = await client.post("/admin/announcements", json=ann_payload, headers=headers)
        print(f"Create Announcement: {res_ann.status_code}")

asyncio.run(main())
