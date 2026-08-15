import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ArrowRight, CheckCircle2 } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { getAcademicClasses, getCachedAcademicClasses } from "../../services/adminService";

export default function Classes() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => getCachedAcademicClasses());
  const [loading, setLoading] = useState(() => !getCachedAcademicClasses());
  const [selectedProgram, setSelectedProgram] = useState("ALL");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getAcademicClasses();
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading classes:", err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const programs = ["ALL", "MCA", "IMCA", "CSE"];
  const classesList = data?.classes || [];

  const filteredClasses = classesList.filter((c) =>
    selectedProgram === "ALL" ? true : c.program === selectedProgram
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
                Academic Classes & Sections
              </h1>
              <p className="text-[13px] text-slate-500">
                Institutional program structure, semester classes, and faculty laboratory allocations.
              </p>
            </div>

            {/* Program Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 border border-slate-200/80">
              {programs.map((prog) => (
                <button
                  key={prog}
                  type="button"
                  onClick={() => setSelectedProgram(prog)}
                  className={`px-3 py-1 text-[12px] font-semibold transition ${
                    selectedProgram === prog
                      ? "bg-white text-[#164a9c] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {prog}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {loading && classesList.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 border border-slate-200 bg-white p-5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <div
                key={cls.class_id || `${cls.program}-${cls.semester}`}
                className="flex flex-col justify-between border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-[#164a9c]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center bg-[#164a9c] text-[12px] font-bold text-white">
                        {cls.program}
                      </span>
                      <div>
                        <h3 className="font-brand text-[16px] font-bold text-slate-800">
                          {cls.program} · Semester {cls.semester}
                        </h3>
                        <p className="text-[11px] text-slate-400">{cls.academic_year || "2025-2026"}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-[#159447] border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  </div>

                  {/* Summary of subjects */}
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Subjects & Assigned Faculty
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {cls.subjects && cls.subjects.length > 0 ? (
                        cls.subjects.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[12px] border-b border-slate-50 pb-1"
                          >
                            <span className="font-medium text-slate-700">{sub.code || sub.name}</span>
                            <span className="text-slate-500 text-[11px]">{sub.faculty}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12px] text-slate-400 italic">No subjects configured</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{cls.student_count ?? 60} Students</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/classes/${cls.program}/${cls.semester}`)}
                    className="inline-flex items-center gap-1 bg-[#164a9c] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
                  >
                    <span>Manage Class</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
