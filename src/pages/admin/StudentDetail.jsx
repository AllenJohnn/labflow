import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getStudent,
  updateStudent,
  toggleStudentStatus,
} from "../../services/adminService";

export default function StudentDetail() {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    student_id: "",
    department: "MCA",
    semester: "S3",
    academic_year: "2025-2026",
    status: "Active",
    enrolled_courses: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getStudent(studentId);
        if (isMounted) {
          setStudent(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "+91 94470 12345",
            student_id: data.student_id || studentId,
            department: data.department || "MCA",
            semester: data.semester || "S3",
            academic_year: data.academic_year || "2025-2026",
            status: data.status || "Active",
            enrolled_courses: data.enrolled_courses || ["nsa", "adbms", "java"],
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading student detail:", err);
        if (isMounted) {
          setStatusMessage({
            text: err.response?.data?.detail || "Failed to load student records.",
            type: "error",
          });
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const handleEnrollmentToggle = (courseId) => {
    const cid = courseId.toLowerCase();
    const current = [...formData.enrolled_courses];
    const index = current.indexOf(cid);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(cid);
    }
    setFormData({ ...formData, enrolled_courses: current });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ text: "", type: "" });

    try {
      const updated = await updateStudent(formData.student_id || studentId, formData);
      setStatusMessage({
        text: "Student institutional records updated successfully.",
        type: "success",
      });
      setStudent(updated);
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to update student records.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    const isCurrentlyActive = formData.status === "Active";
    const newStatus = isCurrentlyActive ? "Inactive" : "Active";

    try {
      await toggleStudentStatus(formData.student_id || studentId, !isCurrentlyActive);
      setFormData((prev) => ({ ...prev, status: newStatus }));
      setStatusMessage({
        text: `Student account ${formData.student_id} set to ${newStatus}.`,
        type: "success",
      });
    } catch {
      setStatusMessage({
        text: "Failed to toggle account status.",
        type: "error",
      });
    }
  };

  if (loading && !student) {
    return (
      <AdminLayout>
        <div className="py-16 text-center text-slate-400">
          Loading student institutional records...
        </div>
      </AdminLayout>
    );
  }

  const availableLabs = [
    { course_id: "nsa", code: "NSA", name: "Network Security & Applications", faculty: "Rakhi" },
    { course_id: "adbms", code: "ADBMS", name: "Advanced Database Management Systems", faculty: "Shidha" },
    { course_id: "java", code: "JAVA", name: "Object Oriented Programming Lab (Java)", faculty: "Rosemary Mathew" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#164a9c]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Student Directory</span>
          </Link>

          <span className="text-[12px] font-mono text-slate-400">
            RECORD ID: {student?.student_id || studentId}
          </span>
        </div>

        {statusMessage.text && (
          <div
            className={`flex items-center justify-between p-4 text-[13px] border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-[#159447] border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage({ text: "", type: "" })}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center bg-slate-800 text-[20px] font-bold text-white uppercase">
                {formData.name ? formData.name[0] : "S"}
              </div>
              <div>
                <h1 className="font-brand text-[22px] font-bold text-slate-800 tracking-tight">
                  {formData.name || "Student Profile"}
                </h1>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="font-mono text-[13px] font-bold text-[#164a9c] bg-[#f0f4fa] px-2 py-0.5">
                    {formData.student_id}
                  </span>
                  <span className="text-[13px] text-slate-500">
                    {formData.department} · {formData.semester}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold ${
                      formData.status === "Active"
                        ? "bg-emerald-50 text-[#159447] border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {formData.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleAccountStatus}
                className={`inline-flex items-center gap-1.5 border px-3.5 py-2 text-[12px] font-semibold transition focus:outline-none ${
                  formData.status === "Active"
                    ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                    : "border-emerald-200 bg-white text-[#159447] hover:bg-emerald-50"
                }`}
              >
                {formData.status === "Active" ? (
                  <>
                    <UserX className="h-4 w-4" />
                    <span>Deactivate Account</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Activate Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-[15px] font-bold text-slate-800">
                  Personal Information
                </h2>
                <p className="text-[12px] text-slate-400">
                  Institutional contact and identification profile
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-[15px] font-bold text-slate-800">
                  Academic Information
                </h2>
                <p className="text-[12px] text-slate-400">
                  Department, class enrollment, and institutional roll assignment
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Roll Number / Student ID
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="mt-1 w-full border border-slate-200 bg-white p-2.5 font-mono text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Academic Program
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    >
                      <option value="MCA">MCA</option>
                      <option value="IMCA">IMCA</option>
                      <option value="CSE">B.Tech CSE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    >
                      <option value="S1">Semester 1 (S1)</option>
                      <option value="S3">Semester 3 (S3)</option>
                      <option value="S5">Semester 5 (S5)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-[15px] font-bold text-slate-800">
                Laboratory Course Enrollments
              </h2>
              <p className="text-[12px] text-slate-400">
                Select the laboratory courses this student is permitted to access and submit code in.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {availableLabs.map((lab) => {
                const isEnrolled = formData.enrolled_courses.includes(lab.course_id.toLowerCase());
                return (
                  <div
                    key={lab.course_id}
                    onClick={() => handleEnrollmentToggle(lab.course_id)}
                    className={`flex cursor-pointer items-start justify-between border p-4 transition ${
                      isEnrolled
                        ? "border-[#164a9c] bg-[#f0f4fa]"
                        : "border-slate-200 bg-[#fbfcfd] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[13px] font-bold text-slate-800">
                          {lab.code}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] font-medium text-slate-700 leading-snug">
                        {lab.name}
                      </p>
                      <span className="mt-2 block text-[11px] text-slate-500">
                        Faculty: {lab.faculty}
                      </span>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                        isEnrolled
                          ? "border-[#164a9c] bg-[#164a9c] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isEnrolled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-[15px] font-bold text-slate-800">
                Academic Progress & Submissions Overview
              </h2>
              <p className="text-[12px] text-slate-400">
                High-level laboratory metrics for administrative oversight
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Completed Labs
                </span>
                <span className="mt-1 block text-[20px] font-bold text-[#159447]">
                  {student?.submissions_overview?.completed ?? 2}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Pending Labs
                </span>
                <span className="mt-1 block text-[20px] font-bold text-amber-600">
                  {student?.submissions_overview?.pending ?? 1}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Evaluated
                </span>
                <span className="mt-1 block text-[20px] font-bold text-[#164a9c]">
                  {student?.submissions_overview?.evaluated ?? 2}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Lab Attendance
                </span>
                <span className="mt-1 block text-[20px] font-bold text-slate-800">
                  {student?.submissions_overview?.attendance ?? "96%"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 pt-4">
            <Link
              to="/admin/students"
              className="border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-[#164a9c] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Institutional Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
