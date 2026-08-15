import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  ArrowRight,
  Megaphone,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getAdminProfile,
  getAdminStats,
  getAcademicClasses,
  getCachedAdminProfile,
  getCachedAdminStats,
  getCachedAcademicClasses,
} from "../../services/adminService";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => getCachedAdminProfile());
  const [stats, setStats] = useState(() => getCachedAdminStats());
  const [academicData, setAcademicData] = useState(() => getCachedAcademicClasses());
  const [loading, setLoading] = useState(() => !getCachedAdminStats());

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const [profData, statsData, classData] = await Promise.all([
          getAdminProfile(),
          getAdminStats(),
          getAcademicClasses(),
        ]);
        if (isMounted) {
          setProfile(profData);
          setStats(statsData);
          setAcademicData(classData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Time-based greeting
  const getGreeting = (name) => {
    const hour = new Date().getHours();
    let prefix = "Good morning";
    if (hour >= 12 && hour < 17) prefix = "Good afternoon";
    else if (hour >= 17) prefix = "Good evening";

    const cleanName = name || "Administrator";
    return `${prefix}, ${cleanName}`;
  };

  const adminName = profile?.name || user?.name || "Administrator";
  const groupedPrograms = academicData?.grouped_by_program || {
    MCA: [
      { class_id: "mca-s1", program: "MCA", semester: "S1", name: "MCA Semester 1", student_count: 30 },
      { class_id: "mca-s3", program: "MCA", semester: "S3", name: "MCA Semester 3", student_count: 60 },
    ],
    IMCA: [
      { class_id: "imca-s1", program: "IMCA", semester: "S1", name: "Integrated MCA Semester 1", student_count: 40 },
      { class_id: "imca-s3", program: "IMCA", semester: "S3", name: "Integrated MCA Semester 3", student_count: 38 },
    ],
    CSE: [
      { class_id: "cse-s1", program: "CSE", semester: "S1", name: "B.Tech CSE Semester 1", student_count: 60 },
      { class_id: "cse-s3", program: "CSE", semester: "S3", name: "B.Tech CSE Semester 3", student_count: 58 },
      { class_id: "cse-s5", program: "CSE", semester: "S5", name: "B.Tech CSE Semester 5", student_count: 55 },
    ],
  };

  return (
    <AdminLayout>
      <div className="space-y-7">
        {/* Welcome Header */}
        <div className="border-b border-slate-200/80 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
                {getGreeting(adminName)}
              </h1>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Central Academic & Laboratory Allocation Console · {stats?.active_term || "Academic Year 2025-2026"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold ${
                  stats?.maintenance_mode
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-[#159447] border border-emerald-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    stats?.maintenance_mode ? "bg-amber-500 animate-ping" : "bg-[#159447]"
                  }`}
                />
                <span>
                  {stats?.maintenance_mode ? "Maintenance Mode Active" : "System Operational"}
                </span>
              </div>

              <Link
                to="/admin/maintenance"
                className="border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Manage Status
              </Link>
            </div>
          </div>
        </div>

        {/* Global Institutional Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link
            to="/admin/students"
            className="group border border-slate-200/80 bg-white p-4 transition hover:border-[#164a9c]/50 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Students
              </span>
              <Users className="h-4 w-4 text-slate-400 group-hover:text-[#164a9c]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#164a9c]">
              {stats?.total_students ?? (loading ? "..." : 60)}
            </div>
            <span className="text-[11px] text-slate-500">Registered across programs</span>
          </Link>

          <Link
            to="/admin/faculty"
            className="group border border-slate-200/80 bg-white p-4 transition hover:border-[#159447]/50 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Faculty Members
              </span>
              <UserCheck className="h-4 w-4 text-slate-400 group-hover:text-[#159447]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#159447]">
              {stats?.total_faculty ?? (loading ? "..." : 3)}
            </div>
            <span className="text-[11px] text-slate-500">Teaching faculty allocated</span>
          </Link>

          <Link
            to="/admin/laboratories"
            className="group border border-slate-200/80 bg-white p-4 transition hover:border-slate-400 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Laboratories
              </span>
              <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-slate-800">
              {stats?.total_laboratories ?? (loading ? "..." : 3)}
            </div>
            <span className="text-[11px] text-slate-500">Active lab courses</span>
          </Link>

          <Link
            to="/admin/classes"
            className="group border border-slate-200/80 bg-white p-4 transition hover:border-slate-400 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Academic Classes
              </span>
              <GraduationCap className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-slate-800">
              {stats?.total_classes ?? (loading ? "..." : 7)}
            </div>
            <span className="text-[11px] text-slate-500">Program semester sections</span>
          </Link>
        </div>

        {/* PRIMARY SECTION: ACADEMIC CLASS NAVIGATOR */}
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">
                Academic Programs & Classes
              </h2>
              <p className="text-[13px] text-slate-500">
                Choose an academic class to manage the enrolled students, subjects, and faculty allocation.
              </p>
            </div>
            <Link
              to="/admin/classes"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#164a9c] hover:underline"
            >
              <span>View All Classes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedPrograms).map(([progName, classes]) => (
              <div
                key={progName}
                className="border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center bg-[#164a9c] text-[11px] font-bold text-white">
                      {progName}
                    </span>
                    <h3 className="text-[15px] font-bold text-slate-800">
                      {progName === "MCA"
                        ? "Master of Computer Applications (MCA)"
                        : progName === "IMCA"
                        ? "Integrated MCA (IMCA)"
                        : "Computer Science & Engineering (B.Tech CSE)"}
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {classes.length} {classes.length === 1 ? "Section" : "Sections"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {classes.map((cls) => (
                    <button
                      key={cls.class_id || `${cls.program}-${cls.semester}`}
                      type="button"
                      onClick={() => navigate(`/admin/classes/${cls.program}/${cls.semester}`)}
                      className="group flex flex-col justify-between border border-slate-200/90 bg-[#fbfcfd] p-4 text-left transition hover:border-[#164a9c] hover:bg-white hover:shadow-xs focus:outline-none"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-brand text-[15px] font-bold text-slate-800 group-hover:text-[#164a9c]">
                              {cls.program} {cls.semester}
                            </span>
                            {cls.program === "MCA" && cls.semester === "S3" && (
                              <span className="bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#159447] border border-emerald-200">
                                Active Lab Term
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[12px] text-slate-500 line-clamp-1">
                            {cls.name || `${cls.program} Semester ${cls.semester}`}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#164a9c]" />
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {cls.student_count ?? 60} Students
                        </span>
                        <span className="text-slate-400">
                          {cls.subjects?.length || (cls.semester === "S3" && cls.program === "MCA" ? 3 : 2)} Subjects
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Management Shortcuts */}
        <section className="border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-[14px] font-bold text-slate-800 tracking-tight uppercase tracking-wider text-slate-400 text-[11px]">
            Administrative Management Centers
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/students"
              className="flex items-start gap-3 border border-slate-100 bg-[#f8fafc] p-3.5 transition hover:border-[#164a9c]/40 hover:bg-white"
            >
              <Users className="h-5 w-5 shrink-0 text-[#164a9c] mt-0.5" />
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800">Student Roster</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Inspect student records, roll numbers, and account status.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/faculty"
              className="flex items-start gap-3 border border-slate-100 bg-[#f8fafc] p-3.5 transition hover:border-[#159447]/40 hover:bg-white"
            >
              <UserCheck className="h-5 w-5 shrink-0 text-[#159447] mt-0.5" />
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800">Faculty Allocation</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assign and reassign faculty to laboratory courses.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/announcements"
              className="flex items-start gap-3 border border-slate-100 bg-[#f8fafc] p-3.5 transition hover:border-slate-400 hover:bg-white"
            >
              <Megaphone className="h-5 w-5 shrink-0 text-slate-700 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800">Announcements</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Publish notices to students, faculty, or entire campus.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/audit"
              className="flex items-start gap-3 border border-slate-100 bg-[#f8fafc] p-3.5 transition hover:border-slate-400 hover:bg-white"
            >
              <ClipboardList className="h-5 w-5 shrink-0 text-slate-700 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800">Audit Trail</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Trace administrative operations and account modifications.
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
