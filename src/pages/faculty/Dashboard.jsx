import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getFacultyProfile,
  getFacultyLaboratories,
  getFacultyAttendanceOverview,
  getCachedFacultyLabs,
  getCachedFacultyProfile,
} from "../../services/facultyService";
import { getStudentAnnouncements, getCachedAnnouncements } from "../../services/studentService";
import FacultyLayout from "../../components/layout/FacultyLayout";
import FacultyLaboratoryCard from "../../components/dashboard/FacultyLaboratoryCard";

export default function FacultyDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => getCachedFacultyProfile());
  const [laboratories, setLaboratories] = useState(() => getCachedFacultyLabs() || []);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [loading, setLoading] = useState(() => !getCachedFacultyLabs());

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [profData, labsData, annData, atndData] = await Promise.all([
          getFacultyProfile(),
          getFacultyLaboratories(),
          getStudentAnnouncements(),
          getFacultyAttendanceOverview(),
        ]);
        if (isMounted) {
          setProfile(profData);
          setLaboratories(labsData);
          setAnnouncements(annData);
          setAttendanceOverview(atndData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading faculty dashboard data:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGreetingText = (fullName) => {
    const firstName = fullName ? fullName.split(" ")[0] : "Rakhi";
    const hour = new Date().getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17) {
      timeGreeting = "Good evening";
    }
    return `${timeGreeting}, ${firstName}`;
  };

  const facultyFullName = profile?.name || user?.name || "Rakhi";
  const facultyRoleContext = "Faculty · MCA";

  return (
    <FacultyLayout profile={profile} announcements={announcements}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-4">
          <div>
            <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
              {getGreetingText(facultyFullName)}
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-[#159447] tracking-wide">
              {facultyRoleContext}
            </p>
          </div>

          <Link
            to="/faculty/attendance"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-[#164a9c] shadow-2xs transition hover:bg-slate-50"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Class Attendance Roster</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              {attendanceOverview?.assigned_labs?.[0]?.avg_attendance_percentage ?? 93.4}% Avg
            </span>
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
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-48 border border-slate-200/80 bg-slate-50/60 p-6 animate-pulse"
                />
              ))}
            </div>
          ) : laboratories.length === 0 ? (
            <div className="border border-slate-200/80 bg-white p-8 text-center text-[13px] text-slate-500">
              No laboratories are currently assigned to your account.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {laboratories.map((lab) => (
                <FacultyLaboratoryCard key={lab.id || lab.course_id} lab={lab} />
              ))}
            </div>
          )}
        </section>
      </div>
    </FacultyLayout>
  );
}
