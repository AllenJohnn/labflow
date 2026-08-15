import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getEnrollments,
  updateEnrollment,
} from "../../services/adminService";

export default function Enrollments() {
  const [selectedProgram, setSelectedProgram] = useState("MCA");
  const [selectedSemester, setSelectedSemester] = useState("S3");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getEnrollments(selectedProgram, selectedSemester);
        if (isMounted) {
          setStudents(data.students || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading enrollment matrix:", err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedProgram, selectedSemester]);

  const refreshMatrix = async () => {
    try {
      const data = await getEnrollments(selectedProgram, selectedSemester);
      setStudents(data.students || []);
    } catch (err) {
      console.error("Error refreshing enrollment matrix:", err);
    }
  };

  const availableSubjects = [
    { code: "NSA", course_id: "nsa", name: "Network Security & Applications" },
    { code: "ADBMS", course_id: "adbms", name: "Advanced DBMS Lab" },
    { code: "JAVA", course_id: "java", name: "OOP Lab Java" },
  ];

  const handleToggleCourse = async (studentId, courseId, currentEnrolled) => {
    const cid = courseId.toLowerCase();
    let updatedCourses = [...(currentEnrolled || [])];
    if (updatedCourses.includes(cid)) {
      updatedCourses = updatedCourses.filter((c) => c !== cid);
    } else {
      updatedCourses.push(cid);
    }

    // Optimistic UI update
    setStudents((prev) =>
      prev.map((s) =>
        (s.student_id === studentId || s.id === studentId)
          ? { ...s, enrolled_courses: updatedCourses }
          : s
      )
    );

    setSavingStudentId(studentId);
    try {
      await updateEnrollment(studentId, updatedCourses);
      setStatusMessage({
        text: `Updated enrollments for ${studentId}.`,
        type: "success",
      });
    } catch {
      setStatusMessage({
        text: `Failed to update enrollment for ${studentId}.`,
        type: "error",
      });
      await refreshMatrix();
    } finally {
      setSavingStudentId(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name?.toLowerCase().includes(term) ||
      s.student_id?.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
                Laboratory Enrollment Management
              </h1>
              <p className="text-[13px] text-slate-500">
                Manage student-to-laboratory enrollment mappings for each academic section.
              </p>
            </div>

            {/* Class Selectors */}
            <div className="flex items-center gap-2">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 focus:border-[#164a9c] focus:outline-none"
              >
                <option value="MCA">MCA</option>
                <option value="IMCA">IMCA</option>
                <option value="CSE">B.Tech CSE</option>
              </select>

              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 focus:border-[#164a9c] focus:outline-none"
              >
                <option value="S1">Semester 1 (S1)</option>
                <option value="S3">Semester 3 (S3)</option>
                <option value="S5">Semester 5 (S5)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage.text && (
          <div
            className={`flex items-center justify-between p-3.5 text-[13px] border ${
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

        {/* Search Toolbar */}
        <div className="flex items-center justify-between border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#164a9c] focus:outline-none"
            />
          </div>

          <span className="text-[12px] font-medium text-slate-500">
            {filteredStudents.length} Students in {selectedProgram} {selectedSemester}
          </span>
        </div>

        {/* Enrollment Matrix Table */}
        <div className="overflow-x-auto border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                {availableSubjects.map((sub) => (
                  <th key={sub.course_id} className="px-4 py-3 text-center">
                    <div>{sub.code}</div>
                    <div className="text-[9px] font-normal text-slate-400 normal-case">
                      {sub.name}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Enrollment Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading enrollment matrix...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const enrolled = stu.enrolled_courses || ["nsa", "adbms", "java"];
                  const isSaving = savingStudentId === (stu.student_id || stu.id);
                  return (
                    <tr key={stu.id || stu.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-semibold text-[#164a9c]">
                        {stu.student_id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {stu.name}
                      </td>
                      {availableSubjects.map((sub) => {
                        const isChecked = enrolled.includes(sub.course_id);
                        return (
                          <td key={sub.course_id} className="px-4 py-3 text-center">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleToggleCourse(stu.student_id || stu.id, sub.course_id, enrolled)}
                              title={`Toggle ${sub.code} enrollment`}
                              className={`mx-auto flex h-5 w-5 items-center justify-center border transition ${
                                isChecked
                                  ? "border-[#164a9c] bg-[#164a9c] text-white"
                                  : "border-slate-300 bg-white hover:border-slate-400"
                              }`}
                            >
                              {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {enrolled.length} / {availableSubjects.length} Courses
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
