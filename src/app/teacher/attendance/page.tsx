"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getLessonsForTeacher,
  getAllStudents,
  getAttendanceForLesson,
  upsertAttendance,
} from "@/lib/firestore";
import type { Lesson, UserProfile, AttendanceStatus, AttendanceRecord } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import clsx from "clsx";

const OPTIONS: AttendanceStatus[] = ["present", "absent", "excused"];

export default function TeacherAttendancePage() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    Promise.all([getLessonsForTeacher(profile.uid), getAllStudents()]).then(([l, s]) => {
      setLessons(l);
      setStudents(s);
      setLoading(false);
    });
  }, [profile]);

  useEffect(() => {
    if (!lessonId) return;
    getAttendanceForLesson(lessonId).then((records: AttendanceRecord[]) => {
      const map: Record<string, AttendanceStatus> = {};
      records.forEach((r) => {
        map[r.studentId] = r.status;
      });
      setStatuses(map);
    });
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const lesson = lessons.find((l) => l.id === lessonId);
  const roster = lesson
    ? lesson.studentIds.length > 0
      ? students.filter((s) => lesson.studentIds.includes(s.uid))
      : students
    : [];

  const setStatus = async (student: UserProfile, status: AttendanceStatus) => {
    if (!lesson || !profile) return;
    setSaving(student.uid);
    setStatuses((prev) => ({ ...prev, [student.uid]: status }));
    try {
      await upsertAttendance({
        studentId: student.uid,
        studentName: student.fullName,
        teacherId: profile.uid,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        date: lesson.date,
        status,
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Mark attendance</h1>
        <p className="mt-1 text-sm text-ink/60">Pick a lesson, then set each student's status.</p>
      </div>

      <div className="card">
        <label className="label" htmlFor="lesson">Lesson</label>
        <select
          id="lesson"
          className="input"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
        >
          <option value="">Select a lesson</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} — {l.date}
            </option>
          ))}
        </select>
      </div>
      {lesson && (
        <div className="card">
          {roster.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/50">No students assigned to this lesson.</p>
          ) : (
            <>
            <p className="text-sm text-ink/60">Changes are auto-saved.</p>
            <ul className="flex flex-col divide-y divide-border">
              {roster.map((s) => (
                <li key={s.uid} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-ink">{s.fullName}</span>
                  <div className="flex gap-1.5">
                    {OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setStatus(s, opt)}
                        disabled={saving === s.uid}
                        className={clsx(
                          "rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors",
                          statuses[s.uid] === opt
                            ? "border-primary bg-primary text-white"
                            : "border-border text-ink/60 hover:bg-surface"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
