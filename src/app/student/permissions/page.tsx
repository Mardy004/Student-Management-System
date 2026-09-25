"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getLessonsForStudent,
  getPermissionRequestsForStudent,
  createPermissionRequest,
} from "@/lib/firestore";
import type { Lesson, PermissionRequest } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";

export default function StudentPermissionsPage() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [lessonId, setLessonId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const load = async () => {
    if (!profile) return;
    const [l, r] = await Promise.all([
      getLessonsForStudent(profile.uid),
      getPermissionRequestsForStudent(profile.uid),
    ]);
    setLessons(l);
    setRequests(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !lessonId) return;
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    setSubmitting(true);
    try {
      await createPermissionRequest({
        studentId: profile.uid,
        studentName: profile.fullName,
        teacherId: lesson.teacherId,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        date: lesson.date,
        reason,
        details,
      });
      setLessonId("");
      setReason("");
      setDetails("");
      setShowForm(false);
      await load();
    } finally {
      setSubmitting(false);
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
          <h1 className="font-display text-2xl font-bold text-ink">Permission requests</h1>
          <p className="mt-1 text-sm text-ink/60">
            Ask for permission from a lesson, and track your requests here.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "New request"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="lesson">Lesson / class</label>
            <select
              id="lesson"
              required
              className="input"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
            >
              <option value="" disabled>Select a lesson</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} : {l.date}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="reason">Reason</label>
            <input
              id="reason"
              required
              className="input"
              placeholder="e.g. Medical appointment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="details">Additional details (optional)</label>
            <textarea
              id="details"
              className="input"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary self-start">
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}

      <div className="card overflow-x-auto">
        {requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/50">
            You haven't submitted any permission requests yet.
          </p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
                <th className="pb-3 font-medium">Lesson</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Reason</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 font-medium text-ink">{r.lessonTitle}</td>
                  <td className="py-3 text-ink/60">{r.date}</td>
                  <td className="py-3 text-ink/60">{r.reason}</td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
