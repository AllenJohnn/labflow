import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  getStudentProfile,
  updateStudentProfile,
  getStudentAnnouncements,
  getCachedProfile,
  getCachedAnnouncements,
} from "../../services/studentService";

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(() => getCachedProfile());
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [githubUsername, setGithubUsername] = useState(() => profile?.github_username || "allenjohn");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [prof, ann] = await Promise.all([
          getStudentProfile(),
          getStudentAnnouncements(),
        ]);
        setProfile(prof);
        setAnnouncements(ann);
        setGithubUsername(prof?.github_username || "allenjohn");
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    loadData();
  }, []);

  const currentGithub = profile?.github_username || "";
  const hasChanged = githubUsername.trim() !== currentGithub;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hasChanged) {
      toast.info("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      const cleanValue = githubUsername.trim();
      const updated = await updateStudentProfile({ github_username: cleanValue });
      if (updated) {
        setProfile(updated);
        setGithubUsername(updated.github_username || cleanValue);
        toast.success("GitHub profile updated successfully.");
      } else {
        toast.error("Unable to update GitHub profile. Please try again.");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Unable to update GitHub profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const name = profile?.name || user?.name || "Allen John";
  const email = profile?.email || user?.email || "allenjohnjoy2004@gmail.com";
  const studentId = profile?.student_id || "FIT25MCA-2008";
  const department = profile?.department || "MCA";
  const semester = profile?.semester ? `S${profile.semester}` : "S2";

  return (
    <StudentLayout profile={profile} announcements={announcements}>
      <div className="mx-auto max-w-[850px] space-y-5">
        {/* Profile Header */}
        <div className="border-b border-slate-200/70 pb-3.5">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            Profile
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Manage your LabFlow profile
          </p>
        </div>

        {/* Personal Information */}
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

        {/* Academic Information */}
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

        {/* Developer Profile */}
        <form onSubmit={handleSave} className="border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
          <h2 className="text-[14.5px] font-semibold text-slate-800 tracking-tight border-b border-slate-100 pb-2">
            Developer Profile
          </h2>

          <div>
            <label htmlFor="githubInput" className="block text-[12px] font-medium text-slate-700 mb-1.5">
              GitHub Username / Link
            </label>
            <input
              id="githubInput"
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g. allenjohn"
              className="w-full max-w-[480px] bg-white border border-slate-300 px-3.5 py-2 text-[13px] text-slate-800 transition hover:border-slate-400 focus:border-[#164a9c] focus:outline-none focus:ring-1 focus:ring-[#164a9c]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || !hasChanged}
              className="bg-[#164a9c] border border-[#164a9c] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123b7d] focus:outline-none focus:ring-2 focus:ring-[#164a9c] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </StudentLayout>
  );
}


