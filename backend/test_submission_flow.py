import asyncio
import sys
import httpx
from app.main import app
from app.services.jwt_service import create_access_token
from app.services.submission_service import seed_demo_submissions

async def run_submission_workflow_tests():
    print("================================================================================")
    print("           LABFLOW SUBMISSION WORKFLOW & EVALUATION TEST SUITE                 ")
    print("================================================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver/api/v1") as client:
        # Step 0: Ensure submissions are seeded
        print("\n[STEP 0] Seeding demo submissions dataset...")
        seed_result = await seed_demo_submissions(force_reset=True)
        print(f"  -> Seeded: {seed_result.get('seeded_count', 0)} submissions across {len(seed_result.get('by_course', {}))} courses.")

        # Prepare tokens for testing
        # 1. Students
        allen_token = create_access_token(
            user_id="FIT25MCA-2008",
            role="student",
            name="Allen John Joy",
            email="allenjohnjoy.mca2527@fisat.ac.in"
        )
        shaun_token = create_access_token(
            user_id="FIT25MCA-2050",
            role="student",
            name="Shaun Peter Antony",
            email="shaunpeterantony.mca2527@fisat.ac.in"
        )

        # 2. Faculty
        rakhi_token = create_access_token(
            user_id="FAC-MCA-001",
            role="faculty",
            name="Rakhi",
            email="faculty@fisat.ac.in"
        )
        shidha_token = create_access_token(
            user_id="FAC-MCA-002",
            role="faculty",
            name="Shidha",
            email="shidha@fisat.ac.in"
        )

        # 3. Admin
        admin_token = create_access_token(
            user_id="ADM001",
            role="admin",
            name="System Administrator",
            email="admin@fisat.ac.in"
        )

        headers_allen = {"Authorization": f"Bearer {allen_token}"}
        headers_shaun = {"Authorization": f"Bearer {shaun_token}"}
        headers_rakhi = {"Authorization": f"Bearer {rakhi_token}"}
        headers_shidha = {"Authorization": f"Bearer {shidha_token}"}
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        # -------------------------------------------------------------------------
        # TEST 1: Student gets assigned exercises with attached submission status
        # -------------------------------------------------------------------------
        print("\n[TEST 1] Student GET /student/exercises...")
        r = await client.get("/student/exercises", headers=headers_allen)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json().get("data", [])
        assert len(data) >= 1, "Expected at least 1 assigned exercise for student"
        nsa_ex1 = next((e for e in data if (e.get("courseId") == "nsa" or e.get("course_id") == "nsa") and (e.get("exerciseNumber") == "01" or e.get("exercise_number") == "01")), None)
        assert nsa_ex1 is not None, "Expected NSA Exercise 01 to be assigned"
        print(f"  -> Found assigned exercise: {nsa_ex1.get('title')} (Status: {nsa_ex1.get('status')})")
        assert nsa_ex1.get("status") in ["Evaluated", "Reviewed", "Submitted", "Not Submitted"]
        print("  [PASS] Student assigned exercises retrieved successfully with submission status.")

        # -------------------------------------------------------------------------
        # TEST 2: Student retrieves their submissions list
        # -------------------------------------------------------------------------
        print("\n[TEST 2] Student GET /student/submissions...")
        r = await client.get("/student/submissions", headers=headers_allen)
        assert r.status_code == 200
        subs = r.json().get("data", [])
        assert isinstance(subs, list)
        print(f"  -> Student Allen John has {len(subs)} persistent submissions in system.")
        if len(subs) > 0:
            first_sub = subs[0]
            print(f"     Sub 1: {first_sub.get('course_id')} Ex {first_sub.get('exercise_number')} - Status: {first_sub.get('status')} - Marks: {first_sub.get('marks')}")
        print("  [PASS] Student submission history retrieved successfully.")

        # -------------------------------------------------------------------------
        # TEST 3: Student submits work for an assigned exercise (C, Java, Python)
        # -------------------------------------------------------------------------
        print("\n[TEST 3] Student POST /student/exercises/{exercise_id}/submit with valid language 'c'...")
        target_ex_id = nsa_ex1.get("id") or nsa_ex1.get("exercise_id")
        submission_payload = {
            "code": "/* LabFlow Automated Test Solution in C */\n#include <stdio.h>\nint main() {\n    printf(\"LabFlow C E2E Verified\\n\");\n    return 0;\n}\n",
            "language": "c",
            "comments": "Completed and compiled with gcc in Linux shell."
        }
        r = await client.post(f"/student/exercises/{target_ex_id}/submit", json=submission_payload, headers=headers_allen)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        sub_resp = r.json().get("data", {})
        assert sub_resp.get("status") in ["Submitted", "Evaluated"], f"Unexpected status: {sub_resp.get('status')}"
        assert sub_resp.get("student_id") == "FIT25MCA-2008"
        assert sub_resp.get("language") == "c"
        assert "LabFlow Automated Test Solution in C" in sub_resp.get("submitted_code", "")
        print(f"  -> Work submitted. Submission ID: {sub_resp.get('submission_id')}, Status: {sub_resp.get('status')}, Lang: {sub_resp.get('language')}")
        print("  [PASS] Student successfully submitted C exercise code.")

        # -------------------------------------------------------------------------
        # TEST 3b: Language Acceptance - Java & Python
        # -------------------------------------------------------------------------
        print("\n[TEST 3b] Testing Language Acceptance for Java and Python...")
        java_payload = {
            "code": "public class Solution { public static void main(String[] args) { System.out.println(\"Java OK\"); } }",
            "language": "java",
            "comments": "Java solution"
        }
        r_java = await client.post(f"/student/exercises/{target_ex_id}/submit", json=java_payload, headers=headers_allen)
        assert r_java.status_code == 200, f"Expected Java accepted, got {r_java.status_code}: {r_java.text}"
        assert r_java.json().get("data", {}).get("language") == "java"
        print("  -> Java submission accepted (HTTP 200).")

        py_payload = {
            "code": "print('Python OK')",
            "language": "python",
            "comments": "Python solution"
        }
        r_py = await client.post(f"/student/exercises/{target_ex_id}/submit", json=py_payload, headers=headers_allen)
        assert r_py.status_code == 200, f"Expected Python accepted, got {r_py.status_code}: {r_py.text}"
        assert r_py.json().get("data", {}).get("language") == "python"
        print("  -> Python submission accepted (HTTP 200).")
        print("  [PASS] C, Java, and Python submissions all accepted.")

        # -------------------------------------------------------------------------
        # TEST 3c: Language Rejection - Disallowed languages (Bash, SQL, C++, JS)
        # -------------------------------------------------------------------------
        print("\n[TEST 3c] Testing Language Rejection for Unsupported Languages (Bash, SQL, C++, JavaScript)...")
        for bad_lang in ["bash", "sql", "cpp", "javascript", "rust", "go"]:
            bad_payload = {
                "code": f"// Unsupported {bad_lang} code",
                "language": bad_lang,
                "comments": f"Testing rejection of {bad_lang}"
            }
            r_bad = await client.post(f"/student/exercises/{target_ex_id}/submit", json=bad_payload, headers=headers_allen)
            assert r_bad.status_code in [400, 422], f"Expected 400/422 rejection for '{bad_lang}', got {r_bad.status_code}: {r_bad.text}"
            print(f"  -> Unsupported language '{bad_lang}' rejected (HTTP {r_bad.status_code}).")
        print("  [PASS] All unsupported programming languages strictly rejected.")

        # Re-submit valid C solution for subsequent tests
        await client.post(f"/student/exercises/{target_ex_id}/submit", json=submission_payload, headers=headers_allen)

        # -------------------------------------------------------------------------
        # TEST 4: Student fetches single exercise submission
        # -------------------------------------------------------------------------
        print("\n[TEST 4] Student GET /student/exercises/{exercise_id}/submission...")
        r = await client.get(f"/student/exercises/{target_ex_id}/submission", headers=headers_allen)
        assert r.status_code == 200
        single_sub = r.json().get("data", {})
        assert single_sub is not None
        assert single_sub.get("language") == "c"
        assert "LabFlow Automated Test Solution in C" in single_sub.get("submitted_code", "")
        print(f"  -> Retrieved single submission: {single_sub.get('submission_id')} ({single_sub.get('language')})")
        print("  [PASS] Single exercise submission details verified.")

        # -------------------------------------------------------------------------
        # TEST 5: Student submission rejection on invalid/unassigned exercise
        # -------------------------------------------------------------------------
        print("\n[TEST 5] Student submission to non-existent exercise...")
        r = await client.post("/student/exercises/non-existent-ex-999/submit", json=submission_payload, headers=headers_allen)
        assert r.status_code in [400, 404], f"Expected 400 or 404 for non-existent exercise, got {r.status_code}"
        print(f"  -> Correctly rejected with status {r.status_code}: {r.json().get('detail')}")
        print("  [PASS] Invalid exercise submission correctly rejected.")

        # -------------------------------------------------------------------------
        # TEST 6: Faculty retrieves submissions for assigned course
        # -------------------------------------------------------------------------
        print("\n[TEST 6] Faculty (Rakhi) GET /faculty/laboratories/nsa/submissions...")
        r = await client.get("/faculty/laboratories/nsa/submissions", headers=headers_rakhi)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        faculty_subs = r.json().get("data", [])
        assert len(faculty_subs) >= 50, f"Expected 60 cohort submissions for NSA, got {len(faculty_subs)}"
        print(f"  -> Faculty Rakhi retrieved {len(faculty_subs)} submissions for NSA laboratory.")
        
        # Verify cohort distribution
        evaluated_subs = [s for s in faculty_subs if s.get("status") == "Evaluated"]
        reviewed_subs = [s for s in faculty_subs if s.get("status") == "Reviewed"]
        submitted_subs = [s for s in faculty_subs if s.get("status") == "Submitted"]
        print(f"  -> Breakdown: {len(evaluated_subs)} Evaluated, {len(reviewed_subs)} Reviewed, {len(submitted_subs)} Submitted.")
        assert len(evaluated_subs) > 0, "Expected evaluated submissions in cohort"
        assert len(submitted_subs) > 0, "Expected submitted submissions in cohort"
        print("  [PASS] Faculty course submissions and cohort counts verified.")

        # -------------------------------------------------------------------------
        # TEST 7: Faculty retrieves single submission detail
        # -------------------------------------------------------------------------
        print("\n[TEST 7] Faculty GET /faculty/submissions/{submission_id}...")
        sub_to_evaluate = next((s for s in faculty_subs if s.get("student_id") == "FIT25MCA-2008"), faculty_subs[0])
        eval_sub_id = sub_to_evaluate.get("submission_id") or sub_to_evaluate.get("id")
        
        r = await client.get(f"/faculty/submissions/{eval_sub_id}", headers=headers_rakhi)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        detail_data = r.json().get("data", {})
        assert detail_data.get("student_name") == sub_to_evaluate.get("student_name")
        print(f"  -> Retrieved submission detail for student: {detail_data.get('student_name')} ({detail_data.get('student_id')})")
        print("  [PASS] Faculty submission detail retrieval verified.")

        # -------------------------------------------------------------------------
        # TEST 8: Faculty evaluates submission (Marks + Feedback + Status)
        # -------------------------------------------------------------------------
        print("\n[TEST 8] Faculty PUT /faculty/submissions/{submission_id}/evaluate...")
        eval_payload = {
            "status": "Evaluated",
            "marks": "20/20",
            "feedback": "Outstanding implementation. Shell commands and directory structuring follow best practices."
        }
        r = await client.put(f"/faculty/submissions/{eval_sub_id}/evaluate", json=eval_payload, headers=headers_rakhi)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        eval_res = r.json()
        assert eval_res.get("status") == "success"
        print(f"  -> Evaluation response: {eval_res.get('message')}")
        print("  [PASS] Faculty evaluation successfully recorded.")

        # -------------------------------------------------------------------------
        # TEST 9: Student immediately verifies updated marks and feedback
        # -------------------------------------------------------------------------
        print("\n[TEST 9] Student verifies updated evaluation reflection...")
        r = await client.get("/student/submissions", headers=headers_allen)
        assert r.status_code == 200
        student_subs = r.json().get("data", [])
        updated_stu_sub = next((s for s in student_subs if s.get("submission_id") == eval_sub_id or s.get("id") == eval_sub_id or s.get("exercise_id") == target_ex_id), None)
        assert updated_stu_sub is not None, "Expected student to find updated submission"
        assert updated_stu_sub.get("status") == "Evaluated", f"Expected status 'Evaluated', got {updated_stu_sub.get('status')}"
        assert updated_stu_sub.get("marks") == "20/20", f"Expected marks '20/20', got {updated_stu_sub.get('marks')}"
        assert "Outstanding implementation" in (updated_stu_sub.get("feedback") or ""), f"Unexpected feedback: {updated_stu_sub.get('feedback')}"
        print(f"  -> Verified on Student Side: Status={updated_stu_sub.get('status')}, Marks={updated_stu_sub.get('marks')}, Feedback='{updated_stu_sub.get('feedback')}'")
        print("  [PASS] Student side reflects evaluated marks and feedback accurately.")

        # -------------------------------------------------------------------------
        # TEST 10: Faculty Authorization Isolation (403 Forbidden for unassigned course)
        # -------------------------------------------------------------------------
        print("\n[TEST 10] Faculty authorization check: Shidha (ADBMS) trying to access NSA submissions...")
        r = await client.get("/faculty/laboratories/nsa/submissions", headers=headers_shidha)
        assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
        print(f"  -> Correctly denied access with 403 Forbidden: {r.json().get('detail')}")

        print("\n[TEST 10b] Faculty authorization check: Rakhi (NSA) trying to evaluate an ADBMS submission...")
        r = await client.put("/faculty/laboratories/adbms/submissions/sub-adbms-01-FIT25MCA-2001/evaluate", json=eval_payload, headers=headers_rakhi)
        assert r.status_code == 403, f"Expected 403 Forbidden for unauthorized course, got {r.status_code}"
        print(f"  -> Cross-course evaluation correctly denied with 403 Forbidden: {r.json().get('detail')}")
        print("  [PASS] Faculty RBAC and course assignment isolation strictly enforced.")

        # -------------------------------------------------------------------------
        # TEST 11: Admin seed endpoint
        # -------------------------------------------------------------------------
        print("\n[TEST 11] Admin POST /admin/seed-submissions...")
        r = await client.post("/admin/seed-submissions", json={"force_reset": False}, headers=headers_admin)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print(f"  -> Admin seed endpoint returned: {r.json().get('message')}")
        print("  [PASS] Admin seed-submissions endpoint verified.")

        # -------------------------------------------------------------------------
        # TEST 12: Faculty Student Roster Matrix Reflects Completed Submissions
        # -------------------------------------------------------------------------
        print("\n[TEST 12] Faculty GET /faculty/laboratories/nsa/students...")
        r = await client.get("/faculty/laboratories/nsa/students", headers=headers_rakhi)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        roster_data = r.json().get("data", [])
        assert len(roster_data) == 60, f"Expected 60 students in roster, got {len(roster_data)}"
        allen_roster = next((s for s in roster_data if s.get("student_id") == "FIT25MCA-2008"), None)
        assert allen_roster is not None
        print(f"  -> Student Allen John in Faculty Roster: Submissions={allen_roster.get('submissions_completed')}")
        print("  [PASS] Faculty roster progress matrix verified.")

    print("\n================================================================================")
    print("              ALL 12+ SUBMISSION WORKFLOW TESTS PASSED (100%)                   ")
    print("================================================================================")

if __name__ == "__main__":
    asyncio.run(run_submission_workflow_tests())
