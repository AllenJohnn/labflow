import { Link } from "react-router-dom";
import { ArrowRight, Users, FileText } from "lucide-react";

export default function FacultyLaboratoryCard({ lab }) {
  const { id, course_id, code, name, total_students, assigned_exercises_count } = lab;
  const labId = course_id || id || "nsa";
  const studentCount = total_students || 42;
  const assignedCount = assigned_exercises_count !== undefined ? assigned_exercises_count : 1;

  return (
    <Link
      to={`/faculty/laboratory/${labId}`}
      className="group flex h-full flex-col justify-between border border-slate-200/80 border-t-2 border-t-[#164a9c] bg-white p-5 shadow-2xs transition-all duration-150 hover:border-[#164a9c]/60 hover:bg-slate-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#164a9c]"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="inline-block bg-[#f0f4fa] px-2.5 py-0.5 text-[11px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
            {code || labId.toUpperCase()}
          </span>
          <span className="text-[11px] font-semibold text-[#159447] bg-emerald-50 px-2 py-0.5 border border-[#159447]/15">
            Active Lab
          </span>
        </div>

        <h3 className="mt-3.5 text-[16.5px] font-semibold tracking-tight text-slate-800 leading-snug group-hover:text-[#164a9c] transition-colors">
          {name}
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{studentCount} Students</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
            <FileText className="h-3.5 w-3.5 text-[#164a9c] shrink-0" />
            <span>{assignedCount} {assignedCount === 1 ? "Assigned Ex" : "Assigned Exs"}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-[12.5px] font-medium text-[#164a9c]">
          <span>Open Laboratory</span>
          <ArrowRight className="h-4 w-4 text-[#164a9c] transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
