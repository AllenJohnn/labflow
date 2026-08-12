import { useState, useEffect } from "react";
import StudentLayout from "../../components/layout/StudentLayout";
import LaboratoryCard from "../../components/dashboard/LaboratoryCard";
import {
  getStudentLaboratories,
  getStudentAnnouncements,
  getCachedLaboratories,
  getCachedAnnouncements,
} from "../../services/studentService";

export default function StudentLaboratories() {
  const [labs, setLabs] = useState(() => getCachedLaboratories() || []);
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements() || []);

  useEffect(() => {
    async function loadData() {
      try {
        const [l, a] = await Promise.all([
          getStudentLaboratories(),
          getStudentAnnouncements(),
        ]);
        setLabs(l);
        setAnnouncements(a);
      } catch (err) {
        console.error("Error loading laboratories:", err);
      }
    }
    loadData();
  }, []);

  return (
    <StudentLayout announcements={announcements}>
      <div className="space-y-6">
        <div className="border-b border-slate-200/70 pb-4">
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">
            My Laboratories
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Enrolled laboratory subjects for the current academic semester.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {labs.map((lab) => (
            <LaboratoryCard key={lab.id} lab={lab} />
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}

