"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAttendanceForStudent } from "@/lib/firestore";
import type { AttendanceRecord } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";

export default function StudentAttendancePage() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getAttendanceForStudent(profile.uid).then((r) => {
      setRecords(r);
      setLoading(false);
    });
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const excused = records.filter((r) => r.status === "excused").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Attendance</h1>
        <p className="mt-1 text-sm text-ink/60">Your full attendance history, lesson by lesson.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Present" value={present} kind="present" />
        <SummaryCard label="Absent" value={absent} kind="absent" />
        <SummaryCard label="Excused" value={excused} kind="excused" />
      </div>

      <div className="card overflow-x-auto">
        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/50">
            No attendance has been recorded yet.
          </p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
                <th className="pb-3 font-medium">Lesson</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 font-medium text-ink">{r.lessonTitle}</td>
                  <td className="py-3 text-ink/60">{r.date}</td>
                  <td className="py-3">
                    <StatusBadge status={r.status} />
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

const TEXT_COLOR: Record<"present" | "absent" | "excused", string> = {
  present: "text-status-present",
  absent: "text-status-absent",
  excused: "text-status-excused",
};

function SummaryCard({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind: "present" | "absent" | "excused";
}) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-bold ${TEXT_COLOR[kind]}`}>{value}</p>
    </div>
  );
}
