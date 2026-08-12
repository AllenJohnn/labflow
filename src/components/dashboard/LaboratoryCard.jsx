import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function LaboratoryCard({ lab }) {
  const { id, code, name, faculty, exercisesCount } = lab;

  return (
    <Link
      to={`/student/laboratory/${id}`}
      className="group flex h-full flex-col justify-between border border-slate-200/80 border-t-2 border-t-[#164a9c] bg-white p-5 shadow-2xs transition-all duration-150 hover:border-[#164a9c]/60 hover:bg-slate-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#164a9c]"
    >
      <div>
        {/* Subject Code Badge & Exercise Count */}
        <div className="flex items-center justify-between">
          <span className="inline-block bg-[#f0f4fa] px-2.5 py-0.5 text-[11px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
            {code}
          </span>
          <span className="text-[12px] font-medium text-slate-500">
            {exercisesCount} Exercises
          </span>
        </div>

        {/* Subject Name */}
        <h3 className="mt-3 text-[16.5px] font-semibold tracking-tight text-slate-800 leading-snug group-hover:text-[#164a9c] transition-colors">
          {name}
        </h3>

        {/* Faculty Name */}
        <div className="mt-3.5 border-t border-slate-100 pt-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Faculty
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-slate-700">
            {faculty}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 border-t border-slate-100 pt-2.5">
        <div className="flex items-center justify-between text-[12.5px] font-medium text-[#164a9c]">
          <span>View Laboratory</span>
          <ArrowRight className="h-4 w-4 text-[#164a9c] transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}


