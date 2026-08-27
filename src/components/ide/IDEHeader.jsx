import { ArrowLeft, Play, Send, Clock, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function IDEHeader({
  courseId,
  exercise,
  language,
  onRun,
  onSubmit,
  onResetCode,
  isRunning,
  isSubmitting,
  submissionStatus,
  submissionMarks,
  lastSubmittedAt,
  hasLocalDraft,
}) {
  const displayLang = (language || "c").toUpperCase();
  const cid = (courseId || exercise?.courseId || exercise?.course_id || "lab").toUpperCase();

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
      {/* Left: Back Link & Exercise Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={`/student/laboratory/${(courseId || exercise?.courseId || "").toLowerCase()}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-[#164a9c] transition shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Laboratory</span>
        </Link>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block bg-[#f0f4fa] px-2 py-0.5 text-[10.5px] font-bold text-[#164a9c] border border-[#164a9c]/15 uppercase shrink-0">
            {cid} EX {exercise?.exerciseNumber || exercise?.exercise_number || "01"}
          </span>
          <h1 className="text-[13.5px] sm:text-[14.5px] font-bold text-slate-800 truncate tracking-tight">
            {exercise?.title || "Laboratory Exercise"}
          </h1>
        </div>
      </div>

      {/* Center/Right: Status, Language & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Submission status badge */}
        {submissionStatus && submissionStatus !== "Not Submitted" ? (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold">
            <span
              className={`px-2 py-0.5 border ${
                submissionStatus === "Evaluated"
                  ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                  : submissionStatus === "Reviewed"
                  ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {submissionStatus} {submissionMarks ? `(${submissionMarks})` : ""}
            </span>
            {lastSubmittedAt && (
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastSubmittedAt}
              </span>
            )}
          </div>
        ) : (
          <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5">
            Not Submitted
          </span>
        )}

        {/* Draft indicator */}
        {hasLocalDraft && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-xs" title="Draft saved locally in browser">
            <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" />
            Draft Saved
          </span>
        )}

        {/* Language Badge (Source of truth) */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11.5px] font-bold text-slate-700 font-mono">
          <span className="text-slate-400 text-[10.5px] font-sans font-normal uppercase">Lang:</span>
          <span>{displayLang}</span>
        </div>

        {/* Reset Template Code Button */}
        {onResetCode && (
          <button
            type="button"
            onClick={onResetCode}
            title="Reset code to starter template"
            className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Run Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || isSubmitting}
          className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <Play className="h-3.5 w-3.5 text-[#159447] fill-[#159447]" />
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>

        {/* Submit Exercise Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isRunning}
          className="inline-flex items-center gap-1.5 bg-[#164a9c] hover:bg-[#123877] text-white px-3.5 sm:px-4 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          {isSubmitting ? (
            <span>Submitting...</span>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>{submissionStatus && submissionStatus !== "Not Submitted" ? "Resubmit" : "Submit"}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
