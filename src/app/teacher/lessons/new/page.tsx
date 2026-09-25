"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createLesson, getAllStudents, createNotification } from "@/lib/firestore";
import type { UserProfile } from "@/types";
import LessonForm, { LessonFormValues } from "@/components/LessonForm";
import LoadingSpinner from "@/components/LoadingSpinner";

const EMPTY: LessonFormValues = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  link: "",
  resources: "",
  studentIds: [],
};

export default function NewLessonPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStudents().then((s) => {
      setStudents(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleSubmit = async (values: LessonFormValues) => {
    if (!profile) return;
    const lessonId = await createLesson({
      title: values.title,
      description: values.description,
      teacherId: profile.uid,
      teacherName: profile.fullName,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      location: values.location,
      link: values.link || undefined,
      resources: values.resources || undefined,
      studentIds: values.studentIds,
    });

    // Notify the students this lesson is relevant to.
    const recipients = values.studentIds.length > 0 ? values.studentIds : students.map((s) => s.uid);
    await Promise.all(
      recipients.map((uid) =>
        createNotification({
          userId: uid,
          type: "lesson_created",
          title: "New lesson added",
          message: `${values.title} on ${values.date}`,
          relatedId: lessonId,
        })
      )
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">New lesson</h1>
        <p className="mt-1 text-sm text-ink/60">Fill in the details students will see.</p>
      </div>
      <LessonForm initialValues={EMPTY} students={students} submitLabel="Create lesson" onSubmit={handleSubmit} />
    </div>
  );
}
