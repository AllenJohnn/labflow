import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentProfile,
  getStudentLaboratories,
  getStudentAnnouncements,
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
  const [loading, setLoading] = useState(() => !getCachedLaboratories());

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [profData, labsData, annData] = await Promise.all([
          getStudentProfile(),
          getStudentLaboratories(),
          getStudentAnnouncements(),
        ]);
        if (isMounted) {
          setProfile(profData);
          setLaboratories(labsData);
          setAnnouncements(annData);
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
  const academicProgram = "MCA S2 · Computer Applications";

  return (
    <StudentLayout profile={profile} announcements={announcements}>
      <div className="space-y-6">
        {/* Compact Dashboard Greeting Header */}
        <div className="border-b border-slate-200/70 pb-4">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            {getGreetingText(studentFullName)}
          </h1>
          <p className="mt-1 text-[13px] font-semibold text-[#159447] tracking-wide">
            {academicProgram}
          </p>
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

