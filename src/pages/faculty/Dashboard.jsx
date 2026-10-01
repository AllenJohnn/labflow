import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  FolderOpen,
  Users,
  Clock,
  AlertCircle,
  ChevronRight,
  Activity,
  CheckCircle2,
  Calendar,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  getFacultyProfile,
  getFacultyLaboratories,
  getFacultyAttendanceOverview,
  getFacultySubmissions,
  getCachedFacultyLabs,
  getCachedFacultyProfile,
} from "../../services/facultyService";
import { getStudentAnnouncements, getCachedAnnouncements } from "../../services/studentService";
import FacultyLayout from "../../components/layout/FacultyLayout";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, duration: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FacultyDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => getCachedFacultyProfile());
  const [laboratories, setLaboratories] = useState(() => getCachedFacultyLabs() || []);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [attendanceOverview, setAttendanceOverview] = useState(null);

  // Overview metrics state
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    pendingSubmissionsList: [],
    loading: true,
  });
  const [loading, setLoading] = useState(() => !getCachedFacultyLabs());
  const [error, setError] = useState(null);

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

          // Build overview metrics from assigned labs
          const safeLabsData = labsData || [];
          let totalStudents = 0;
          let allSubmissions = [];

          safeLabsData.forEach((lab) => {
            totalStudents += lab.total_students || 0;
          });

          // Fetch submissions for all assigned labs concurrently
          const subsPromises = safeLabsData.map((lab) =>
            getFacultySubmissions(lab.course_id || lab.id).catch(() => [])
          );

          const subsResults = await Promise.all(subsPromises);
          subsResults.forEach((labSubs) => {
            if (Array.isArray(labSubs)) {
              allSubmissions = [...allSubmissions, ...labSubs];
            }
          });

          // A submission needs review if it's "submitted" or "pending"
          const pending = allSubmissions.filter(
            (s) =>
              s.status?.toLowerCase() === "submitted" ||
              s.status?.toLowerCase() === "pending"
          );

          // Oldest first for Needs Attention
          pending.sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));

          setMetrics({
            totalStudents,
            totalSubmissions: allSubmissions.length,
            pendingReviews: pending.length,
            pendingSubmissionsList: pending.slice(0, 4), // Take top 4 for the list
            loading: false,
          });

          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading faculty dashboard data:", err);
        if (isMounted) {
          setError("Unable to load complete dashboard data.");
          setLoading(false);
          setMetrics((prev) => ({ ...prev, loading: false }));
        }
      }
    }
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGreetingText = (fullName) => {
    const firstName = fullName ? fullName.split(" ")[0] : "Faculty";
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
  const facultyRoleContext = profile?.department ? `Faculty · ${profile.department}` : "Faculty · MCA";

  // Check for upcoming lab
  const upcomingLab = attendanceOverview?.upcoming_classes?.[0] || null;

  return (
    <FacultyLayout profile={profile} announcements={announcements}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              {getGreetingText(facultyFullName)}
            </h1>
            <p className="mt-1 text-[14px] font-medium text-[#164a9c] bg-blue-50/50 inline-block px-2.5 py-0.5 rounded-md border border-blue-100/50">
              {facultyRoleContext}
            </p>
          </div>

          <Link
            to="/faculty/attendance"
            className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
          >
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">Class Attendance</span>
            {attendanceOverview?.assigned_labs?.[0]?.avg_attendance_percentage && (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                {attendanceOverview.assigned_labs[0].avg_attendance_percentage}% Avg
              </span>
            )}
          </Link>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-[13px] font-medium">{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-[12px] font-semibold bg-white border border-red-200 px-3 py-1.5 rounded-lg text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* OVERVIEW METRICS */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Laboratories"
            value={laboratories.length}
            subtitle="Assigned"
            icon={<FolderOpen className="h-5 w-5 text-blue-600" />}
            loading={loading}
            colorClass="bg-blue-50/50 border-blue-100/50"
          />
          <MetricCard
            title="Students"
            value={metrics.totalStudents}
            subtitle="Enrolled"
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            loading={metrics.loading}
            colorClass="bg-indigo-50/50 border-indigo-100/50"
          />
          <MetricCard
            title="Submissions"
            value={metrics.totalSubmissions}
            subtitle="Total Received"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            loading={metrics.loading}
            colorClass="bg-emerald-50/50 border-emerald-100/50"
          />
          <MetricCard
            title="Pending Review"
            value={metrics.pendingReviews}
            subtitle="Need attention"
            icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
            loading={metrics.loading}
            colorClass="bg-amber-50/50 border-amber-100/50"
            highlight={metrics.pendingReviews > 0}
          />
        </motion.div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - MY LABORATORIES (Spans 2 columns) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#164a9c]" />
                My Laboratories
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-40 rounded-xl border border-slate-200/60 bg-white/50 p-6 animate-pulse"
                  />
                ))}
              </div>
            ) : laboratories.length === 0 ? (
              <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                <FolderOpen className="h-10 w-10 text-slate-300 mb-3" />
                <h3 className="text-[14px] font-semibold text-slate-700">No laboratories assigned</h3>
                <p className="text-[13px] text-slate-500 mt-1 max-w-xs">
                  You have not been assigned to manage any programming laboratories yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {laboratories.map((lab) => (
                  <EnhancedLaboratoryCard key={lab.id || lab.course_id} lab={lab} />
                ))}
              </div>
            )}
          </motion.div>

          {/* RIGHT COLUMN - NEEDS ATTENTION & UPCOMING */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* NEEDS ATTENTION */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[320px]">
              <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-600" />
                <h2 className="text-[14px] font-bold text-slate-800">Needs Attention</h2>
              </div>

              <div className="p-0 flex-1 overflow-y-auto">
                {metrics.loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : metrics.pendingSubmissionsList.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {metrics.pendingSubmissionsList.map((sub) => (
                      <Link
                        key={sub.submission_id}
                        to={`/faculty/laboratory/${sub.course_id}/submission/${sub.submission_id}`}
                        className="group flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="bg-amber-100 text-amber-700 p-1.5 rounded-md mt-0.5 shrink-0">
                          <ClipboardList className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-[#164a9c] transition-colors">
                            {sub.student_name || sub.student_id}
                          </p>
                          <p className="text-[12px] text-slate-500 truncate mt-0.5">
                            {sub.exercise_title || `Exercise ${sub.exercise_number}`}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#164a9c] shrink-0 self-center" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-3" />
                    <p className="text-[14px] font-medium text-slate-700">All caught up!</p>
                    <p className="text-[12px] text-slate-500 mt-1">
                      No pending submissions require your review.
                    </p>
                  </div>
                )}
              </div>
              {metrics.pendingReviews > 4 && (
                <div className="bg-slate-50/50 px-4 py-2.5 border-t border-slate-100 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    + {metrics.pendingReviews - 4} more pending
                  </span>
                </div>
              )}
            </div>

            {/* UPCOMING LABORATORY */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#164a9c]" />
                <h2 className="text-[14px] font-bold text-slate-800">Upcoming Laboratory</h2>
              </div>

              <div className="p-5">
                {loading || !attendanceOverview ? (
                  <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                ) : upcomingLab ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-800">
                        {upcomingLab.name}
                      </h3>
                      <p className="text-[12px] font-medium text-[#164a9c] mt-0.5">
                        {upcomingLab.course_id?.toUpperCase() || "LAB"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>
                          {upcomingLab.day_label || upcomingLab.day} · {upcomingLab.start_time} –{" "}
                          {upcomingLab.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{upcomingLab.location || "Main Computer Lab"}</span>
                      </div>
                    </div>

                    <Link
                      to={`/faculty/laboratory/${upcomingLab.course_id}`}
                      className="mt-4 w-full flex items-center justify-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Open Laboratory
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-[13px] font-medium text-slate-600">No upcoming sessions</p>
                    <p className="text-[12px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                      No laboratory sessions are scheduled in the near future.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </FacultyLayout>
  );
}

function MetricCard({ title, value, subtitle, icon, loading, colorClass, highlight }) {
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-xl border ${
        highlight
          ? "border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.12)]"
          : "border-slate-200 shadow-xs"
      } p-5 transition-shadow hover:shadow-md`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[12.5px] font-medium text-slate-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1" />
          ) : (
            <h3
              className={`text-2xl font-bold ${
                highlight ? "text-amber-700" : "text-slate-800"
              } tracking-tight`}
            >
              {value}
            </h3>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-2">
            {subtitle}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function EnhancedLaboratoryCard({ lab }) {
  const { id, course_id, code, name, total_students, assigned_exercises_count, active_status } = lab;
  const labId = course_id || id || "nsa";
  const studentCount = total_students || 60;
  const assignedCount = assigned_exercises_count !== undefined ? assigned_exercises_count : 1;
  const isActive = active_status !== false;

  return (
    <Link
      to={`/faculty/laboratory/${labId}`}
      className="group relative flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-[#164a9c]/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#164a9c]"
    >
      {/* Top Color Bar */}
      <div className="h-1.5 w-full bg-[#164a9c]" />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-slate-100 text-[11.5px] font-bold text-slate-600 border border-slate-200/60 uppercase tracking-wide">
            {code || labId.toUpperCase()}
          </span>
          {isActive && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
          )}
        </div>

        <h3 className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-[#164a9c] transition-colors line-clamp-2 mb-4">
          {name}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Students
              </span>
              <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {studentCount}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Exercises
              </span>
              <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-[#164a9c]/70" />
                {assignedCount}
              </span>
            </div>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#164a9c] transition-colors border border-slate-200 group-hover:border-[#164a9c]">
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
