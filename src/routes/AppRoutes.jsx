import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
const Login = lazy(() => import("../pages/auth/Login"));
const FacultyLogin = lazy(() => import("../pages/auth/FacultyLogin"));
const AdminLogin = lazy(() => import("../pages/auth/AdminLogin"));
const Callback = lazy(() => import("../pages/auth/Callback"));
const MaintenancePage = lazy(() => import("../pages/auth/MaintenancePage"));

const StudentDashboard = lazy(() => import("../pages/student/Dashboard"));
const StudentLaboratories = lazy(() => import("../pages/student/Laboratories"));
const LaboratoryDetail = lazy(() => import("../pages/student/LaboratoryDetail"));
const StudentExercises = lazy(() => import("../pages/student/Exercises"));
const StudentIDE = lazy(() => import("../pages/student/StudentIDE"));
const StandaloneIDE = lazy(() => import("../pages/student/StandaloneIDE"));
const StudentSubmissions = lazy(() => import("../pages/student/Submissions"));
const StudentProfile = lazy(() => import("../pages/student/Profile"));
const StudentAttendance = lazy(() => import("../pages/student/Attendance"));
const StudentExams = lazy(() => import("../pages/student/Exams"));
const ExamRoom = lazy(() => import("../pages/student/ExamRoom"));

const FacultyDashboard = lazy(() => import("../pages/faculty/Dashboard"));
const FacultyLaboratories = lazy(() => import("../pages/faculty/Laboratories"));
const FacultyLaboratoryDetail = lazy(() => import("../pages/faculty/LaboratoryDetail"));
const FacultyAttendance = lazy(() => import("../pages/faculty/Attendance"));
const FacultyExams = lazy(() => import("../pages/faculty/FacultyExams"));

const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const Classes = lazy(() => import("../pages/admin/Classes"));
const ClassDetail = lazy(() => import("../pages/admin/ClassDetail"));
const Students = lazy(() => import("../pages/admin/Students"));
const StudentDetail = lazy(() => import("../pages/admin/StudentDetail"));
const Faculty = lazy(() => import("../pages/admin/Faculty"));
const Laboratories = lazy(() => import("../pages/admin/Laboratories"));
const Enrollments = lazy(() => import("../pages/admin/Enrollments"));
const Announcements = lazy(() => import("../pages/admin/Announcements"));
const AuditLog = lazy(() => import("../pages/admin/AuditLog"));
const Maintenance = lazy(() => import("../pages/admin/Maintenance"));
const Settings = lazy(() => import("../pages/admin/Settings"));

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading page...</div>}>
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/faculty/login" element={<FacultyLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route path="/maintenance" element={<MaintenancePage />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/laboratories"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLaboratories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/laboratory/:subjectId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <LaboratoryDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/laboratories/:courseId/exercises/:exerciseId/ide"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentIDE />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ide"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StandaloneIDE />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exercises"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentExercises />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/submissions"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exams"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentExams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exams/:examId/room"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ExamRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/laboratories"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyLaboratories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/laboratory/:courseId"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyLaboratoryDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/attendance"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/exams"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyExams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Classes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes/:program/:semester"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ClassDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <StudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Faculty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/laboratories"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Laboratories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enrollments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Enrollments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Announcements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AuditLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/maintenance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
