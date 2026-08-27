import { FileText, Award, MessageSquare, Clock, User } from "lucide-react";

export default function ExercisePanel({
  exercise,
  submission,
  courseId,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white border-r border-slate-200 overflow-y-auto text-slate-800 animate-pulse">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#fbfcfd] space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-slate-200 rounded-xs" />
            <div className="h-4 w-20 bg-slate-100 rounded-xs" />
          </div>
          <div className="h-6 w-3/4 bg-slate-200 rounded-xs" />
          <div className="h-4 w-1/2 bg-slate-100 rounded-xs" />
        </div>
        <div className="p-4 sm:p-5 space-y-5 flex-1">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded-xs" />
            <div className="h-28 bg-slate-50 border border-slate-200/50 rounded-xs" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded-xs" />
            <div className="h-20 bg-slate-50 border border-slate-200/50 rounded-xs" />
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
    <div className="h-full flex flex-col bg-white border-r border-slate-200 overflow-y-auto text-slate-800">
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#fbfcfd]">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-[#f0f4fa] px-2 py-0.5 text-[10.5px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
            {(courseId || exercise?.courseId || exercise?.course_id || "LAB").toUpperCase()}
          </span>
          <span className="text-[12px] font-semibold text-slate-500">
            Exercise {exercise?.exerciseNumber || exercise?.exercise_number || "01"}
          </span>
        </div>

        <h2 className="mt-2 text-[17px] font-bold text-slate-800 tracking-tight leading-snug">
          {exercise?.title || "Laboratory Assignment"}
        </h2>

        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-[#159447]" />
            Faculty: <strong className="text-slate-700">{exercise?.faculty || "Faculty"}</strong>
          </span>
          {exercise?.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Due: {exercise.dueDate}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-5 flex-1 text-[13px] leading-relaxed">
        {/* Problem Statement & Instructions */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#164a9c]">
            <FileText className="h-3.5 w-3.5" />
            Problem Statement & Description
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 text-slate-700 font-normal leading-relaxed text-[13px] whitespace-pre-wrap">
            {exercise?.description ||
              "Please implement the complete solution according to the requirements specified by your laboratory faculty."}
          </div>
        </section>

        {/* Academic Status / Submission History Card */}
        <section className="space-y-2">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">
            Current Academic Status
          </div>
          <div className="border border-slate-200 p-3.5 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-500">Status:</span>
              <span
                className={`px-2 py-0.5 text-[11px] font-semibold border ${
                  status === "Evaluated"
                    ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                    : status === "Reviewed"
                    ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                    : status === "Submitted"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {status}
              </span>
            </div>

            {submittedAt && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Last submitted:</span>
                <span className="font-semibold text-slate-700">{submittedAt}</span>
              </div>
            )}

            {marks && (
              <div className="flex items-center justify-between text-[12px] pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-[#159447]" />
                  Marks Awarded:
                </span>
                <span className="font-bold text-[#159447] text-[13px]">{marks}</span>
              </div>
            )}

            {feedback && (
              <div className="mt-2 p-2.5 bg-[#f8fafc] border border-slate-200/80 text-[12.5px] text-slate-700 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <MessageSquare className="h-3.5 w-3.5 text-[#164a9c]" />
                  Faculty Feedback
                </div>
                <p className="text-slate-600">{feedback}</p>
              </div>
            )}
          </div>
        </section>

        {/* Guidelines */}
        <section className="space-y-1.5 text-[12px] text-slate-500 border-t border-slate-100 pt-3">
          <p className="font-semibold text-slate-600">Important Instructions:</p>
          <ul className="list-disc pl-4 space-y-1">
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
