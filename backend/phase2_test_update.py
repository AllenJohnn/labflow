import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        res_login = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
        
        res_upd = await client.put("/student/profile", json={"github_username": "new_github_name"}, headers=headers)
        res_me = await client.get("/student/me", headers=headers)
        print("Profile Data after update:", res_me.json().get('data'))

asyncio.run(main())
