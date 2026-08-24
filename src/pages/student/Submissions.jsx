import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileCode, Clock, MessageSquare, ChevronRight, ArrowRight } from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import StudentSubmissionModal from "../../components/student/StudentSubmissionModal";
import {
  getStudentAnnouncements,
  getStudentSubmissions,
  getCachedAnnouncements,
} from "../../services/studentService";

export default function StudentSubmissions() {
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubForModal, setSelectedSubForModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [a, subs] = await Promise.all([
          getStudentAnnouncements(),
          getStudentSubmissions(),
        ]);
        if (isMounted) {
          setAnnouncements(a);
          setSubmissions(subs || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading submissions:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const totalCount = submissions.length;
  const evaluatedCount = submissions.filter((s) => s.status === "Evaluated").length;
  const reviewedCount = submissions.filter((s) => s.status === "Reviewed").length;
  const pendingCount = submissions.filter((s) => s.status === "Submitted").length;

  return (
    <StudentLayout announcements={announcements}>
      <div className="space-y-6">
        <div className="border-b border-slate-200/70 pb-4">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            Submission History
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Persistent academic record of your programming laboratory submissions, marks awarded, and faculty feedback.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
            <div className="mt-1 text-[20px] font-bold text-slate-800">{totalCount}</div>
          </div>
          <div className="border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#159447]">Evaluated</div>
            <div className="mt-1 text-[20px] font-bold text-[#159447]">{evaluatedCount}</div>
          </div>
          <div className="border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#164a9c]">Reviewed</div>
            <div className="mt-1 text-[20px] font-bold text-[#164a9c]">{reviewedCount}</div>
          </div>
          <div className="border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Review</div>
            <div className="mt-1 text-[20px] font-bold text-amber-700">{pendingCount}</div>
          </div>
        </div>

        {/* Submissions Table / List */}
        <div className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-[13px] text-slate-400">
              Loading submission history...
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <FileCode className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-[16px] font-bold text-slate-800">No submissions yet</h3>
              <p className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">
                You have not submitted work for any assigned laboratory exercises yet. Open your enrolled laboratories to submit solutions.
              </p>
              <div className="mt-5">
                <Link
                  to="/student/laboratories"
                  className="inline-flex items-center gap-2 bg-[#164a9c] hover:bg-[#123877] text-white px-4 py-2 text-[13px] font-semibold transition shadow-2xs"
                >
                  <span>Browse Laboratories</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => (
                <div
                  key={sub.id || sub.submission_id}
                  onClick={() => {
                    setSelectedSubForModal({
                      id: sub.exercise_id,
                      exercise_id: sub.exercise_id,
                      courseId: sub.course_id,
                      course_id: sub.course_id,
                      exerciseNumber: sub.exercise_number,
                      exercise_number: sub.exercise_number,
                      title: sub.exercise_title,
                      description: sub.comments,
                      status: sub.status,
                      marks: sub.marks,
                      feedback: sub.feedback,
                      submission: sub,
                    });
                  }}
                  className="group flex flex-wrap items-center justify-between gap-4 p-4.5 transition hover:bg-[#f0f4fa]/40 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="inline-block bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] border border-[#164a9c]/15 uppercase mt-0.5">
                      {sub.course_code || (sub.course_id ? sub.course_id.toUpperCase() : "LAB")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14.5px] font-semibold text-slate-800 group-hover:text-[#164a9c] transition-colors">
                          Exercise {sub.exercise_number}: {sub.exercise_title}
                        </h4>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Submitted: {sub.submitted_date_display || (sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent")}
                        </span>
                        {sub.language && (
                          <span className="font-mono text-[11px] uppercase bg-slate-100 px-1.5 py-0.5 text-slate-600">
                            {sub.language}
                          </span>
                        )}
                      </div>
                      {sub.feedback && (
                        <div className="mt-2 text-[12.5px] text-slate-700 bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-[#164a9c] shrink-0 mt-0.5" />
                          <span><strong className="text-slate-800">Faculty:</strong> {sub.feedback}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 border ${
                        sub.status === "Evaluated"
                          ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                          : sub.status === "Reviewed"
                          ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                          : sub.status === "Submitted"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {sub.status} {sub.marks ? `· ${sub.marks}` : ""}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#164a9c] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedSubForModal && (
        <StudentSubmissionModal
          exercise={selectedSubForModal}
          isOpen={Boolean(selectedSubForModal)}
          onClose={() => setSelectedSubForModal(null)}
          onSubmitted={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </StudentLayout>
  );
}


