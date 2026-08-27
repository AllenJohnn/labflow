import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def run_ide_flow_tests():
    print("\n================================================================================")
    print("           LABFLOW PHASE 2 — MONACO IDE & TEST MODE VERIFICATION               ")
    print("================================================================================\n")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=12.0) as client:
        # 1. Student Authentication
        print("1. Authenticating Dev Student (Allen John Joy)...")
        login_res = await client.post("/auth/student/login", json={
            "email": "student@fisat.ac.in",
            "password": "student123"
        })
        assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
        student_data = login_res.json()
        student_token = student_data["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print(f"   [PASS] Student authenticated. ID: {student_data['user'].get('student_id')}")

        # 2. Verify IDE Demo Mode exposure for designated student
        print("\n2. Testing IDE Demo Mode: Access to Demo Exercise 01 and 02 in NSA...")
        nsa_ex_res = await client.get("/student/laboratories/nsa/exercises", headers=student_headers)
        assert nsa_ex_res.status_code == 200
        nsa_exercises = nsa_ex_res.json()["data"]
        nsa_ex_ids = [e["exercise_id"] for e in nsa_exercises]
        print(f"   [PASS] Visible NSA Exercises for Dev Student: {nsa_ex_ids}")
        assert "nsa-ex1" in nsa_ex_ids, "nsa-ex1 must be visible"
        assert "nsa-ex2" in nsa_ex_ids, "nsa-ex2 must be visible in IDE demo mode"
        assert "nsa-ex3" not in nsa_ex_ids, "nsa-ex3 must remain unassigned and hidden"
        assert "nsa-ex4" not in nsa_ex_ids, "nsa-ex4 must remain unassigned and hidden"
        print("   [PASS] Only configured demo exercises (01 and 02) are exposed; other unassigned exercises remain hidden.")

        # 3. Verify language mapping for exercises
        print("\n3. Testing Exercise -> Programming Language Mapping...")
        ex1_meta = next(e for e in nsa_exercises if e["exercise_id"] == "nsa-ex1")
        assert ex1_meta["language"] == "c", f"Expected C language for NSA Ex 1, got {ex1_meta['language']}"
        print(f"   [PASS] NSA Exercise 01 language = '{ex1_meta['language']}' (C Mode)")

        java_ex_res = await client.get("/student/laboratories/java/exercises", headers=student_headers)
        assert java_ex_res.status_code == 200
        java_exercises = java_ex_res.json()["data"]
        java_ex1 = next((e for e in java_exercises if e["exercise_id"] == "java-ex1"), None)
        if java_ex1:
            assert java_ex1["language"] == "java"
            print(f"   [PASS] Java Exercise 01 language = '{java_ex1['language']}' (Java Mode)")

        adbms_ex_res = await client.get("/student/laboratories/adbms/exercises", headers=student_headers)
        assert adbms_ex_res.status_code == 200
        adbms_exercises = adbms_ex_res.json()["data"]
        adbms_ex1 = next((e for e in adbms_exercises if e["exercise_id"] == "adbms-ex1"), None)
        if adbms_ex1:
            assert adbms_ex1["language"] == "python"
            print(f"   [PASS] ADBMS Exercise 01 language = '{adbms_ex1['language']}' (Python Mode)")

        # 4. Dev Student Submits C Code for Demo Exercise 02 (Temporary access test)
        print("\n4. Submitting C Solution Code for Demo Exercise 02 via Submission API...")
        demo_code_c = """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    printf("LabFlow Demo Exercise 02 Solution\\n");
    return 0;
}
"""
        sub_res = await client.post("/student/exercises/nsa-ex2/submit", headers=student_headers, json={
            "code": demo_code_c,
            "language": "c",
            "comments": "Submitted from LabFlow Monaco IDE test"
        })
        assert sub_res.status_code == 200, f"Submit failed: {sub_res.text}"
        sub_data = sub_res.json()["data"]
        assert sub_data["status"] == "Submitted"
        assert sub_data["language"] == "c"
        print(f"   [PASS] Demo Exercise 02 submitted successfully. ID: {sub_data.get('submission_id')}")

        # 5. Verify Student Retrieval of Submitted Code
        print("\n5. Student verifies submitted solution persistence...")
        get_sub = await client.get("/student/exercises/nsa-ex2/submission", headers=student_headers)
        assert get_sub.status_code == 200
        persisted_sub = get_sub.json()["data"]
        assert persisted_sub is not None
        assert "LabFlow Demo Exercise 02 Solution" in persisted_sub["submitted_code"]
        print("   [PASS] Submitted code persisted and retrieved accurately.")

        # 6. Faculty Reviews Submitted Exercise 02
        print("\n6. Faculty Login (Rakhi) and Evaluation of Demo Exercise 02...")
        fac_login = await client.post("/auth/faculty/login", json={
            "email": "faculty@fisat.ac.in",
            "password": "faculty123"
        })
        assert fac_login.status_code == 200
        fac_token = fac_login.json()["access_token"]
        fac_headers = {"Authorization": f"Bearer {fac_token}"}

        eval_res = await client.put(f"/faculty/submissions/{sub_data['submission_id']}/evaluate", headers=fac_headers, json={
            "status": "Evaluated",
            "marks": "20/20",
            "feedback": "Perfect C implementation tested through Monaco IDE."
        })
        assert eval_res.status_code == 200, f"Evaluation failed: {eval_res.text}"
        print(f"   [PASS] Faculty successfully evaluated the submission with marks 20/20.")

        # 7. Student side reflects updated status
        print("\n7. Verifying evaluated status reflection on Student side...")
        updated_sub_res = await client.get("/student/exercises/nsa-ex2/submission", headers=student_headers)
        assert updated_sub_res.status_code == 200
        updated_sub = updated_sub_res.json()["data"]
        assert updated_sub["status"] == "Evaluated"
        assert updated_sub["marks"] == "20/20"
        print(f"   [PASS] Student submission reflects: Status={updated_sub['status']}, Marks={updated_sub['marks']}")

        # 8. Access Control: Reject submission to unassigned exercise (e.g. nsa-ex3)
        print("\n8. Testing Access Control: Rejection of non-demo unassigned exercise (nsa-ex3)...")
        unassigned_sub = await client.post("/student/exercises/nsa-ex3/submit", headers=student_headers, json={
            "code": "int main() {}",
            "language": "c"
        })
        assert unassigned_sub.status_code == 400
        print(f"   [PASS] Submission to unassigned nsa-ex3 rejected with HTTP 400: {unassigned_sub.json()['detail']}")

        # 9. Language Validation: Unsupported languages rejected
        print("\n9. Testing Language Strictness: Unsupported languages rejected...")
        for bad_lang in ["cpp", "sql", "bash", "javascript", "rust", "go"]:
            bad_res = await client.post("/student/exercises/nsa-ex1/submit", headers=student_headers, json={
                "code": "console.log('test')",
                "language": bad_lang
            })
            assert bad_res.status_code == 422, f"Expected 422 for {bad_lang}, got {bad_res.status_code}"
        print("   [PASS] C++, SQL, Bash, JavaScript, Rust, Go strictly rejected.")

        print("\n================================================================================")
        print("           ALL MONACO IDE & SUBMISSION INTEGRATION TESTS PASSED (100%)          ")
        print("================================================================================\n")

if __name__ == "__main__":
    asyncio.run(run_ide_flow_tests())
