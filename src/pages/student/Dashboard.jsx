import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowRight,
  ShieldCheck,
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

  // Initialize state synchronously from cache to eliminate loading delays when navigating back
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

  // Dynamic time-based greeting calculation
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
        {/* Compact Dashboard Greeting Header */}
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
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              (attendanceSummary?.is_above_threshold ?? true)
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}>
              {attendanceSummary?.status_label || "Above Required Threshold"}
            </span>
          </Link>
        </div>

        {/* Attendance Schedule Info Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#164a9c] text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#164a9c]">
                  Laboratory Session Attendance
                </span>
              </div>
              <p className="text-[13px] text-slate-600">
                Attendance is authenticated upon entering your scheduled laboratory session according to the academic timetable.
              </p>
            </div>
          </div>

          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#164a9c] hover:underline"
          >
            <span>View Timetable & Calendar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Primary Section: My Laboratories */}
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
                  className="h-52 border border-slate-200/80 bg-slate-50/60 p-6"
                />
              ))}
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

