import { useState, useEffect } from "react";
import {
  getFacultyProfile,
  getFacultyLaboratories,
  getCachedFacultyLabs,
  getCachedFacultyProfile,
} from "../../services/facultyService";
import { getStudentAnnouncements, getCachedAnnouncements } from "../../services/studentService";
import FacultyLayout from "../../components/layout/FacultyLayout";
import FacultyLaboratoryCard from "../../components/dashboard/FacultyLaboratoryCard";

export default function FacultyLaboratories() {
  const [profile, setProfile] = useState(() => getCachedFacultyProfile());
  const [laboratories, setLaboratories] = useState(() => getCachedFacultyLabs() || []);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);
  const [loading, setLoading] = useState(() => !getCachedFacultyLabs());

  useEffect(() => {
    async function loadLabs() {
      try {
        const [profData, labsData, annData] = await Promise.all([
          getFacultyProfile(),
          getFacultyLaboratories(),
          getStudentAnnouncements(),
        ]);
        setProfile(profData);
        setLaboratories(labsData);
        setAnnouncements(annData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading faculty laboratories:", err);
        setLoading(false);
      }
    }
    loadLabs();
  }, []);

  return (
    <FacultyLayout profile={profile} announcements={announcements}>
      <div className="space-y-6">
        <div className="border-b border-slate-200/70 pb-4">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            My Laboratories
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Manage lab curriculum, assign exercises, and track student submissions.
          </p>
        </div>

        {loading && laboratories.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-48 border border-slate-200/80 bg-slate-50/60 p-6 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {laboratories.map((lab) => (
              <FacultyLaboratoryCard key={lab.id || lab.course_id} lab={lab} />
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
