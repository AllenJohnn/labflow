import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        print("=== Student Portal Tests ===")
        
        # Login
        res_login = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        if res_login.status_code != 200:
            print("Login failed")
            return
        
        headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
        
        # 1. Profile / Dashboard
        res_me = await client.get("/student/me", headers=headers)
        print(f"Profile: {res_me.status_code}")
        
        # 2. Update Profile
        res_upd = await client.put("/student/profile", json={"github_username": "new_github_name"}, headers=headers)
        print(f"Profile Update: {res_upd.status_code}")
        
        # 3. Laboratories
        res_labs = await client.get("/student/laboratories", headers=headers)
        print(f"Laboratories: {res_labs.status_code}")
        labs_data = res_labs.json().get("data", []) if res_labs.status_code == 200 else []
        print(f"  Found {len(labs_data)} labs")
        
        if labs_data:
            course_id = labs_data[0].get("course_id", "nsa")
            # 4. Exercises for a lab
            res_ex = await client.get(f"/student/laboratories/{course_id}/exercises", headers=headers)
            print(f"Exercises for {course_id}: {res_ex.status_code}")
            
        # 5. All Exercises
        res_allex = await client.get("/student/exercises", headers=headers)
        print(f"All Exercises: {res_allex.status_code}")
        
        # 6. Submissions list
        res_sub = await client.get("/student/submissions", headers=headers)
        print(f"Submissions: {res_sub.status_code}")
        
        # 7. Attendance
        res_att = await client.get("/student/attendance", headers=headers)
        print(f"Attendance: {res_att.status_code}")
        
        # Check the payloads to see if they are returning dummy/static data
        print("\n--- Data Samples ---")
        if res_me.status_code == 200:
            print("Profile Data:", res_me.json().get('data'))
        if labs_data:
            print("Lab 0:", labs_data[0])
        if res_att.status_code == 200:
            print("Attendance Data:", res_att.json().get('data', {}).keys())

asyncio.run(main())
