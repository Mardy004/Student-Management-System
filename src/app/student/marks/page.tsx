"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMarksForStudent } from "@/lib/firestore";
import type { Mark } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function StudentMarksPage() {
  const { profile } = useAuth();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getMarksForStudent(profile.uid).then((m) => {
      setMarks(m);
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

  const bySubject = marks.reduce<Record<string, Mark[]>>((acc, m) => {
    acc[m.subject] = acc[m.subject] ? [...acc[m.subject], m] : [m];
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Marks & performance</h1>
        <p className="mt-1 text-sm text-ink/60">
          Grades and feedback your teachers have recorded for you.
        </p>
      </div>

      {marks.length === 0 ? (
        <div className="card">
          <p className="py-8 text-center text-sm text-ink/50">No marks recorded yet.</p>
        </div>
      ) : (
        Object.entries(bySubject).map(([subject, subjectMarks]) => {
          const avg =
            subjectMarks.reduce((sum, m) => sum + m.score / m.maxScore, 0) /
            subjectMarks.length *
            100;
          return (
            <div key={subject} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">{subject}</h2>
                <span className="text-sm font-semibold text-primary">{Math.round(avg)}% avg</span>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {subjectMarks.map((m) => (
                  <li key={m.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{m.title}</p>
                      <p className="text-sm font-semibold text-ink">
                        {m.score}/{m.maxScore}
                      </p>
                    </div>
                    {m.feedback && <p className="text-sm text-ink/60">{m.feedback}</p>}
                    <p className="text-xs text-ink/40">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
