"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";

export interface LessonFormValues {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  link: string;
  resources: string;
  studentIds: string[];
}

export default function LessonForm({
  initialValues,
  students,
  submitLabel,
  onSubmit,
}: {
  initialValues: LessonFormValues;
  students: UserProfile[];
  submitLabel: string;
  onSubmit: (values: LessonFormValues) => Promise<void>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<LessonFormValues>(initialValues);
  const [busy, setBusy] = useState(false);
  const [audience, setAudience] = useState<"all" | "specific">(
    initialValues.studentIds.length > 0 ? "specific" : "all"
  );

  const set = <K extends keyof LessonFormValues>(key: K, value: LessonFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggleStudent = (uid: string) => {
    set(
      "studentIds",
      values.studentIds.includes(uid)
        ? values.studentIds.filter((id) => id !== uid)
        : [...values.studentIds, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        ...values,
        studentIds: audience === "all" ? [] : values.studentIds,
      });
      router.push("/teacher/lessons");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input
          id="title"
          required
          className="input"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          className="input"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            required
            className="input"
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="startTime">Start time</label>
          <input
            id="startTime"
            type="time"
            required
            className="input"
            value={values.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="endTime">End time</label>
          <input
            id="endTime"
            type="time"
            required
            className="input"
            value={values.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="location">Location</label>
        <input
          id="location"
          className="input"
          placeholder="Room 204, or a video call link's venue"
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="link">Lesson link (optional)</label>
        <input
          id="link"
          type="url"
          className="input"
          placeholder="https://…"
          value={values.link}
          onChange={(e) => set("link", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="resources">Additional resources (optional)</label>
        <textarea
          id="resources"
          rows={2}
          className="input"
          placeholder="One resource per line"
          value={values.resources}
          onChange={(e) => set("resources", e.target.value)}
        />
      </div>

      <div>
        <span className="label">Who is this lesson for?</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAudience("all")}
            className={`btn-secondary ${audience === "all" ? "border-primary text-primary" : ""}`}
          >
            All students
          </button>
          <button
            type="button"
            onClick={() => setAudience("specific")}
            className={`btn-secondary ${audience === "specific" ? "border-primary text-primary" : ""}`}
          >
            Specific students
          </button>
        </div>
        {audience === "specific" && (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-border p-2">
            {students.length === 0 ? (
              <p className="p-2 text-sm text-ink/50">No students have registered yet.</p>
            ) : (
              students.map((s) => (
                <label key={s.uid} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={values.studentIds.includes(s.uid)}
                    onChange={() => toggleStudent(s.uid)}
                  />
                  {s.fullName}
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <button type="submit" disabled={busy} className="btn-primary self-start">
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
