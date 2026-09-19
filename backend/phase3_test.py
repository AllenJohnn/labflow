import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        print("=== Faculty Portal Tests ===")
        
        # Login
        res_login = await client.post("/auth/faculty/login", json={"email": "faculty@fisat.ac.in", "password": "faculty123"})
        if res_login.status_code != 200:
            print("Login failed")
            return
        
        headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
        
        # 1. Profile / Dashboard Stats
        res_me = await client.get("/faculty/me", headers=headers)
        print(f"Profile: {res_me.status_code}")
        
        res_stats = await client.get("/faculty/dashboard-stats", headers=headers)
        print(f"Dashboard Stats: {res_stats.status_code}")
        
        # 2. Laboratories
        res_labs = await client.get("/faculty/laboratories", headers=headers)
        print(f"Laboratories: {res_labs.status_code}")
        labs_data = res_labs.json().get("data", []) if res_labs.status_code == 200 else []
        
        course_id = "nsa"
        if labs_data:
            course_id = labs_data[0].get("id", "nsa")
        
        res_lab_detail = await client.get(f"/faculty/laboratories/{course_id}", headers=headers)
        print(f"Lab Details ({course_id}): {res_lab_detail.status_code}")
        
        # 3. Get Exercises for Lab
        res_ex = await client.get(f"/faculty/laboratories/{course_id}/exercises", headers=headers)
        print(f"Lab Exercises ({course_id}): {res_ex.status_code}")
        exercises = res_ex.json().get("data", []) if res_ex.status_code == 200 else []
        
        if exercises:
            ex_id = exercises[0].get("id", exercises[0].get("exercise_id"))
            # 4. Assign Exercise
            res_assign = await client.patch(f"/faculty/exercises/{ex_id}/assign", headers=headers)
            print(f"Assign Exercise ({ex_id}): {res_assign.status_code}")
            
        # 5. Submissions
        res_sub = await client.get(f"/faculty/laboratories/{course_id}/submissions", headers=headers)
        print(f"Submissions for {course_id}: {res_sub.status_code}")
        submissions = res_sub.json().get("data", []) if res_sub.status_code == 200 else []
        
        if submissions:
            sub_id = submissions[0].get("id")
            # 6. Evaluate Submission
            eval_payload = {
                "score": 9,
                "feedback": "Good job",
                "status": "graded"
            }
            res_eval = await client.post(f"/faculty/submissions/{sub_id}/evaluate", json=eval_payload, headers=headers)
            print(f"Evaluate Submission ({sub_id}): {res_eval.status_code}")
            if res_eval.status_code == 500:
                print(f"  Failed: {res_eval.text[:100]}")
        
        # 7. Update Attendance
        att_payload = {
            "date": "2026-09-19",
            "status": "present",
            "remarks": "Manual check-in test"
        }
        res_att = await client.put(f"/faculty/attendance/{course_id}/student/FIT25MCA-2008", json=att_payload, headers=headers)
        print(f"Update Attendance: {res_att.status_code}")
        if res_att.status_code == 500:
            print(f"  Failed: {res_att.text[:100]}")

asyncio.run(main())
