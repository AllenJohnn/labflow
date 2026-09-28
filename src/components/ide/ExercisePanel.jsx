import { FileText, Award, MessageSquare, Clock, User } from "lucide-react";
import { cn } from "../../lib/utils";

export default function ExercisePanel({
  exercise,
  submission,
  courseId,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-card overflow-y-auto text-foreground animate-pulse">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-muted rounded-sm" />
            <div className="h-4 w-20 bg-muted rounded-sm" />
          </div>
          <div className="h-6 w-3/4 bg-muted rounded-sm" />
          <div className="h-4 w-1/2 bg-muted rounded-sm" />
        </div>
        <div className="p-4 sm:p-5 space-y-5 flex-1">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-muted rounded-sm" />
            <div className="h-28 bg-muted/50 border border-border rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  const status = submission?.status || exercise?.status || "Not Submitted";
  const marks = submission?.marks || exercise?.marks;
  const feedback = submission?.feedback || exercise?.feedback;
  const submittedAt =
    submission?.submitted_date_display ||
    (submission?.submitted_at ? new Date(submission.submitted_at).toLocaleString() : null);

  return (
    <div className="h-full flex flex-col bg-card overflow-y-auto text-card-foreground">
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-primary/10 px-2 py-0.5 rounded-sm text-[10.5px] font-bold text-primary uppercase border border-primary/20">
            {(courseId || exercise?.courseId || exercise?.course_id || "LAB").toUpperCase()}
          </span>
          <span className="text-[12px] font-medium text-muted-foreground">
            Exercise {exercise?.exerciseNumber || exercise?.exercise_number || "01"}
          </span>
        </div>

        <h2 className="mt-2 text-[17px] font-semibold tracking-tight leading-snug">
          {exercise?.title || "Laboratory Assignment"}
        </h2>

        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <User className="h-3.5 w-3.5" />
            Faculty: <strong className="text-foreground">{exercise?.faculty || "Faculty"}</strong>
          </span>
          {exercise?.dueDate && (
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              Due: {exercise.dueDate}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-6 flex-1 text-[13px] leading-relaxed">
        {/* Problem Statement & Instructions */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Problem Statement
          </div>
          <div className="p-4 bg-muted/30 border border-border rounded-md text-foreground font-medium leading-relaxed text-[13px] whitespace-pre-wrap">
            {exercise?.description ||
              "Please implement the complete solution according to the requirements specified by your laboratory faculty."}
          </div>
        </section>

        {/* Academic Status / Submission History Card */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
            Status
          </div>
          <div className="border border-border rounded-md p-4 bg-card space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">Status:</span>
              <span
                className={cn("px-2 py-0.5 text-[11px] font-semibold border rounded-sm",
                  status === "Evaluated"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : status === "Reviewed"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : status === "Submitted"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {status}
              </span>
            </div>

            {submittedAt && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-muted-foreground">Last submitted:</span>
                <span className="font-semibold text-foreground">{submittedAt}</span>
              </div>
            )}

            {submission?.github && (
              <div className="flex items-center justify-between text-[12px] pt-1">
                <span className="font-medium text-muted-foreground">GitHub Sync:</span>
                {submission.github.synced ? (
                  <span className="text-emerald-600 font-medium">Synced</span>
                ) : (
                  <span className="text-red-500 font-medium cursor-help" title={submission.github.error || "Failed to sync to GitHub. The LabFlow submission was saved successfully."}>
                    Sync Failed
                  </span>
                )}
              </div>
            )}

            {marks && (
              <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-emerald-500" />
                  Marks Awarded:
                </span>
                <span className="font-bold text-emerald-500 text-[13px]">{marks}</span>
              </div>
            )}

            {feedback && (
              <div className="mt-3 p-3 bg-muted/40 border border-border rounded-md text-[12.5px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  Faculty Feedback
                </div>
                <p className="text-muted-foreground font-medium">{feedback}</p>
              </div>
            )}
          </div>
        </section>

        {/* Guidelines */}
        <section className="space-y-2 text-[12px] text-muted-foreground border-t border-border pt-4">
          <p className="font-semibold text-foreground">Instructions:</p>
          <ul className="list-disc pl-4 space-y-1.5 font-medium">
            <li>Write clean, indented source code in the Monaco editor.</li>
            <li>Use the <strong>Run</strong> button to test your code locally.</li>
            <li>Click <strong>Submit</strong> to submit your solution to the faculty review queue.</li>
            <li>Your work is automatically saved as a draft locally while you type.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
