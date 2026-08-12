import { useState, useEffect } from "react";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  getStudentAnnouncements,
  getCachedAnnouncements,
  getAllAssignedExercises,
} from "../../services/studentService";

export default function StudentExercises() {
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    Promise.all([getStudentAnnouncements(), getAllAssignedExercises()])
      .then(([a, exList]) => {
        setAnnouncements(a);
        setExercises(exList);
      })
      .catch(console.error);
  }, []);

  return (
    <StudentLayout announcements={announcements}>
      <div className="space-y-6">
        <div className="border-b border-slate-200/70 pb-4">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            Laboratory Exercises
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            View active, pending, and evaluated programming lab assignments.
          </p>
        </div>

        <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="divide-y divide-slate-100">
            {exercises.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-block bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] border border-[#164a9c]/15 uppercase">
                    {item.courseId}
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-slate-800">
                      Exercise {item.exerciseNumber}: {item.title}
                    </h4>
                    <p className="text-[12px] text-slate-500">Faculty: {item.faculty}</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 border ${
                    item.status === "Evaluated"
                      ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                      : item.status === "Reviewed"
                      ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                      : item.status === "Submitted"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}


