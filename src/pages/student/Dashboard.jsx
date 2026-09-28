import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowRight,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentProfile,
  getStudentLaboratories,
  getStudentAnnouncements,
  getStudentAttendance,
  getCachedLaboratories,
  getCachedProfile,
  getCachedAnnouncements,
} from "../../services/studentService";
import StudentLayout from "../../components/layout/StudentLayout";
import LaboratoryCard from "../../components/dashboard/LaboratoryCard";

export default function Dashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => getCachedProfile());
  const [laboratories, setLaboratories] = useState(() => getCachedLaboratories() || []);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(() => !getCachedLaboratories());

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [profData, labsData, annData, atndData] = await Promise.all([
          getStudentProfile(),
          getStudentLaboratories(),
          getStudentAnnouncements(),
          getStudentAttendance(),
        ]);
        if (isMounted) {
          setProfile(profData);
          setLaboratories(labsData);
          setAnnouncements(annData);
          setAttendanceSummary(atndData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading student dashboard data:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGreetingText = (fullName) => {
    const firstName = fullName ? fullName.split(" ")[0] : "Allen";
    const hour = new Date().getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17) {
      timeGreeting = "Good evening";
    }
    return `${timeGreeting}, ${firstName}`;
  };

  const studentFullName = profile?.name || user?.name || "Allen John";
  const academicProgram = "MCA S3 · Computer Applications";

  return (
    <StudentLayout profile={profile} announcements={announcements}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-4">
          <div>
            <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
              {getGreetingText(studentFullName)}
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-[#159447] tracking-wide">
              {academicProgram}
            </p>
          </div>

          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-[#164a9c] shadow-2xs transition hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4" />
            <span>Attendance: <strong className="text-slate-900">{attendanceSummary?.overall_percentage ?? 90.9}%</strong></span>

          </Link>
        </div>



        <section className="space-y-3.5 pt-1">
          <div>
            <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight">
              My Laboratories
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Your assigned programming laboratories
            </p>
          </div>

          {loading && laboratories.length === 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[200px] rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-3"></div>
                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-5 w-16 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          
          ) : laboratories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
              <FolderOpen className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-[14px] font-medium text-slate-600">No assigned laboratories.</p>
              <p className="text-[12px] text-slate-400 mt-1">When you are assigned to a lab, it will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              {laboratories.map((lab) => (
                <LaboratoryCard key={lab.id} lab={lab} />
              ))}
            </div>
          )}
        </section>
      </div>
    </StudentLayout>
  );
}
