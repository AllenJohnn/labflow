import asyncio
import httpx
import jwt
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        print("=== Auth & RBAC Tests ===")
        
        # 1. Wrong password -> correct rejection, no user enumeration
        res1 = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "wrong"})
        print(f"Wrong pass student status: {res1.status_code}, error: {res1.json().get('detail')}")
        
        res2 = await client.post("/auth/student/login", json={"email": "nonexistent@fisat.ac.in", "password": "wrong"})
        print(f"Nonexistent student status: {res2.status_code}, error: {res2.json().get('detail')}")
        
        # 2. Valid login
        res3 = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        print(f"Valid student login status: {res3.status_code}")
        
        if res3.status_code == 200:
            student_token = res3.json()["access_token"]
            decoded = jwt.decode(student_token, options={"verify_signature": False})
            print(f"Student role claim: {decoded.get('role')}")
        
        # 3. Expired/malformed JWT
        res4 = await client.get("/student/profile", headers={"Authorization": "Bearer malformed.token.here"})
        print(f"Malformed JWT status: {res4.status_code}, error: {res4.json().get('detail')}")
        
        # 4. Faculty ownership validation
        res_fac1 = await client.post("/auth/faculty/login", json={"email": "faculty@fisat.ac.in", "password": "faculty123"})
        if res_fac1.status_code == 200:
            fac_token = res_fac1.json()["access_token"]
            print(f"Valid faculty login status: {res_fac1.status_code}")
            
            res_labs = await client.get("/faculty/laboratories", headers={"Authorization": f"Bearer {fac_token}"})
            if res_labs.status_code == 200:
                print(f"Faculty owned labs: {[l['course_id'] for l in res_labs.json().get('data', [])]}")
            
            # Hit a lab they shouldn't own
            res_unowned = await client.get("/faculty/laboratories/some-unowned-lab", headers={"Authorization": f"Bearer {fac_token}"})
            print(f"Unowned lab access status: {res_unowned.status_code}, error: {res_unowned.json().get('detail')}")
        
        # 5. Admin endpoint with Faculty token
        res_admin = await client.get("/admin/students", headers={"Authorization": f"Bearer {fac_token}"})
        print(f"Admin endpoint with Faculty token status: {res_admin.status_code}, error: {res_admin.json().get('detail')}")

asyncio.run(main())
