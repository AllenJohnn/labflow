import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import fisatLogo from "../../assets/fisat-logo.jpeg";
import { getStudentProfile } from "../../services/studentService";
import StudentOnboardingModal from "../../components/StudentOnboardingModal";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getStudentProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error loading student profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
    setShowEditModal(false);
  };

  const isProfileIncomplete = profile && !profile.onboarding_completed;

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-700">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={fisatLogo} alt="FISAT" className="h-9 w-auto" />
            <div>
              <h1 className="font-brand text-[18px] font-semibold text-[#164a9c]">LabFlow</h1>
              <p className="text-[11px] text-slate-400">Student Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile?.profile_picture || user?.picture ? (
              <img
                src={profile?.profile_picture || user?.picture}
                alt={profile?.name || user?.name || "Profile"}
                className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="text-right">
              <p className="text-[13px] font-medium text-slate-700">
                {profile?.name || user?.name || "Student"}
              </p>
              <p className="text-[11px] text-slate-400">{profile?.email || user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-800">
                Welcome, {profile?.name || user?.name || "Student"}
              </h2>
              <p className="mt-1 text-[14px] text-slate-500">
                Programming Laboratory Management System — Federal Institute of Science and Technology.
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-[#164a9c] hover:text-[#164a9c] focus:outline-none"
            >
              Edit Profile
            </button>
          </div>

          {/* Student Academic Details Grid */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">
              Academic Information
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Register / Roll No</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.student_id || "Not set"}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Department</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.department ? `${profile.department}` : "Not set"}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Semester</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.semester ? `Semester ${profile.semester}` : "Not set"}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">GitHub Handle</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.github_username ? (
                    <a
                      href={`https://github.com/${profile.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#164a9c] hover:underline"
                    >
                      @{profile.github_username}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not connected</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Modal for First Time Login */}
      {isProfileIncomplete && (
        <StudentOnboardingModal
          currentProfile={profile}
          onProfileSaved={handleProfileSaved}
        />
      )}

      {/* Manual Edit Profile Modal */}
      {showEditModal && (
        <StudentOnboardingModal
          currentProfile={profile}
          onProfileSaved={handleProfileSaved}
          isEditable={true}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
