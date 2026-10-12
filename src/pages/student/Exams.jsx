import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, LockKeyhole, ShieldAlert } from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import { getCachedAnnouncements, getCachedProfile } from "../../services/studentService";
import { getStudentExams, startStudentExam } from "../../services/examService";

const prettyStatus = (status) => ({
  available: "Ready to start",
  in_progress: "In progress",
  submitted: "Submitted",
  terminated: "Ended after focus warnings",
  expired: "Time expired",
}[status] || status);

export default function StudentExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState("");
  const [error, setError] = useState("");
  const [profile] = useState(() => getCachedProfile());
  const [announcements] = useState(() => getCachedAnnouncements() || []);

  const loadExams = useCallback(async () => {
    try {
      const nextExams = await getStudentExams();
      setError("");
      setExams(nextExams);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || "Exams could not be loaded. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { loadExams(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadExams]);

  const openExam = async (exam) => {
    setError("");
    setStartingId(exam.id);
    try {
      if (exam.status === "available" || (exam.allow_retake && ["submitted", "terminated", "expired"].includes(exam.status))) await startStudentExam(exam.id);
      navigate(`/student/exams/${exam.id}/room`);
    } catch (startError) {
      setError(startError.response?.data?.detail || "This exam could not be started. Refresh the page and try again.");
      await loadExams();
    } finally {
      setStartingId("");
    }
  };

  return (
    <StudentLayout profile={profile} announcements={announcements}>
      <div className="space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <BookOpenCheck className="h-4 w-4" /> Assessment room
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Exams</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Timed assessments assigned to your courses. Once you begin, your timer starts immediately.</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 border border-slate-200 bg-white p-4">
            <Clock3 className="mt-0.5 h-4 w-4 text-blue-700" />
            <div><p className="text-sm font-semibold text-slate-800">Timed assessment</p><p className="mt-1 text-xs leading-5 text-slate-500">The server clock controls your deadline.</p></div>
          </div>
          <div className="flex items-start gap-3 border border-slate-200 bg-white p-4">
            <LockKeyhole className="mt-0.5 h-4 w-4 text-blue-700" />
            <div><p className="text-sm font-semibold text-slate-800">Focused exam window</p><p className="mt-1 text-xs leading-5 text-slate-500">Leave the exam tab and your attempt will be recorded.</p></div>
          </div>
          <div className="flex items-start gap-3 border border-slate-200 bg-white p-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
            <div><p className="text-sm font-semibold text-slate-800">Three focus violations</p><p className="mt-1 text-xs leading-5 text-slate-500">The third detected change ends the attempt.</p></div>
          </div>
        </div>

        {error && <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

        {loading ? <div className="border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">Loading your exams…</div> : exams.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <BookOpenCheck className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">No exams are available right now</p>
            <p className="mt-1 text-xs text-slate-500">Published assessments for your courses will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {exams.map((exam) => {
              const finished = ["submitted", "terminated", "expired"].includes(exam.status);
              return (
                <article key={exam.id} className="border border-slate-200 bg-white shadow-sm">
                  <div className="h-1 bg-blue-700" />
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">{exam.course_id.toUpperCase()}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${exam.status === "available" ? "text-emerald-700" : finished ? "text-slate-500" : "text-amber-700"}`}>
                        {finished ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        {prettyStatus(exam.status)}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold leading-7 text-slate-900">{exam.title}</h2>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-100 py-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {exam.duration_minutes} minutes</span>
                      <span>{exam.question_count} questions</span>
                      <span>{exam.total_points} points</span>
                    </div>
                    {exam.grading_status === "graded" && exam.score !== null && exam.score !== undefined && (
                      <p className="mt-3 text-sm text-slate-600">Result: <strong className="text-slate-900">{exam.score} / {exam.total_points}</strong></p>
                    )}
                    {exam.feedback && <p className="mt-2 border-l-2 border-blue-300 pl-3 text-sm leading-6 text-slate-600">{exam.feedback}</p>}
                    <button type="button" disabled={(finished && !exam.allow_retake) || startingId === exam.id} onClick={() => openExam(exam)} className="mt-5 inline-flex items-center gap-2 border border-[#164a9c] px-4 py-2.5 text-sm font-semibold text-[#164a9c] transition hover:bg-[#164a9c] hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">
                      {startingId === exam.id ? "Opening…" : exam.status === "in_progress" ? "Resume exam" : finished ? exam.allow_retake ? "Start another attempt" : "Attempt completed" : "Start exam"}
                      {(!finished || exam.allow_retake) && <ArrowRight className="h-4 w-4" />}
                    </button>
                    {exam.violation_count > 0 && <p className="mt-3 text-xs text-amber-700">Focus changes recorded: {exam.violation_count} / 3</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
