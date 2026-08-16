import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  UserCheck,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getClassDetails,
  getFaculty,
  assignFacultyToCourse,
  createStudent,
} from "../../services/adminService";

export default function ClassDetail() {
  const { program = "MCA", semester = "S3" } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    student_id: "",
    phone: "",
    department: program.toUpperCase(),
    semester: semester.replace("S", ""),
    enrolled_courses: ["nsa", "adbms", "java"],
  });
  const [creatingStudent, setCreatingStudent] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const [cData, fList] = await Promise.all([
          getClassDetails(program, semester),
          getFaculty(),
        ]);
        if (isMounted) {
          setClassData(cData);
          setFacultyList(fList);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading class detail:", err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [program, semester]);

  const refreshData = async () => {
    try {
      const [cData, fList] = await Promise.all([
        getClassDetails(program, semester),
        getFaculty(),
      ]);
      setClassData(cData);
      setFacultyList(fList);
    } catch (err) {
      console.error("Error refreshing class data:", err);
    }
  };

  const handleOpenReassign = (subject) => {
    setSelectedSubject(subject);
    const currentFac = facultyList.find(
      (f) => f.name === subject.faculty || f.email === subject.faculty_email
    );
    setSelectedFacultyId(currentFac?.email || "");
    setReassignModalOpen(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !selectedFacultyId) return;

    setReassigning(true);
    try {
      const courseId = selectedSubject.course_id || selectedSubject.code.toLowerCase();
      await assignFacultyToCourse(courseId, selectedFacultyId);
      setStatusMessage({
        text: `Successfully reassigned ${selectedSubject.name} (${selectedSubject.code}) to faculty.`,
        type: "success",
      });
      setReassignModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to reassign course.",
        type: "error",
      });
    } finally {
      setReassigning(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email || !newStudent.student_id) return;

    setCreatingStudent(true);
    try {
      await createStudent(newStudent);
      setStatusMessage({
        text: `Student ${newStudent.name} (${newStudent.student_id}) enrolled successfully.`,
        type: "success",
      });
      setAddStudentModalOpen(false);
      setNewStudent({
        name: "",
        email: "",
        student_id: "",
        phone: "",
        department: program.toUpperCase(),
        semester: semester.replace("S", ""),
        enrolled_courses: ["nsa", "adbms", "java"],
      });
      await refreshData();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to create student record.",
        type: "error",
      });
    } finally {
      setCreatingStudent(false);
    }
  };

  const students = classData?.students || [];
  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name?.toLowerCase().includes(term) ||
      s.student_id?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin/classes"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#164a9c]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Classes</span>
          </Link>

          <span className="text-[12px] font-semibold text-slate-400">
            Term: {classData?.academic_year || "2025-2026"}
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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-[#164a9c] text-[18px] font-bold text-white">
                {program}
              </div>
              <div>
                <h1 className="font-brand text-[22px] font-bold text-slate-800 tracking-tight">
                  {program} · Semester {semester}
                </h1>
                <p className="text-[13px] text-slate-500">
                  {classData?.name || `${program} Semester ${semester}`} · Department of Computer Applications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="border border-slate-100 bg-[#f8fafc] px-4 py-2 text-center">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Enrolled</span>
                <span className="text-[18px] font-bold text-[#164a9c]">
                  {students.length} Students
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAddStudentModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#164a9c] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
              Subjects & Faculty Allocation
            </h2>
            <p className="text-[12px] text-slate-500">
              Laboratory courses assigned to this semester and the responsible teaching faculty.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classData?.subjects?.map((sub, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between border border-slate-200/90 bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] font-bold text-[#164a9c] bg-[#f0f4fa] px-2 py-0.5">
                      {sub.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      Lab Course
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-[15px] font-bold text-slate-800 leading-snug">
                    {sub.name}
                  </h3>

                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Assigned Faculty
                    </span>
                    <p className="text-[13px] font-semibold text-[#159447] mt-0.5">
                      {sub.faculty}
                    </p>
                    {sub.faculty_email && (
                      <p className="text-[11px] text-slate-400">{sub.faculty_email}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenReassign(sub)}
                    className="flex w-full items-center justify-center gap-1.5 border border-slate-200 bg-white py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-[#164a9c] hover:text-[#164a9c] focus:outline-none"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Reassign Faculty</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                Class Student Roster
              </h2>
              <p className="text-[12px] text-slate-500">
                {filteredStudents.length} of {students.length} students enrolled in {program} {semester}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200/90 bg-white pl-9 pr-4 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#164a9c] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Enrolled Labs</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading student roster...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching students found for "{searchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => (
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
                      <td className="px-4 py-3 text-slate-500">
                        {stu.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold ${
                            stu.status === "Active"
                              ? "bg-emerald-50 text-[#159447] border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {stu.status || "Active"}
                        </span>
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
                          <span>Manage</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {reassignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Reassign Faculty Member
                </h3>
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleReassignSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Subject / Laboratory
                  </label>
                  <div className="mt-1 border border-slate-200 bg-slate-50 p-2.5 text-[13px] font-semibold text-slate-800">
                    {selectedSubject?.code} — {selectedSubject?.name}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Select Target Faculty
                  </label>
                  <select
                    value={selectedFacultyId}
                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                    required
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  >
                    <option value="">-- Choose Faculty Member --</option>
                    {facultyList.map((f) => (
                      <option key={f.id || f.email} value={f.email}>
                        {f.name} ({f.department} · {f.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 leading-snug">
                  <strong>Authorization note:</strong> When reassigned, backend authorization will immediately grant access to the selected faculty member, and the previous faculty member will lose administrative access to this lab course.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReassignModalOpen(false)}
                    className="border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reassigning || !selectedFacultyId}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {reassigning ? "Saving..." : "Confirm Reassignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {addStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Enroll New Student ({program} {semester})
                </h3>
                <button
                  type="button"
                  onClick={() => setAddStudentModalOpen(false)}
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
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FIT25MCA-2099"
                      value={newStudent.student_id}
                      onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none font-mono"
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@fisat.ac.in"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddStudentModalOpen(false)}
                    className="border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingStudent}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {creatingStudent ? "Enrolling..." : "Enroll Student"}
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
