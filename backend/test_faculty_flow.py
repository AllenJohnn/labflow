import asyncio
import httpx
from app.main import app

async def test_flow():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver/api/v1", timeout=10.0) as client:
        print("=== LABFLOW FACULTY WORKFLOW VERIFICATION ===")

        print("\n1. Testing Health...")
        res = await client.get("/health/")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(f"   [PASS] Health OK: {res.json()}")

        print("\n2. Testing Faculty Login (Rakhi)...")
        login_res = await client.post("/auth/faculty/login", json={
            "email": "faculty@fisat.ac.in",
            "password": "faculty123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"   [PASS] Faculty Authenticated. Role: {login_data.get('user', {}).get('role')}")

        print("\n3. Testing GET /faculty/laboratories (Assigned labs only)...")
        labs_res = await client.get("/faculty/laboratories", headers=headers)
        assert labs_res.status_code == 200, f"Labs fetch failed: {labs_res.text}"
        labs = labs_res.json().get("data", [])
        lab_codes = [l["code"] for l in labs]
        print(f"   [PASS] Assigned Labs ({len(labs)}): {lab_codes}")
        assert "NSA" in lab_codes, "NSA should be assigned to Rakhi"
        assert "DBMS" not in lab_codes, "DBMS should NOT be visible to Rakhi"
        assert "JAVA" not in lab_codes, "JAVA should NOT be visible to Rakhi"

        print("\n4. Testing Faculty Authorization Enforcement (Security check)...")
        unauth_lab = await client.get("/faculty/laboratories/dbms", headers=headers)
        assert unauth_lab.status_code == 403, f"Expected 403 Forbidden for DBMS, got {unauth_lab.status_code}"
        print("   [PASS] Unauthorized access to /faculty/laboratories/dbms rejected with 403 Forbidden.")

        unauth_ex = await client.get("/faculty/laboratories/java/exercises", headers=headers)
        assert unauth_ex.status_code == 403, f"Expected 403 Forbidden for JAVA exercises, got {unauth_ex.status_code}"
        print("   [PASS] Unauthorized access to /faculty/laboratories/java/exercises rejected with 403 Forbidden.")

        unauth_assign = await client.patch("/faculty/exercises/dbms-ex3/assign", headers=headers)
        assert unauth_assign.status_code in [400, 403], f"Expected rejection for unauthorized assign, got {unauth_assign.status_code}"
        print("   [PASS] Unauthorized assignment of dbms-ex3 rejected.")

        print("\n5. Testing GET /faculty/laboratories/nsa (Authorized laboratory details)...")
        nsa_res = await client.get("/faculty/laboratories/nsa", headers=headers)
        assert nsa_res.status_code == 200, f"NSA details failed: {nsa_res.text}"
        nsa_data = nsa_res.json().get("data", {})
        print(f"   [PASS] NSA Overview loaded: {nsa_data.get('name')} | Stats: {nsa_data.get('stats')}")

        print("\n6. Testing GET /faculty/laboratories/nsa/exercises (Faculty sees all exercises)...")
        ex_res = await client.get("/faculty/laboratories/nsa/exercises", headers=headers)
        assert ex_res.status_code == 200, f"Exercises failed: {ex_res.text}"
        exercises = ex_res.json().get("data", [])
        print(f"   [PASS] Total exercises in NSA: {len(exercises)}")
        for ex in exercises:
            print(f"      - Ex {ex.get('exercise_number')}: {ex.get('title')} (is_assigned: {ex.get('is_assigned')})")

        print("\n7. Testing Exercise Assignment: PATCH /faculty/exercises/nsa-ex2/assign...")
        assign_res = await client.patch("/faculty/exercises/nsa-ex2/assign", headers=headers)
        assert assign_res.status_code == 200, f"Assign failed: {assign_res.text}"
        print(f"   [PASS] Exercise Assigned: {assign_res.json().get('message')}")

        print("\n8. Verifying Assignment Persistence...")
        ex_after = await client.get("/faculty/laboratories/nsa/exercises", headers=headers)
        exercises_after = ex_after.json().get("data", [])
        ex2 = next((e for e in exercises_after if e.get("exercise_number") == "02"), None)
        assert ex2 is not None and ex2.get("is_assigned") is True, "Exercise 02 must be marked assigned"
        print(f"   [PASS] Exercise 02 is now verified as is_assigned={ex2.get('is_assigned')}")

        print("\n9. Testing GET /faculty/laboratories/nsa/submissions...")
        sub_res = await client.get("/faculty/laboratories/nsa/submissions", headers=headers)
        assert sub_res.status_code == 200, f"Submissions failed: {sub_res.text}"
        submissions = sub_res.json().get("data", [])
        print(f"   [PASS] Submissions loaded: {len(submissions)} records")

        print("\n10. Testing GET /faculty/laboratories/nsa/students...")
        stu_res = await client.get("/faculty/laboratories/nsa/students", headers=headers)
        assert stu_res.status_code == 200, f"Students failed: {stu_res.text}"
        students = stu_res.json().get("data", [])
        print(f"   [PASS] Student roster loaded: {len(students)} students")

        print("\n11. Testing POST & GET /faculty/laboratories/nsa/announcements...")
        post_ann = await client.post("/faculty/laboratories/nsa/announcements", headers=headers, json={
            "title": "NSA Lab 02 is now open",
            "content": "Please implement symmetric encryption algorithms as described."
        })
        assert post_ann.status_code == 200, f"Post announcement failed: {post_ann.text}"
        get_ann = await client.get("/faculty/laboratories/nsa/announcements", headers=headers)
        assert get_ann.status_code == 200
        ann_list = get_ann.json().get("data", [])
        print(f"   [PASS] Announcements count: {len(ann_list)} | Latest: {ann_list[0].get('title')}")

        print("\n12. Testing Student View (Student sees ONLY assigned exercises)...")
        stu_login = await client.post("/auth/student/login", json={
            "email": "student@fisat.ac.in",
            "password": "student123"
        })
        assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
        stu_token = stu_login.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        stu_ex = await client.get("/student/laboratories/nsa/exercises", headers=stu_headers)
        assert stu_ex.status_code == 200, f"Student exercises failed: {stu_ex.text}"
        stu_assigned = stu_ex.json().get("data", [])
        stu_ex_nums = [e.get("exerciseNumber") for e in stu_assigned]
        print(f"   [PASS] Student visible NSA exercises: {stu_ex_nums}")
        assert "01" in stu_ex_nums, "Student must see assigned Ex 01"
        assert "02" in stu_ex_nums, "Student must see newly assigned Ex 02"
        assert "03" not in stu_ex_nums, "Student must NOT see unassigned Ex 03"
        assert "04" not in stu_ex_nums, "Student must NOT see unassigned Ex 04"

        print("\n13. Testing Student Access Control to Faculty Endpoints...")
        stu_access_faculty = await client.get("/faculty/laboratories", headers=stu_headers)
        assert stu_access_faculty.status_code == 403, f"Expected 403 for student accessing faculty API, got {stu_access_faculty.status_code}"
        print("   [PASS] Student calling /faculty/laboratories rejected with 403 Forbidden.")

        print("\n==============================================")
        print("ALL 13 FACULTY & STUDENT FLOW TESTS PASSED!")
        print("==============================================")

if __name__ == "__main__":
    asyncio.run(test_flow())
