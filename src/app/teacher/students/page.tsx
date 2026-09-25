"use client";

import { useEffect, useState } from "react";
import {
  getAllStudents,
  getAttendanceForStudent,
  getMarksForStudent,
} from "@/lib/firestore";
import type { UserProfile } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

interface StudentSummary {
  profile: UserProfile;
  attendancePct: number | null;
  avgScorePct: number | null;
}

export default function TeacherStudentsPage() {
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const students = await getAllStudents();
      const withStats = await Promise.all(
        students.map(async (s) => {
          const [attendance, marks] = await Promise.all([
            getAttendanceForStudent(s.uid),
            getMarksForStudent(s.uid),
          ]);
          const attendancePct =
            attendance.length > 0
              ? Math.round(
                  (attendance.filter((a) => a.status === "present").length / attendance.length) * 100
                )
              : null;
          const avgScorePct =
            marks.length > 0
              ? Math.round(
                  (marks.reduce((sum, m) => sum + m.score / m.maxScore, 0) / marks.length) * 100
                )
              : null;
          return { profile: s, attendancePct, avgScorePct };
        })
      );
      setSummaries(withStats);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Students</h1>
        <p className="mt-1 text-sm text-ink/60">All registered students and their overall standing.</p>
      </div>

      <div className="card overflow-x-auto">
        {summaries.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/50">No students have registered yet.</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Attendance</th>
                <th className="pb-3 font-medium">Avg. score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summaries.map(({ profile, attendancePct, avgScorePct }) => (
                <tr key={profile.uid}>
                  <td className="py-3 font-medium text-ink">{profile.fullName}</td>
                  <td className="py-3 text-ink/60">{profile.email}</td>
                  <td className="py-3 text-ink/60">
                    {attendancePct !== null ? `${attendancePct}%` : "—"}
                  </td>
                  <td className="py-3 text-ink/60">
                    {avgScorePct !== null ? `${avgScorePct}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
