import { useState } from "react";
import { X, Check, Copy, Award, MessageSquare, Clock, User, Code, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { evaluateFacultySubmission } from "../../services/facultyService";

export default function FacultyEvaluationModal({ submission, isOpen, onClose, onEvaluated }) {
  const [status, setStatus] = useState(() => (submission?.status === "Not Submitted" ? "Evaluated" : (submission?.status || "Evaluated")));
  const [marks, setMarks] = useState(() => submission?.marks || "");
  const [feedback, setFeedback] = useState(() => submission?.feedback || "");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !submission) return null;

  const handleCopyCode = () => {
    if (submission.submitted_code) {
      navigator.clipboard.writeText(submission.submitted_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Submitted code copied to clipboard");
    }
  };

  const handleQuickMark = (val) => {
    setMarks(val);
    if (status !== "Evaluated") {
      setStatus("Evaluated");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        status,
        marks: marks.trim() || null,
        feedback: feedback.trim() || null,
      };

      const subId = submission.submission_id || submission.id || submission._id;
      const res = await evaluateFacultySubmission(subId, payload, submission.course_id);

      toast.success(`Evaluation recorded for ${submission.student_name} (${submission.student_id})`);
      if (onEvaluated) {
        onEvaluated(res.data || { ...submission, ...payload });
      }
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to save evaluation. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
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
                {(submission.course_id || "LAB").toUpperCase()}
              </span>
              <span className="text-[12px] font-semibold text-slate-500">
                Exercise {submission.exercise_number || "01"}
              </span>
            </div>
            <h3 className="mt-1 text-[17px] font-bold text-slate-800 tracking-tight">
              {submission.exercise_title || "Laboratory Exercise Submission"}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <User className="h-3.5 w-3.5 text-[#159447]" />
                {submission.student_name}
              </span>
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5">
                {submission.student_id}
              </span>
              <span className="text-slate-400">· {submission.student_email}</span>
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
          {/* Submission Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-[12px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Submitted: <strong>{submission.submitted_at || "Recent"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Language:</span>
              <span className="font-mono font-semibold uppercase text-slate-700 bg-white border border-slate-200 px-2 py-0.5">
                {submission.language || "code"}
              </span>
            </div>
          </div>

          {/* Student Comments (if any) */}
          {submission.comments && (
            <div className="bg-amber-50/70 border border-amber-200/80 p-3 text-[12.5px] text-amber-900">
              <span className="font-semibold text-amber-800">Student Note: </span>
              {submission.comments}
            </div>
          )}

          {/* Submitted Code Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-[#164a9c]" />
                Student Source Code Submission
              </label>
              {submission.submitted_code && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#164a9c] transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-[#159447]" />
                      <span className="text-[#159447]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="border border-slate-200 bg-slate-900 text-slate-100 p-3.5 font-mono text-[12px] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap selection:bg-[#164a9c]">
              {submission.submitted_code || "// No code submitted yet."}
            </div>
          </div>

          {/* Faculty Evaluation Form */}
          <form onSubmit={handleSave} className="border-t border-slate-200 pt-4 space-y-4">
            <div className="text-[13px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#159447]" />
              Academic Evaluation & Grading
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Submission Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 focus:outline-none focus:border-[#164a9c]"
                >
                  <option value="Evaluated">Evaluated (Final marks awarded)</option>
                  <option value="Reviewed">Reviewed (Checked, awaiting viva/marks)</option>
                  <option value="Submitted">Submitted (Pending review)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Marks Awarded (e.g. 18/20)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="e.g. 19/20 or 20/20"
                    className="w-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Quick:</span>
                    {["20/20", "19/20", "18/20", "17/20", "15/20"].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleQuickMark(score)}
                        className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 hover:border-[#164a9c] hover:text-[#164a9c] transition cursor-pointer"
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-[#164a9c]" />
                Faculty Feedback Remarks
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter constructive remarks on logic, code cleanliness, test case coverage, or viva questions..."
                className="w-full border border-slate-200 bg-white p-2.5 text-[12.5px] text-slate-800 focus:border-[#164a9c] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
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
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#159447] hover:bg-[#127a3a] text-white px-5 py-2 text-[13px] font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isSaving ? (
                  <span>Saving Evaluation...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Evaluation</span>
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
