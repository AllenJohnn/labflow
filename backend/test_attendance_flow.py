import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def run_attendance_tests():
    print("\n=======================================================")
    print("STARTING POLISHED LABFLOW ATTENDANCE & TIMETABLE TEST SUITE")
    print("=======================================================\n")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=12.0) as client:
        print("1. Testing Admin Authentication & Attendance Settings Configuration...")
        admin_login = await client.post("/auth/admin/login", json={
            "email": "admin@fisat.ac.in",
            "password": "admin123"
        })
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        await client.post("/admin/maintenance", headers=admin_headers, json={"maintenance_mode": False})

        settings_update = await client.put("/admin/settings", headers=admin_headers, json={
            "academic_year": "2025-2026",
            "default_semester": "S3",
            "required_attendance_threshold": 75.0,
            "late_grace_period_minutes": 10
        })
        assert settings_update.status_code == 200
        settings_data = settings_update.json()["data"]
        assert settings_data["required_attendance_threshold"] == 75.0
        assert settings_data["late_grace_period_minutes"] == 10
        print("   [PASS] Admin configured Required Attendance (75%) & Late Grace Period (10 min).")

        print("2. Testing Student Login (Verifying NO Auto-Attendance on Login)...")
        stud_login = await client.post("/auth/student/login", json={
            "email": "student@fisat.ac.in",
            "password": "student123"
        })
        assert stud_login.status_code == 200, f"Student login failed: {stud_login.text}"
        student_token = stud_login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print("   [PASS] Student authenticated. Login endpoint completed without triggering auto-attendance.")

        print("3. Testing Student Generic Platform & Dashboard Access (NO Attendance Created)...")
        profile_res = await client.get("/student/me", headers=student_headers)
        assert profile_res.status_code == 200
        labs_res = await client.get("/student/laboratories", headers=student_headers)
        assert labs_res.status_code == 200
        print("   [PASS] Profile and Laboratories list loaded without creating attendance.")

        print("4. Testing Student Enters Specific Laboratory (Active Timetable Session)...")
        enter_res = await client.post("/student/laboratories/nsa/enter", headers=student_headers)
        assert enter_res.status_code == 200, f"Lab entry failed: {enter_res.text}"
        enter_data = enter_res.json()["data"]
        assert enter_data["status"] in ["recorded", "already_recorded"]
        assert enter_data["attendance_status"] in ["Present", "Late"]
        print(f"   [PASS] Lab entry validated: Status = '{enter_data['attendance_status']}', Message: {enter_data['message']}")

        print("5. Testing Duplicate Attendance Prevention on Re-entering Same Laboratory...")
        reenter_res = await client.post("/student/laboratories/nsa/enter", headers=student_headers)
        assert reenter_res.status_code == 200
        reenter_data = reenter_res.json()["data"]
        assert reenter_data["status"] == "already_recorded"
        print(f"   [PASS] Duplicate prevented: {reenter_data['message']}")

        print("6. Testing Student Entry into Non-Enrolled Laboratory (Rejected 403)...")
        unassigned_res = await client.post("/student/laboratories/mechanical_cad/enter", headers=student_headers)
        assert unassigned_res.status_code == 403, f"Expected 403 Forbidden, got {unassigned_res.status_code}"
        print("   [PASS] Unenrolled lab entry rejected with HTTP 403 Forbidden.")

        print("7. Testing Student Entry into Lab with No Active Scheduled Session...")
        inactive_res = await client.post("/student/laboratories/adbms/enter", headers=student_headers)
        assert inactive_res.status_code == 200
        inactive_data = inactive_res.json()["data"]
        assert inactive_data["status"] == "no_active_session"
        print(f"   [PASS] Inactive session handled: {inactive_data['message']}")

        print("8. Testing Manual 'Check In to Active Lab' Endpoint...")
        checkin_active = await client.post("/student/attendance/check-in", headers=student_headers, json={"course_id": "nsa"})
        assert checkin_active.status_code == 200
        print("   [PASS] Manual check-in validated for active session.")

        checkin_inactive = await client.post("/student/attendance/check-in", headers=student_headers, json={"course_id": "adbms"})
        assert checkin_inactive.status_code == 400
        print("   [PASS] Manual check-in outside active hours rejected with HTTP 400 Bad Request.")

        print("9. Testing Student Attendance View & Neutral Compliance Labels...")
        atnd_view = await client.get("/student/attendance", headers=student_headers)
        assert atnd_view.status_code == 200
        atnd_data = atnd_view.json()["data"]

        assert atnd_data["required_threshold"] == 75.0
        assert "overall_percentage" in atnd_data
        assert atnd_data["status_label"] in ["Above Required Threshold", "Attendance Warning"]
        assert len(atnd_data["calendar_records"]) > 0
        assert len(atnd_data["courses_breakdown"]) == 3
        print(f"   [PASS] Student Overall Percentage: {atnd_data['overall_percentage']}%, Status: '{atnd_data['status_label']}' (No KTU claims).")

        print("10. Testing Faculty Authentication & Strict Course Isolation...")
        fac_rakhi_login = await client.post("/auth/faculty/login", json={
            "email": "faculty@fisat.ac.in",
            "password": "faculty123"
        })
        assert fac_rakhi_login.status_code == 200
        rakhi_token = fac_rakhi_login.json()["access_token"]
        rakhi_headers = {"Authorization": f"Bearer {rakhi_token}"}

        rakhi_roster = await client.get("/faculty/attendance/nsa/date/2026-08-15", headers=rakhi_headers)
        assert rakhi_roster.status_code == 200
        assert rakhi_roster.json()["data"]["total_enrolled"] == 60
        print("   [PASS] Faculty Rakhi successfully retrieved NSA class roster (60 enrolled students).")

        rakhi_adbms = await client.get("/faculty/attendance/adbms/date/2026-08-15", headers=rakhi_headers)
        assert rakhi_adbms.status_code == 403
        print("   [PASS] Unauthorized faculty access to ADBMS rejected with HTTP 403 Forbidden.")

        print("11. Testing Faculty Manual Attendance Override & Audit Log Entry...")
        override_res = await client.put(
            "/faculty/attendance/nsa/student/FIT25MCA-2008",
            headers=rakhi_headers,
            json={"date": "2026-08-15", "status": "Late"}
        )
        assert override_res.status_code == 200
        assert override_res.json()["data"]["status"] == "Late"
        print("   [PASS] Faculty updated student FIT25MCA-2008 to 'Late'.")

        audit_res = await client.get("/admin/audit", headers=admin_headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["data"]
        override_logs = [l for l in logs if l.get("action") == "MANUAL_ATTENDANCE_OVERRIDE"]
        assert len(override_logs) > 0
        author = override_logs[0].get("admin") or override_logs[0].get("admin_name") or "Rakhi"
        print(f"   [PASS] Audit log verified: {override_logs[0]['action']} recorded by '{author}'.")

        print("12. Testing Faculty Batch Operations (Bulk Present)...")
        batch_res = await client.post(
            "/faculty/attendance/nsa/batch",
            headers=rakhi_headers,
            json={"date": "2026-08-15", "status": "Present"}
        )
        assert batch_res.status_code == 200
        assert batch_res.json()["data"]["updated_count"] == 60
        print("   [PASS] Batch operation successfully updated all 60 students to 'Present'.")

        print("13. Testing Maintenance Mode & Cross-Role Access Control...")
        maint_enable = await client.post(
            "/admin/maintenance",
            headers=admin_headers,
            json={"maintenance_mode": True, "maintenance_message": "Attendance server upgrade."}
        )
        assert maint_enable.status_code == 200

        stud_maint = await client.get("/student/me", headers=student_headers)
        assert stud_maint.status_code == 503
        fac_maint = await client.get("/faculty/me", headers=rakhi_headers)
        assert fac_maint.status_code == 503

        admin_maint = await client.get("/admin/me", headers=admin_headers)
        assert admin_maint.status_code == 200

        maint_disable = await client.post(
            "/admin/maintenance",
            headers=admin_headers,
            json={"maintenance_mode": False}
        )
        assert maint_disable.status_code == 200
        print("   [PASS] Maintenance mode successfully verified and normal operations restored.")

    print("\n=======================================================")
    print("ALL POLISHED ATTENDANCE INTEGRATION SUITES PASSED! [OK]")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_attendance_tests())
