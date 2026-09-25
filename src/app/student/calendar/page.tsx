"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import clsx from "clsx";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { getLessonsForStudent, getPermissionRequestsForStudent } from "@/lib/firestore";
import type { Lesson, PermissionRequest } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";

export default function StudentCalendarPage() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getLessonsForStudent(profile.uid),
      getPermissionRequestsForStudent(profile.uid),
    ]).then(([l, r]) => {
      setLessons(l);
      setRequests(r);
      setLoading(false);
    });
  }, [profile]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    lessons.forEach((l) => {
      map.set(l.date, [...(map.get(l.date) ?? []), l]);
    });
    return map;
  }, [lessons]);

  const requestsByDate = useMemo(() => {
    const map = new Map<string, PermissionRequest[]>();
    requests.forEach((r) => {
      map.set(r.date, [...(map.get(r.date) ?? []), r]);
    });
    return map;
  }, [requests]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedLessons = lessonsByDate.get(selectedDate) ?? [];
  const selectedRequests = requestsByDate.get(selectedDate) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Calendar</h1>
          <p className="mt-1 text-sm text-ink/60">Lessons and permission-related events.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary px-3 py-2"
            aria-label="Previous month"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <FiChevronLeft size={16} />
          </button>
          <span className="w-32 text-center font-display text-sm font-semibold">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            className="btn-secondary px-3 py-2"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-ink/40">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayLessons = lessonsByDate.get(dateStr) ?? [];
            const dayRequests = requestsByDate.get(dateStr) ?? [];
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={clsx(
                  "flex h-20 flex-col items-start rounded-lg border p-1.5 text-left transition-colors",
                  selectedDate === dateStr ? "border-primary bg-primary-light" : "border-transparent hover:bg-surface",
                  !inMonth && "opacity-30"
                )}
              >
                <span
                  className={clsx(
                    "text-xs font-semibold",
                    isToday(day) ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white" : "text-ink/70"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayLessons.slice(0, 3).map((l) => (
                    <span key={l.id} className="h-1.5 w-1.5 rounded-full bg-primary" title={l.title} />
                  ))}
                  {dayRequests.slice(0, 2).map((r) => (
                    <span key={r.id} className="h-1.5 w-1.5 rounded-full bg-status-pending" title="Permission request" />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-base font-semibold">{format(new Date(selectedDate), "EEEE, MMMM d")}</h2>
        <div className="mt-4 flex flex-col gap-3">
          {selectedLessons.length === 0 && selectedRequests.length === 0 && (
            <p className="text-sm text-ink/50">Nothing scheduled on this day.</p>
          )}
          {selectedLessons.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink">{l.title}</p>
                <p className="text-xs text-ink/50">{l.startTime}–{l.endTime} · {l.location}</p>
              </div>
              <span className="text-xs font-medium text-primary">Lesson</span>
            </div>
          ))}
          {selectedRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink">Permission request — {r.lessonTitle}</p>
                <p className="text-xs text-ink/50">{r.reason}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
