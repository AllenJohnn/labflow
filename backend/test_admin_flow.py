import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def run_tests():
    print("\n=======================================================")
    print("STARTING LABFLOW ADMIN & ROLE AUTHORIZATION TEST SUITE")
    print("=======================================================\n")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        print("1. Testing Admin Authentication...")
        admin_login = await client.post("/auth/admin/login", json={"email": "admin@fisat.ac.in", "password": "admin123"})
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("   [PASS] Admin authenticated successfully.")

        print("2. Testing Faculty Authentication (Rakhi)...")
        faculty_login = await client.post("/auth/faculty/login", json={"email": "faculty@fisat.ac.in", "password": "faculty123"})
        assert faculty_login.status_code == 200, f"Faculty login failed: {faculty_login.text}"
        faculty_token = faculty_login.json()["access_token"]
        faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
        print("   [PASS] Faculty authenticated successfully.")

        print("3. Testing Student Authentication (Allen John)...")
        student_login = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        assert student_login.status_code == 200, f"Student login failed: {student_login.text}"
        student_token = student_login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print("   [PASS] Student authenticated successfully.")

        print("4. Testing Admin Role Isolation & Security...")
        stud_to_admin = await client.get("/admin/stats", headers=student_headers)
        assert stud_to_admin.status_code == 403, f"Expected 403 for student accessing admin, got {stud_to_admin.status_code}"

        fac_to_admin = await client.get("/admin/stats", headers=faculty_headers)
        assert fac_to_admin.status_code == 403, f"Expected 403 for faculty accessing admin, got {fac_to_admin.status_code}"

        admin_to_admin = await client.get("/admin/stats", headers=admin_headers)
        assert admin_to_admin.status_code == 200, f"Expected 200 for admin, got {admin_to_admin.status_code}"
        print("   [PASS] Role-based access control verified (Student: 403, Faculty: 403, Admin: 200).")

        print("5. Testing Academic Classes Retrieval...")
        classes_res = await client.get("/admin/classes", headers=admin_headers)
        assert classes_res.status_code == 200
        classes_data = classes_res.json()["data"]
        assert len(classes_data["classes"]) >= 7, "Expected at least 7 academic sections"
        print(f"   [PASS] Retrieved {len(classes_data['classes'])} academic classes grouped by MCA, IMCA, CSE.")

        class_detail = await client.get("/admin/classes/MCA/S3", headers=admin_headers)
        assert class_detail.status_code == 200
        c_info = class_detail.json()["data"]
        assert c_info["program"] == "MCA"
        assert c_info["semester"] == "S3"
        assert len(c_info["students"]) == 60, f"Expected 60 students in MCA S3, got {len(c_info['students'])}"
        assert len(c_info["subjects"]) == 3, f"Expected 3 subjects (NSA, ADBMS, JAVA), got {len(c_info['subjects'])}"
        print("   [PASS] MCA S3 academic details verified: 60 students and 3 subjects with assigned faculty.")

        print("6. Testing Student Management & Institutional Updates...")
        student_res = await client.get("/admin/students/FIT25MCA-2008", headers=admin_headers)
        assert student_res.status_code == 200
        s_data = student_res.json()["data"]
        assert s_data["student_id"] == "FIT25MCA-2008"
        print(f"   [PASS] Fetched student {s_data['name']} ({s_data['student_id']}) records.")

        update_res = await client.put(
            "/admin/students/FIT25MCA-2008",
            headers=admin_headers,
            json={"phone": "+91 94470 99999", "status": "Active"}
        )
        assert update_res.status_code == 200
        print("   [PASS] Successfully updated student institutional records.")

        print("7. Testing Faculty Management & Course Reassignment...")
        faculty_list_res = await client.get("/admin/faculty", headers=admin_headers)
        assert faculty_list_res.status_code == 200
        fac_list = faculty_list_res.json()["data"]
        assert len(fac_list) >= 3, "Expected at least 3 faculty members"
        print(f"   [PASS] Retrieved {len(fac_list)} faculty members.")

        rakhi_nsa = await client.get("/faculty/laboratories/nsa", headers=faculty_headers)
        assert rakhi_nsa.status_code == 200, f"Rakhi should initially manage NSA, got {rakhi_nsa.status_code}"

        print("   -> Reassigning NSA from Rakhi to Shidha...")
        reassign_res = await client.post(
            "/admin/faculty/reassign-course",
            headers=admin_headers,
            json={"course_id": "nsa", "target_faculty_id": "shidha@fisat.ac.in"}
        )
        assert reassign_res.status_code == 200

        rakhi_nsa_after = await client.get("/faculty/laboratories/nsa", headers=faculty_headers)
        assert rakhi_nsa_after.status_code == 403, f"Expected 403 for Rakhi after reassignment, got {rakhi_nsa_after.status_code}"
        print("   [PASS] Previous faculty (Rakhi) immediately forbidden (403) from managing NSA.")

        print("   -> Reassigning NSA back to Rakhi...")
        reassign_back = await client.post(
            "/admin/faculty/reassign-course",
            headers=admin_headers,
            json={"course_id": "nsa", "target_faculty_id": "faculty@fisat.ac.in"}
        )
        assert reassign_back.status_code == 200
        rakhi_nsa_restored = await client.get("/faculty/laboratories/nsa", headers=faculty_headers)
        assert rakhi_nsa_restored.status_code == 200
        print("   [PASS] Faculty management access restored to Rakhi.")

        print("8. Testing Maintenance Mode State & Interception...")
        maint_on = await client.post(
            "/admin/maintenance",
            headers=admin_headers,
            json={
                "maintenance_mode": True,
                "maintenance_message": "Platform upgrade in progress.",
                "expected_return": "In 30 minutes"
            }
        )
        assert maint_on.status_code == 200

        stud_req = await client.get("/student/me", headers=student_headers)
        assert stud_req.status_code == 503, f"Expected 503 for student during maintenance, got {stud_req.status_code}"
        assert stud_req.json()["status"] == "maintenance"

        fac_req = await client.get("/faculty/me", headers=faculty_headers)
        assert fac_req.status_code == 503, f"Expected 503 for faculty during maintenance, got {fac_req.status_code}"

        admin_req = await client.get("/admin/stats", headers=admin_headers)
        assert admin_req.status_code == 200, f"Admin must remain accessible during maintenance, got {admin_req.status_code}"
        print("   [PASS] Maintenance mode active: Student (503), Faculty (503), Admin (200 OK).")

        maint_off = await client.post(
            "/admin/maintenance",
            headers=admin_headers,
            json={"maintenance_mode": False}
        )
        assert maint_off.status_code == 200

        stud_restored = await client.get("/student/me", headers=student_headers)
        assert stud_restored.status_code == 200
        print("   [PASS] Maintenance disabled and student access fully restored (200 OK).")

        print("9. Testing Audit Log Recording...")
        audit_res = await client.get("/admin/audit", headers=admin_headers)
        assert audit_res.status_code == 200
        audit_logs = audit_res.json()["data"]
        assert len(audit_logs) > 0, "Expected audit log records"
        print(f"   [PASS] Verified {len(audit_logs)} audit log records detailing admin actions.")

    print("\n=======================================================")
    print("ALL 9 ADMIN BACKEND INTEGRATION TEST SUITES PASSED! [OK]")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
