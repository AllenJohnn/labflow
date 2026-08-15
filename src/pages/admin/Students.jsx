import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getStudents,
  createStudent,
  toggleStudentStatus,
} from "../../services/adminService";

export default function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  // Add Student Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    student_id: "",
    phone: "",
    department: "MCA",
    semester: "3",
    enrolled_courses: ["nsa", "adbms", "java"],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await getStudents({
          search,
          program: programFilter,
          semester: semesterFilter,
          status: statusFilter,
        });
        if (isMounted) {
          setStudents(res.students || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        if (isMounted) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, programFilter, semesterFilter, statusFilter]);

  const refreshStudents = async () => {
    try {
      const res = await getStudents({
        search,
        program: programFilter,
        semester: semesterFilter,
        status: statusFilter,
      });
      setStudents(res.students || []);
    } catch (err) {
      console.error("Error refreshing students:", err);
    }
  };

  const handleToggleStatus = async (studentId, currentStatus) => {
    const newActiveState = currentStatus !== "Active";
    try {
      await toggleStudentStatus(studentId, newActiveState);
      setStatusMessage({
        text: `Student account ${studentId} is now ${newActiveState ? "Active" : "Inactive"}.`,
        type: "success",
      });
      await refreshStudents();
    } catch {
      setStatusMessage({
        text: "Failed to update student status.",
        type: "error",
      });
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email || !newStudent.student_id) return;

    setSaving(true);
    try {
      await createStudent(newStudent);
      setStatusMessage({
        text: `Student ${newStudent.name} (${newStudent.student_id}) registered successfully.`,
        type: "success",
      });
      setAddModalOpen(false);
      setNewStudent({
        name: "",
        email: "",
        student_id: "",
        phone: "",
        department: "MCA",
        semester: "3",
        enrolled_courses: ["nsa", "adbms", "java"],
      });
      await refreshStudents();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to register student.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
                Student Directory & Roster
              </h1>
              <p className="text-[13px] text-slate-500">
                Institutional student records, roll numbers, academic allocation, and account statuses.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#164a9c] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register New Student</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
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

        {/* Filters & Search Toolbar */}
        <div className="border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, roll no, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 bg-white pl-9 pr-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#164a9c] focus:outline-none"
              />
            </div>

            {/* Program Filter */}
            <div>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:border-[#164a9c] focus:outline-none"
              >
                <option value="all">All Programs</option>
                <option value="MCA">MCA</option>
                <option value="IMCA">IMCA</option>
                <option value="CSE">B.Tech CSE</option>
              </select>
            </div>

            {/* Semester Filter */}
            <div>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:border-[#164a9c] focus:outline-none"
              >
                <option value="all">All Semesters</option>
                <option value="S1">Semester 1 (S1)</option>
                <option value="S3">Semester 3 (S3)</option>
                <option value="S5">Semester 5 (S5)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:border-[#164a9c] focus:outline-none"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="inactive">Inactive Accounts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Program & Sem</th>
                <th className="px-4 py-3">Institutional Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Enrolled Labs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students match the selected criteria.
                  </td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr
                    key={stu.id || stu.student_id}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[#164a9c]">
                      {stu.student_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {stu.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {stu.department} · {stu.semester}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {stu.email}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(stu.student_id, stu.status)}
                        title="Click to toggle account status"
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold cursor-pointer transition ${
                          stu.status === "Active"
                            ? "bg-emerald-50 text-[#159447] border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {stu.status || "Active"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {stu.enrolled_courses?.map((c) => (
                          <span
                            key={c}
                            className="bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-700"
                          >
                            {String(c).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/students/${stu.student_id || stu.id}`)}
                        className="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-[#164a9c] hover:text-[#164a9c]"
                      >
                        <span>Manage Records</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL: ADD STUDENT */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Register Student Account
                </h3>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adrian Antony"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Roll Number / Student ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="FIT25MCA-2099"
                      value={newStudent.student_id}
                      onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 font-mono focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 94470 00000"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@fisat.ac.in"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Program
                    </label>
                    <select
                      value={newStudent.department}
                      onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
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
                      value={newStudent.semester}
                      onChange={(e) => setNewStudent({ ...newStudent, semester: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    >
                      <option value="1">Semester 1</option>
                      <option value="3">Semester 3</option>
                      <option value="5">Semester 5</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {saving ? "Registering..." : "Register Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
