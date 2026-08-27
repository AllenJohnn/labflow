import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Filter, BookOpen } from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import StudentSubmissionModal from "../../components/student/StudentSubmissionModal";
import {
  getStudentAnnouncements,
  getCachedAnnouncements,
  getAllAssignedExercises,
} from "../../services/studentService";

export default function StudentExercises() {
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [exercises, setExercises] = useState([]);
  const [filterCourse, setFilterCourse] = useState("all");
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState(null);

  const loadData = () => {
    Promise.all([getStudentAnnouncements(), getAllAssignedExercises()])
      .then(([a, exList]) => {
        setAnnouncements(a);
        setExercises(exList || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const courses = Array.from(new Set(exercises.map((e) => (e.courseId || e.course_id || "").toLowerCase()))).filter(Boolean);

  const filteredExercises = exercises.filter((ex) => {
    if (filterCourse === "all") return true;
    return (ex.courseId || ex.course_id || "").toLowerCase() === filterCourse.toLowerCase();
  });

  return (
    <StudentLayout announcements={announcements}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div>
            <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
              Laboratory Exercises
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              View active, pending, and evaluated programming lab assignments across your courses.
            </p>
          </div>

          {courses.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[12px] font-medium text-slate-500">Course:</span>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-[#164a9c]"
              >
                <option value="all">All Laboratories</option>
                {courses.map((cid) => (
                  <option key={cid} value={cid}>
                    {cid.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <h3 className="text-[15px] font-semibold text-slate-700">No exercises assigned yet</h3>
              <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">
                Laboratory exercises will appear here once assigned by your course faculty.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredExercises.map((item) => {
                const exId = item.id || item.exercise_id;
                const cid = (item.courseId || item.course_id || "nsa").toLowerCase();
                const ideLink = `/student/laboratories/${cid}/exercises/${exId}/ide`;

                return (
                  <Link
                    key={item.id || item.exercise_id}
                    to={ideLink}
                    className="group flex flex-wrap items-center justify-between gap-4 py-4 px-3 transition hover:bg-[#f0f4fa]/40 border-l-2 border-transparent hover:border-[#164a9c] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-block bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] border border-[#164a9c]/15 uppercase">
                        {item.courseId || item.course_id}
                      </span>
                      <div>
                        <h4 className="text-[14px] font-semibold text-slate-800 group-hover:text-[#164a9c] transition-colors">
                          Exercise {item.exerciseNumber || item.exercise_number}: {item.title}
                        </h4>
                        <p className="text-[12px] text-slate-500">
                          Faculty: {item.faculty} {item.dueDate ? `· Due: ${item.dueDate}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 border ${
                          item.status === "Evaluated"
                            ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                            : item.status === "Reviewed"
                            ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                            : item.status === "Submitted"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {item.status} {item.marks ? `(${item.marks})` : ""}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#164a9c] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedExerciseForModal && (
        <StudentSubmissionModal
          exercise={selectedExerciseForModal}
          isOpen={Boolean(selectedExerciseForModal)}
          onClose={() => setSelectedExerciseForModal(null)}
          onSubmitted={() => {
            loadData();
          }}
        />
      )}
    </StudentLayout>
  );
}



