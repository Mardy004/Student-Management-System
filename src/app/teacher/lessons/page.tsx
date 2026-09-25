"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getLessonsForTeacher, deleteLesson } from "@/lib/firestore";
import type { Lesson } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TeacherLessonsPage() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    const l = await getLessonsForTeacher(profile.uid);
    setLessons(l);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteLesson(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Lessons</h1>
          <p className="mt-1 text-sm text-ink/60">Create, edit, and remove your lessons.</p>
        </div>
        <Link href="/teacher/lessons/new" className="btn-primary">
          + New lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="card">
          <p className="py-8 text-center text-sm text-ink/50">
            You haven't created any lessons yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lessons.map((l) => (
            <div key={l.id} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-ink">{l.title}</h2>
                <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark">
                  {l.date}
                </span>
              </div>
              <p className="text-sm text-ink/60">{l.description}</p>
              <p className="text-xs text-ink/50">
                {l.startTime}–{l.endTime} · {l.location}
              </p>
              <p className="text-xs text-ink/50">
                {l.studentIds.length === 0
                  ? "Visible to all students"
                  : `Assigned to ${l.studentIds.length} student(s)`}
              </p>
              <div className="mt-2 flex gap-2">
                <Link href={`/teacher/lessons/${l.id}`} className="btn-secondary flex-1 justify-center">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(l.id)}
                  disabled={deletingId === l.id}
                  className="btn-secondary flex-1 justify-center text-status-absent"
                >
                  {deletingId === l.id ? "Removing…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
