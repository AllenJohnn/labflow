import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  FolderOpen,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  MapPin,
  AlertCircle
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
  getAllAssignedExercises,
  getStudentRecentActivity
} from "../../services/studentService";
import StudentLayout from "../../components/layout/StudentLayout";
import LaboratoryCard from "../../components/dashboard/LaboratoryCard";

export default function Dashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => getCachedProfile());
  const [laboratories, setLaboratories] = useState(() => getCachedLaboratories() || []);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(() => !getCachedLaboratories());

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [profData, labsData, annData, atndData, , activityData] = await Promise.all([
          getStudentProfile(),
          getStudentLaboratories(),
          getStudentAnnouncements(),
          getStudentAttendance(),
          getAllAssignedExercises().catch(() => []),
          getStudentRecentActivity().catch(() => [])
        ]);
        if (isMounted) {
          setProfile(profData);
          setLaboratories(labsData);
          setAnnouncements(annData);
          setAttendanceSummary(atndData);
          setRecentActivity((activityData || []).slice(0, 3));
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

  const upcomingLab = attendanceSummary?.upcoming_classes?.[0];

  return (
    <StudentLayout profile={profile} announcements={announcements}>
      <div className="space-y-8">
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
            <span>Attendance: <strong className="text-slate-900">{attendanceSummary ? `${attendanceSummary.overall_percentage}%` : "--%"}</strong></span>
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

        {/* What's Next Section */}
        <section className="space-y-3.5 pt-2">
          <div>
            <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight">
              What's Next
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Upcoming classes and recent activity
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Upcoming Laboratory */}
            <div className="border border-slate-200/80 border-t-2 border-t-[#164a9c] bg-white p-5 shadow-2xs">
              <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-slate-700 uppercase tracking-wide">
                <Clock className="h-4 w-4 text-[#164a9c]" />
                Upcoming Laboratory
              </h3>
              
              {upcomingLab ? (
                <div className="space-y-4">
                  <div>
                    <span className="inline-block bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 uppercase border border-slate-200 mb-2">
                      {upcomingLab.day_label || upcomingLab.day}
                    </span>
                    <h4 className="text-[15px] font-semibold text-slate-800 leading-snug">
                      {upcomingLab.name}
                    </h4>
                  </div>
                  
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-[13px] text-slate-600">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{upcomingLab.start_time} - {upcomingLab.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{upcomingLab.location}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-[13px] font-medium text-slate-500">No upcoming classes</p>
                  <p className="text-[12px] text-slate-400">You're all caught up for now.</p>
                </div>
              )}
            </div>

            {/* Right: Recent Activity */}
            <div className="border border-slate-200/80 border-t-2 border-t-[#159447] bg-white p-5 shadow-2xs">
              <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-slate-700 uppercase tracking-wide">
                <Activity className="h-4 w-4 text-[#159447]" />
                Recent Activity
              </h3>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded bg-slate-50 border border-slate-100">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-[#164a9c] uppercase tracking-wider">
                            {activity.subjectCode || "LAB"}
                          </div>
                          <p className="mt-0.5 text-[13px] font-medium text-slate-700 line-clamp-1">
                            {activity.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] font-medium">
                            <span className={`px-1.5 py-0.5 rounded-sm ${
                              activity.status?.toLowerCase() === 'evaluated' ? 'bg-green-50 text-green-700' :
                              activity.status?.toLowerCase() === 'submitted' ? 'bg-blue-50 text-blue-700' :
                              activity.status?.toLowerCase() === 'reviewed' ? 'bg-indigo-50 text-indigo-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {activity.status}
                            </span>
                            {activity.status?.toLowerCase() === 'evaluated' && activity.marks && (
                              <span className="text-slate-500">• {activity.marks}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-[13px] font-medium text-slate-500">No recent activity</p>
                  <p className="text-[12px] text-slate-400">Your recent submissions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}
