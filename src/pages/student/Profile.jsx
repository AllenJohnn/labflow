import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  getStudentProfile,
  getStudentAnnouncements,
  getCachedProfile,
  getCachedAnnouncements,
} from "../../services/studentService";
import GithubIntegrationCard from "../../components/student/GithubIntegrationCard";

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(() => getCachedProfile());
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);

  useEffect(() => {
    async function loadData() {
      try {
        const [prof, ann] = await Promise.all([
          getStudentProfile(),
          getStudentAnnouncements(),
        ]);
        setProfile(prof);
        setAnnouncements(ann);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    loadData();
  }, []);

  const name = profile?.name || user?.name || "Allen John";
  const email = profile?.email || user?.email || "allenjohnjoy2004@gmail.com";
  const studentId = profile?.student_id || "FIT25MCA-2008";
  const department = profile?.department || "MCA";
  const semester = profile?.semester ? `S${profile.semester}` : "S2";

  return (
    <StudentLayout profile={profile} announcements={announcements}>
      <div className="mx-auto max-w-[850px] space-y-5">
        <div className="border-b border-slate-200/70 pb-3.5">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            Profile
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Manage your LabFlow profile
          </p>
        </div>

        <div className="border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
          <h2 className="text-[14.5px] font-semibold text-slate-800 tracking-tight border-b border-slate-100 pb-2">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Full Name
              </div>
              <div className="mt-1 text-[14px] font-medium text-slate-800">
                {name}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Email
              </div>
              <div className="mt-1 text-[14px] font-medium text-slate-800">
                {email}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
          <h2 className="text-[14.5px] font-semibold text-slate-800 tracking-tight border-b border-slate-100 pb-2">
            Academic Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Roll Number
              </div>
              <div className="mt-1 text-[14px] font-medium text-slate-800">
                {studentId}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Course
              </div>
              <div className="mt-1 text-[14px] font-medium text-slate-800">
                {department}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Semester
              </div>
              <div className="mt-1 text-[14px] font-medium text-slate-800">
                {semester}
              </div>
            </div>
          </div>
        </div>

        <GithubIntegrationCard />
      </div>
    </StudentLayout>
  );
}
