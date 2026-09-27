# LabFlow Project State

## Completed Phases
1. **Phase 1: Core MVP**
   - Authentication (Google OAuth & JWT)
   - Role-based authorization (Admin, Faculty, Student)
   - MongoDB Atlas integration
   - Admin audit logging and maintenance mode
   - Laboratory, Exercises, and Enrollment management
   - Submission and Faculty Evaluation system
   - Attendance validation

2. **Phase 2: Monaco In-Browser IDE**
   - Frontend `StudentIDE` with Monaco Editor
   - Local draft persistence
   - Skeleton loader optimization

3. **Phase 3: Secure Code Execution Engine (External Judge0)**
   - Replaced Docker-based execution with **Judge0 CE API** integration. Docker-based execution was completely removed.
   - **Architecture:** LabFlow -> FastAPI -> Judge0 -> Sandboxed Execution -> LabFlow -> Monaco.
   - Judge0 is the current execution provider.
   - Connected existing integration to the public **ce.judge0.com** endpoint. API key requirement was bypassed for this specific public CE endpoint.
   - Configured `settings.py` for Judge0 endpoints, limits (128MB Memory, 5s CPU Timeout, 64KB Output size).
   - Handled normalized statuses (completed, compilation_error, runtime_error, timeout, service_unavailable).
   - Added execution concurrency protections (student can only run one execution at a time).
   - Supported languages mapped strictly to: C (50), Java (62), Python (71).
   - Verified Run vs Submit architectures are distinct: Run executes code dynamically without saving a submission, while Submit persists the submission for faculty evaluation without executing.

4. **Phase 4A: Backend Automated Grading Tests Foundation**
   - Implemented `PUT /exercises/{exercise_id}/test-cases` for managing optional test cases.
   - Implemented `POST /exercises/{exercise_id}/run-tests` for test-case execution via Judge0.
   - Strict access controls: prevents students from seeing hidden test data (input/output) while executing.
   - Safe concurrency guard implemented: max 3 simultaneous test executions globally per backend instance to respect public Judge0 limits, alongside the existing 1 execution per student limit.

5. **Phase 4B: Frontend UX & Automated Grading UI Integration**
   - Extensively rebuilt the `StudentIDE.jsx` using `react-resizable-panels`.
   - Wired the IDE to the Phase 4A test execution endpoint. Dynamically shows a "Run Tests" button only when test cases are assigned to the exercise.
   - Outputs are routed to separate tabs: Output, Errors, and Test Results.
   - Created `TestCasesDialog.jsx` inside the Faculty UI (`LaboratoryDetail.jsx`) to let faculty assign public/hidden test configurations natively.
   - Stripped away generic aesthetic themes; upgraded `globals.css` with a strict Tailwind v4 monochromatic developer palette.

## Future Phases
- Phase 5: CI/CD & Deployment
- Phase 6: GitHub Integration
