import api from "./api";

let cachedAdminProfile = null;
let cachedAdminStats = null;
let cachedAcademicClasses = null;

export const getAdminProfile = async () => {
  const res = await api.get("/admin/me");
  cachedAdminProfile = res.data.data;
  return res.data.data;
};

export const getCachedAdminProfile = () => cachedAdminProfile;

export const getAdminStats = async () => {
  const res = await api.get("/admin/stats");
  cachedAdminStats = res.data.data;
  return res.data.data;
};

export const getCachedAdminStats = () => cachedAdminStats;

export const getAcademicClasses = async () => {
  const res = await api.get("/admin/classes");
  cachedAcademicClasses = res.data.data;
  return res.data.data;
};

export const getCachedAcademicClasses = () => cachedAcademicClasses;

export const getClassDetails = async (program, semester) => {
  const res = await api.get(`/admin/classes/${encodeURIComponent(program)}/${encodeURIComponent(semester)}`);
  return res.data.data;
};

export const getStudents = async (params = {}) => {
  const res = await api.get("/admin/students", { params });
  return res.data.data;
};

export const getStudent = async (studentId) => {
  const res = await api.get(`/admin/students/${encodeURIComponent(studentId)}`);
  return res.data.data;
};

export const updateStudent = async (studentId, payload) => {
  const res = await api.put(`/admin/students/${encodeURIComponent(studentId)}`, payload);
  return res.data.data;
};

export const createStudent = async (payload) => {
  const res = await api.post("/admin/students", payload);
  return res.data.data;
};

export const toggleStudentStatus = async (studentId, isActive) => {
  const res = await api.patch(`/admin/students/${encodeURIComponent(studentId)}/status`, { is_active: isActive });
  return res.data.data;
};

export const getFaculty = async () => {
  const res = await api.get("/admin/faculty");
  return res.data.data;
};

export const createFaculty = async (payload) => {
  const res = await api.post("/admin/faculty", payload);
  return res.data.data;
};

export const updateFaculty = async (facultyId, payload) => {
  const res = await api.put(`/admin/faculty/${encodeURIComponent(facultyId)}`, payload);
  return res.data.data;
};

export const assignFacultyToCourse = async (courseId, targetFacultyId) => {
  const res = await api.post("/admin/faculty/reassign-course", {
    course_id: courseId,
    target_faculty_id: targetFacultyId,
  });
  return res.data;
};

export const getLaboratories = async () => {
  const res = await api.get("/admin/laboratories");
  return res.data.data;
};

export const updateLaboratory = async (courseId, payload) => {
  const res = await api.put(`/admin/laboratories/${encodeURIComponent(courseId)}`, payload);
  return res.data.data;
};

export const getEnrollments = async (program = "MCA", semester = "S3") => {
  const res = await api.get("/admin/enrollments", {
    params: { program, semester },
  });
  return res.data.data;
};

export const updateEnrollment = async (studentId, enrolledCourses) => {
  const res = await api.put(`/admin/enrollments/${encodeURIComponent(studentId)}`, {
    enrolled_courses: enrolledCourses,
  });
  return res.data.data;
};

export const getAnnouncements = async () => {
  const res = await api.get("/admin/announcements");
  return res.data.data;
};

export const createAnnouncement = async (payload) => {
  const res = await api.post("/admin/announcements", payload);
  return res.data.data;
};

export const deleteAnnouncement = async (announcementId) => {
  const res = await api.delete(`/admin/announcements/${encodeURIComponent(announcementId)}`);
  return res.data.data;
};

export const getAuditLogs = async (params = {}) => {
  const res = await api.get("/admin/audit", { params });
  return res.data.data;
};

export const getSystemSettings = async () => {
  const res = await api.get("/admin/settings");
  return res.data.data;
};

export const updateSystemSettings = async (payload) => {
  const res = await api.put("/admin/settings", payload);
  return res.data.data;
};

export const setMaintenanceMode = async (payload) => {
  const res = await api.post("/admin/maintenance", payload);
  return res.data.data;
};

export const getSystemStatus = async () => {
  const res = await api.get("/admin/stats");
  return res.data.data;
};

export const enableMaintenance = async (message = "", expectedReturn = "") => {
  return await setMaintenanceMode({
    maintenance_mode: true,
    maintenance_message: message,
    expected_return: expectedReturn,
  });
};

export const disableMaintenance = async () => {
  return await setMaintenanceMode({
    maintenance_mode: false,
  });
};
