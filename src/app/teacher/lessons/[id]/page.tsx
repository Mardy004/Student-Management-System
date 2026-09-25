"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLesson, updateLesson, getAllStudents, createNotification } from "@/lib/firestore";
import type { Lesson, UserProfile } from "@/types";
import LessonForm, { LessonFormValues } from "@/components/LessonForm";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function EditLessonPage() {
  const params = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLesson(params.id), getAllStudents()]).then(([l, s]) => {
      setLesson(l);
      setStudents(s);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!lesson) {
    return <p className="text-sm text-ink/60">Lesson not found.</p>;
  }

  const initialValues: LessonFormValues = {
    title: lesson.title,
    description: lesson.description,
    date: lesson.date,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    location: lesson.location,
    link: lesson.link ?? "",
    resources: lesson.resources ?? "",
    studentIds: lesson.studentIds,
  };

  const handleSubmit = async (values: LessonFormValues) => {
    await updateLesson(lesson.id, {
      title: values.title,
      description: values.description,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      location: values.location,
      link: values.link || undefined,
      resources: values.resources || undefined,
      studentIds: values.studentIds,
    });

    const recipients = values.studentIds.length > 0 ? values.studentIds : students.map((s) => s.uid);
    await Promise.all(
      recipients.map((uid) =>
        createNotification({
          userId: uid,
          type: "lesson_updated",
          title: "Lesson updated",
          message: `${values.title} on ${values.date} was updated.`,
          relatedId: lesson.id,
        })
      )
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Edit lesson</h1>
        <p className="mt-1 text-sm text-ink/60">Update details — students will be notified.</p>
      </div>
      <LessonForm
        initialValues={initialValues}
        students={students}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
