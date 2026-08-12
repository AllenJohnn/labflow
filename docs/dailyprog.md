# Day 01

**Date:** 01 August 2026

### Completed
- Setup FastAPI backend and project structure.
- Configured Google OAuth authentication.
- Initial project pushed to GitHub.

---

# Day 02

**Date:** 09 August 2026

### Completed
- Connected MongoDB database.
- Implemented JWT login authentication.
- Built Student login with Google OAuth.
- Added Faculty and Admin login routes.
- Created Student, Faculty, and Admin dashboard pages.

---

# Day 03

**Date:** 12 August 2026

### Completed
- Refactored and polished Student Dashboard UI to strictly match the FISAT institutional visual style of `Login.jsx`.
- Added dynamic time-based greeting ("Good morning / afternoon / evening, Allen") and academic context header (`MCA S2 · Computer Applications`).
- Implemented "My Laboratories" section displaying assigned subject cards (`NSA`, `DBMS`, `JAVA`) with faculty names and navigation actions.
- Tightened Laboratory card vertical spacing by 15-20% and aligned height across all course cards.
- Redesigned Profile Institutional Information fields (Name, Email, Roll Number, Course, Semester) into clean, un-nested text displays without badges, lock icons, or disabled inputs.
- Implemented Sonner toast notifications for profile updates (`toast.success` and `toast.error`).
- Connected static syllabus PDF documents (`NSA-Syllabus-Demo.pdf`, `DBMS-Syllabus-Demo.pdf`, `JAVA-Syllabus-Demo.pdf`) opening natively in a new browser tab.
- Built data-driven faculty exercise visibility layer (`isAssigned`), dynamically filtering assigned exercises and hiding unassigned exercises.
- Resolved backend Google OAuth student creation issue (`E11000 duplicate key error` on `student_id_1` sparse index) and eliminated all fake fallback ObjectIds.
- Implemented MongoDB connection health check (`check_database_connection`) and verified backend startup lifespan.

### Next
- Implement individual exercise view and in-browser IDE runner.
- Faculty lab exercise assignment and submission evaluation controls.