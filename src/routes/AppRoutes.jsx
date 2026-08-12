import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import FacultyLogin from "../pages/auth/FacultyLogin";
import AdminLogin from "../pages/auth/AdminLogin";
import Callback from "../pages/auth/Callback";
import StudentDashboard from "../pages/student/Dashboard";
import StudentLaboratories from "../pages/student/Laboratories";
import LaboratoryDetail from "../pages/student/LaboratoryDetail";
import StudentExercises from "../pages/student/Exercises";
import StudentSubmissions from "../pages/student/Submissions";
import StudentProfile from "../pages/student/Profile";
import FacultyDashboard from "../pages/faculty/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/faculty/login" element={<FacultyLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/auth/callback" element={<Callback />} />
      
      {/* Student Protected Routes */}
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

      {/* Faculty & Admin Routes */}
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyDashboard />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
