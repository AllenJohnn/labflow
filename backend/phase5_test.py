import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        print("=== Attendance Portal Tests ===")
        
        # Login
        res_login = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        if res_login.status_code != 200:
            print("Login failed")
            return
        
        headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
        
        # 1. View attendance
        res_att = await client.get("/student/attendance", headers=headers)
        print(f"Get Attendance: {res_att.status_code}")
        
        # 2. Check-in
        res_checkin = await client.post("/student/attendance/check-in", json={"course_id": "nsa"}, headers=headers)
        print(f"Check-in: {res_checkin.status_code}")
        if res_checkin.status_code == 400:
            print(f"  Failed: {res_checkin.json()}")

asyncio.run(main())
