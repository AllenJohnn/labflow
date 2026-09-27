import { ArrowLeft, ChevronRight, Play, Send, Clock, RotateCcw, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";

export default function IDEHeader({
  courseId,
  exercise,
  language,
  onRun,
  onRunTests,
  onSubmit,
  onResetCode,
  isRunning,
  isRunningTests,
  isSubmitting,
  submissionStatus,
  submissionMarks,
  lastSubmittedAt,
  hasLocalDraft,
}) {
  const displayLang = (language || "c").toUpperCase();
  const cid = (courseId || exercise?.courseId || exercise?.course_id || "lab").toUpperCase();

  return (
    <header className="h-14 shrink-0 bg-background border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
      {/* Left: Breadcrumbs & Exercise Title */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Link
          to="/student/dashboard"
          className="hidden sm:inline-flex items-center text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition shrink-0"
        >
          Dashboard
        </Link>
        <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
        
        <Link
          to="/student/laboratory"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <ArrowLeft className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Laboratories</span>
        </Link>
        <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block bg-primary/10 px-2 py-0.5 rounded-sm text-[10.5px] font-bold text-primary uppercase shrink-0">
            {cid} EX {exercise?.exerciseNumber || exercise?.exercise_number || "01"}
          </span>
          <h1 className="text-[13.5px] sm:text-[14.5px] font-semibold text-foreground truncate tracking-tight">
            {exercise?.title || "Laboratory Exercise"}
          </h1>
        </div>
      </div>

      {/* Center/Right: Status, Language & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Submission status badge */}
        {submissionStatus && submissionStatus !== "Not Submitted" ? (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold">
            <span
              className={`px-2 py-0.5 rounded-sm border ${
                submissionStatus === "Evaluated" ? "bg-green-500/10 text-green-600 border-green-500/20" : 
                "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {submissionStatus} {submissionMarks ? `(${submissionMarks})` : ""}
            </span>
            {lastSubmittedAt && (
              <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastSubmittedAt}
              </span>
            )}
          </div>
        ) : (
          <span className="hidden md:inline-block text-[11px] font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-sm">
            Not Submitted
          </span>
        )}

        {/* Draft indicator */}
        {hasLocalDraft && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-sm" title="Draft saved locally in browser">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Draft Saved
          </span>
        )}

        {/* Language Badge */}
        <div className="flex items-center gap-1.5 bg-muted border border-border px-2.5 py-1 rounded-sm text-[11.5px] font-bold text-foreground font-mono">
          <span className="text-muted-foreground text-[10.5px] font-sans font-normal uppercase">Lang:</span>
          <span>{displayLang}</span>
        </div>

        {/* Reset Template Code Button */}
        {onResetCode && (
          <button
            type="button"
            onClick={onResetCode}
            title="Reset code to starter template"
            className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Run Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || isRunningTests || isSubmitting}
          className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-accent text-foreground px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Play className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>
        
        {/* Run Tests Button */}
        {onRunTests && (
          <button
            type="button"
            onClick={onRunTests}
            disabled={isRunning || isRunningTests || isSubmitting}
            className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-accent text-foreground px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <ListChecks className="h-3.5 w-3.5 text-blue-500" />
            <span>{isRunningTests ? "Testing..." : "Run Tests"}</span>
          </button>
        )}

        {/* Submit Exercise Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isRunning || isRunningTests}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 sm:px-4 py-1.5 rounded-md text-[12.5px] font-medium transition disabled:opacity-50 cursor-pointer shadow-sm"
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
