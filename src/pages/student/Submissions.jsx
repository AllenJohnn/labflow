import { useState, useEffect } from "react";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  getStudentAnnouncements,
  getStudentRecentActivity,
  getCachedAnnouncements,
} from "../../services/studentService";

export default function StudentSubmissions() {
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    Promise.all([getStudentAnnouncements(), getStudentRecentActivity()])
      .then(([a, act]) => {
        setAnnouncements(a);
        setActivities(act);
      })
      .catch(console.error);
  }, []);

  return (
    <StudentLayout announcements={announcements}>
      <div className="space-y-6">
        <div className="border-b border-slate-200/70 pb-4">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            Submission History
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Review code submissions, faculty evaluations, and marks awarded.
          </p>
        </div>

        <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="divide-y divide-slate-100">
            {activities.map((act) => (
              <div key={act.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] border border-[#164a9c]/15">
                    {act.subjectCode}
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-slate-800">{act.title}</h4>
                    <p className="text-[11px] text-slate-400">{act.timestamp}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-[#159447] bg-emerald-50 px-2.5 py-0.5 border border-[#159447]/20">
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

