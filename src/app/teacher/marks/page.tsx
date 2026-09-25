"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllStudents, getMarksGivenByTeacher, addMark, deleteMark } from "@/lib/firestore";
import type { UserProfile, Mark } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TeacherMarksPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [feedback, setFeedback] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    const [s, m] = await Promise.all([getAllStudents(), getMarksGivenByTeacher(profile.uid)]);
    setStudents(s);
    setMarks(m);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !studentId) return;
    const student = students.find((s) => s.uid === studentId);
    if (!student) return;
    setSubmitting(true);
    try {
      await addMark({
        studentId: student.uid,
        studentName: student.fullName,
        teacherId: profile.uid,
        subject,
        title,
        score: Number(score),
        maxScore: Number(maxScore),
        feedback: feedback || undefined,
      });
      setSubject("");
      setTitle("");
      setScore("");
      setFeedback("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMark(id);
      setMarks((prev) => prev.filter((m) => m.id !== id));
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
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Marks & feedback</h1>
        <p className="mt-1 text-sm text-ink/60">Record a grade or performance note for a student.</p>
      </div>

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="student">Student</label>
          <select
            id="student"
            required
            className="input"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="" disabled>Select a student</option>
            {students.map((s) => (
              <option key={s.uid} value={s.uid}>{s.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="subject">Subject</label>
          <input id="subject" required className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="title">Assessment title</label>
          <input id="title" required className="input" placeholder="e.g. Midterm exam" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="score">Score</label>
          <input id="score" type="number" required min={0} className="input" value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="maxScore">Out of</label>
          <input id="maxScore" type="number" required min={1} className="input" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="feedback">Feedback (optional)</label>
          <textarea id="feedback" rows={3} className="input" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary self-start sm:col-span-2">
          {submitting ? "Saving…" : "Add mark"}
        </button>
      </form>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-display text-base font-semibold">Recently added</h2>
        {marks.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/50">You haven't added any marks yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Assessment</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {marks.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 font-medium text-ink">{m.studentName}</td>
                  <td className="py-3 text-ink/60">{m.subject}</td>
                  <td className="py-3 text-ink/60">{m.title}</td>
                  <td className="py-3 font-semibold text-ink">{m.score}/{m.maxScore}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="btn-secondary px-3 py-1.5 text-xs text-status-absent"
                    >
                      {deletingId === m.id ? "Removing…" : "Delete"}
                    </button>
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
