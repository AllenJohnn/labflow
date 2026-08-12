import { Clock, CheckCircle2, FileCheck, Eye } from "lucide-react";

export default function RecentActivity({ activities = [] }) {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-[16px] font-semibold text-slate-800 tracking-tight">
            Recent Activity
          </h3>
          <p className="text-[12px] text-slate-400">
            Latest laboratory exercise submissions & faculty evaluations
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Last 7 Days
        </span>
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        {activities.map((act) => {
          const isEvaluated = act.status === "Evaluated";
          const isSubmitted = act.status === "Submitted";

          return (
            <div
              key={act.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-[13px] transition hover:bg-slate-50/50 px-2 -mx-2"
            >
              {/* Left: Code badge & title */}
              <div className="flex items-center gap-3">
                <span className="inline-block bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
                  {act.subjectCode}
                </span>
                <span className="font-medium text-slate-800">{act.title}</span>
              </div>

              {/* Right: Status badge & timestamp */}
              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold border ${
                    isEvaluated
                      ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                      : isSubmitted
                      ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {isEvaluated ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : isSubmitted ? (
                    <FileCheck className="h-3 w-3 shrink-0" />
                  ) : (
                    <Eye className="h-3 w-3 shrink-0" />
                  )}
                  {act.status}
                </span>

                <div className="flex items-center gap-1 text-[12px] text-slate-400">
                  <Clock className="h-3 w-3 shrink-0 text-slate-300" />
                  <span>{act.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
