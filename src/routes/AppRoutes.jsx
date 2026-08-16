import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import FacultyLogin from "../pages/auth/FacultyLogin";
import AdminLogin from "../pages/auth/AdminLogin";
import Callback from "../pages/auth/Callback";
import MaintenancePage from "../pages/auth/MaintenancePage";

import StudentDashboard from "../pages/student/Dashboard";
import StudentLaboratories from "../pages/student/Laboratories";
import LaboratoryDetail from "../pages/student/LaboratoryDetail";
import StudentExercises from "../pages/student/Exercises";
import StudentSubmissions from "../pages/student/Submissions";
import StudentProfile from "../pages/student/Profile";
import StudentAttendance from "../pages/student/Attendance";

import FacultyDashboard from "../pages/faculty/Dashboard";
import FacultyLaboratories from "../pages/faculty/Laboratories";
import FacultyLaboratoryDetail from "../pages/faculty/LaboratoryDetail";
import FacultyAttendance from "../pages/faculty/Attendance";

import AdminDashboard from "../pages/admin/Dashboard";
import Classes from "../pages/admin/Classes";
import ClassDetail from "../pages/admin/ClassDetail";
import Students from "../pages/admin/Students";
import StudentDetail from "../pages/admin/StudentDetail";
import Faculty from "../pages/admin/Faculty";
import Laboratories from "../pages/admin/Laboratories";
import Enrollments from "../pages/admin/Enrollments";
import Announcements from "../pages/admin/Announcements";
import AuditLog from "../pages/admin/AuditLog";
import Maintenance from "../pages/admin/Maintenance";
import Settings from "../pages/admin/Settings";

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
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
  );
}
