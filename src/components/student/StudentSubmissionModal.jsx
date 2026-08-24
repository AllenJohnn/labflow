import { useState, useEffect } from "react";
import { X, Send, Clock, Award, MessageSquare, Code, FileText, User } from "lucide-react";
import { toast } from "sonner";
import { getStudentExerciseSubmission, submitExerciseWork } from "../../services/studentService";

const defaultLangForCourse = (courseId) => {
  const cid = (courseId || "").toLowerCase();
  if (cid === "nsa") return "c";
  if (cid === "adbms" || cid === "dbms") return "python";
  if (cid === "java") return "java";
  return "c";
};

export default function StudentSubmissionModal({ exercise, isOpen, onClose, onSubmitted }) {
  const [submission, setSubmission] = useState(() => exercise?.submission || null);
  const [code, setCode] = useState(() => exercise?.submission?.submitted_code || "");
  const [language, setLanguage] = useState(() => exercise?.submission?.language || exercise?.language || defaultLangForCourse(exercise?.courseId || exercise?.course_id));
  const [comments, setComments] = useState(() => exercise?.submission?.comments || "");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !exercise) return;

    // Reset or update state based on exercise
    const initialLang = exercise.submission?.language || exercise.language || defaultLangForCourse(exercise.courseId || exercise.course_id);
    setLanguage(initialLang);
    if (exercise.submission?.submitted_code) {
      setCode(exercise.submission.submitted_code);
    }
    if (exercise.submission?.comments) {
      setComments(exercise.submission.comments);
    }

    let isMounted = true;
    async function fetchSub() {
      setLoading(true);
      try {
        const subData = await getStudentExerciseSubmission(exercise.id || exercise.exercise_id);
        if (isMounted && subData) {
          setSubmission(subData);
          if (subData.submitted_code) setCode(subData.submitted_code);
          if (subData.comments) setComments(subData.comments);
          if (subData.language) setLanguage(subData.language);
        }
      } catch (err) {
        console.error("Error fetching exercise submission:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSub();

    return () => {
      isMounted = false;
    };
  }, [isOpen, exercise]);


  if (!isOpen || !exercise) return null;

  const status = submission?.status || exercise.status || "Not Submitted";
  const marks = submission?.marks || exercise.marks;
  const feedback = submission?.feedback || exercise.feedback;
  const submittedAt = submission?.submitted_date_display || (submission?.submitted_at ? new Date(submission.submitted_at).toLocaleString() : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter your program code or solution before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim(),
        language,
        comments: comments.trim(),
      };
      const res = await submitExerciseWork(exercise.id || exercise.exercise_id, payload);
      setSubmission(res.data);
      toast.success(`Exercise ${exercise.exerciseNumber || exercise.exercise_number || ""}: Work submitted successfully.`);
      if (onSubmitted) {
        onSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to submit exercise work. Please try again.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-[#f8fafc] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block bg-[#f0f4fa] px-2 py-0.5 text-[11px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
                {(exercise.courseId || exercise.course_id || "LAB").toUpperCase()}
              </span>
              <span className="text-[12px] font-semibold text-slate-500">
                Exercise {exercise.exerciseNumber || exercise.exercise_number}
              </span>
            </div>
            <h3 className="mt-1 text-[18px] font-bold text-slate-800 tracking-tight">
              {exercise.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[#159447]" />
                Faculty: <strong className="text-slate-700">{exercise.faculty || "Faculty"}</strong>
              </span>
              {exercise.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Due: {exercise.dueDate}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Exercise Instructions */}
          {exercise.description && (
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 text-[13px] text-slate-700 leading-relaxed">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <FileText className="h-3.5 w-3.5 text-[#164a9c]" />
                Instructions & Requirements
              </div>
              <p>{exercise.description}</p>
            </div>
          )}

          {/* Submission Status & Feedback Card */}
          <div className="border border-slate-200 p-4 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                Current Academic Status
              </div>
              <span
                className={`px-2.5 py-0.5 text-[11px] font-semibold border ${
                  status === "Evaluated"
                    ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                    : status === "Reviewed"
                    ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                    : status === "Submitted"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {status} {marks ? `· ${marks}` : ""}
              </span>
            </div>

            {submittedAt && (
              <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Submitted on: <span className="font-semibold text-slate-700">{submittedAt}</span>
              </div>
            )}

            {/* Evaluation Marks and Faculty Remarks */}
            {(marks || feedback) && (
              <div className="mt-2 bg-[#f8fafc] border border-slate-200/90 p-3 space-y-1.5">
                {marks && (
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800">
                    <Award className="h-4 w-4 text-[#159447]" />
                    <span>Marks Awarded: <strong className="text-[#159447]">{marks}</strong></span>
                  </div>
                )}
                {feedback && (
                  <div className="text-[12.5px] text-slate-700 flex items-start gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#164a9c] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">Faculty Feedback: </span>
                      <span>{feedback}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                <Code className="h-4 w-4 text-[#164a9c]" />
                Solution Source Code
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-500">Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-[#164a9c]"
                >
                  <option value="c">C</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                rows={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste or write your laboratory exercise solution code here..."
                className="w-full font-mono text-[12.5px] p-3 border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-[#164a9c] focus:outline-none leading-relaxed"
                spellCheck="false"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Student Notes / Comments (Optional)
              </label>
              <input
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g. Executed in Ubuntu 24.04 shell, tested all constraints"
                className="w-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex items-center gap-2 bg-[#164a9c] hover:bg-[#123877] text-white px-5 py-2 text-[13px] font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submitting ? (
                  <span>Submitting Work...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{status === "Not Submitted" ? "Submit Exercise Work" : "Resubmit Work"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
