import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, User } from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  getStudentLaboratories,
  getAssignedExercisesByCourse,
  getStudentAnnouncements,
  getCachedLaboratories,
  getCachedAnnouncements,
} from "../../services/studentService";

export default function LaboratoryDetail() {
  const { subjectId } = useParams();
  const [lab, setLab] = useState(() => {
    const labs = getCachedLaboratories() || [];
    return labs.find((item) => item.id === subjectId) || null;
  });
  const [exercises, setExercises] = useState([]);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);

  useEffect(() => {
    async function loadData() {
      try {
        const [labs, exList, ann] = await Promise.all([
          getStudentLaboratories(),
          getAssignedExercisesByCourse(subjectId),
          getStudentAnnouncements(),
        ]);
        const found = labs.find((item) => item.id === subjectId) || labs[0];
        setLab(found);
        setExercises(exList);
        setAnnouncements(ann);
      } catch (err) {
        console.error("Error loading laboratory details:", err);
      }
    }
    loadData();
  }, [subjectId]);

  const syllabusUrl = lab?.syllabusUrl || `/syllabi/${(lab?.code || subjectId || "NSA").toUpperCase()}-Syllabus-Demo.pdf`;
  const assignedCount = exercises.length;

  return (
    <StudentLayout announcements={announcements}>
      <div className="space-y-6">
        {/* Back Navigation */}
        <div>
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#164a9c] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header Subject Info */}
        <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
                {lab?.code || subjectId?.toUpperCase()}
              </span>
              <h1 className="mt-2 text-[22px] font-bold text-slate-800 tracking-tight">
                {lab?.name || "Laboratory Subject"}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-600">
                <User className="h-4 w-4 text-[#159447]" />
                <span className="text-slate-400">Faculty:</span>
                <span className="font-semibold text-slate-800">{lab?.faculty || "Rakhi"}</span>
              </div>
            </div>

            {/* View Syllabus Button — Opens Demo PDF in New Tab */}
            <a
              href={syllabusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-[#164a9c] hover:text-[#164a9c] focus:outline-none"
            >
              <span>View Syllabus</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Laboratory Exercises Section */}
        <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
              Laboratory Exercises
            </h2>
            <span className="text-[12px] font-medium text-slate-500">
              {assignedCount === 0
                ? "No exercises assigned"
                : `${assignedCount} ${assignedCount === 1 ? "Exercise" : "Exercises"} Assigned`}
            </span>
          </div>

          {assignedCount === 0 ? (
            <div className="py-8 text-center text-[13px] text-slate-400">
              No exercises have been assigned yet.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="group flex flex-wrap items-center justify-between gap-4 py-3.5 px-2 transition hover:bg-slate-50/70 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center bg-[#f0f4fa] border border-[#164a9c]/15 text-[12px] font-bold text-[#164a9c]">
                      {ex.exerciseNumber}
                    </span>
                    <div>
                      <h4 className="text-[14px] font-semibold text-slate-800 group-hover:text-[#164a9c] transition-colors">
                        {ex.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Assigned by {ex.faculty}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 border ${
                      ex.status === "Evaluated"
                        ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                        : ex.status === "Reviewed"
                        ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                        : ex.status === "Submitted"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}


