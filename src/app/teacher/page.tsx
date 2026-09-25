"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import {
  getLessonsForTeacher,
  getPermissionRequestsForTeacher,
  getAllStudents,
} from "@/lib/firestore";
import type { Lesson, PermissionRequest, UserProfile } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TeacherOverviewPage() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getLessonsForTeacher(profile.uid),
      getPermissionRequestsForTeacher(profile.uid),
      getAllStudents(),
    ]).then(([l, r, s]) => {
      setLessons(l);
      setRequests(r);
      setStudents(s);
      setLoading(false);
    });
  }, [profile]);

  if (loading) {
    return (
      <div className="dash-loading">
        <LoadingSpinner />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = lessons.filter((l) => l.date >= today).slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dash">
      <section className="dash-hero">
        <div className="dash-hero-text">
          <p className="dash-hero-kicker">{dateLabel}</p>
          <h1>
            {greeting}, {profile?.fullName?.split(" ")[0]}
          </h1>
          <p className="dash-hero-sub">
            Here is what is happening across your classes today.
          </p>
        </div>
        <div className="dash-hero-actions">
          <Link href="/teacher/lessons/new" className="dash-hero-btn">
            New lesson <FiArrowRight size={15} />
          </Link>
          <Link href="/teacher/marks" className="dash-hero-btn ghost">
            Add mark
          </Link>
        </div>
      </section>

      <section className="dash-stats">
        <article className="dash-stat">
          <span className="dash-stat-icon rose"><FiBookOpen size={20} /></span>
          <div>
            <p className="dash-stat-value">{lessons.length}</p>
            <p className="dash-stat-label">Your lessons</p>
          </div>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon violet"><FiUsers size={20} /></span>
          <div>
            <p className="dash-stat-value">{students.length}</p>
            <p className="dash-stat-label">Students</p>
          </div>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon amber"><FiFileText size={20} /></span>
          <div>
            <p className="dash-stat-value">{pending.length}</p>
            <p className="dash-stat-label">Pending requests</p>
          </div>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon emerald"><FiCalendar size={20} /></span>
          <div>
            <p className="dash-stat-value">{upcoming.length}</p>
            <p className="dash-stat-label">Upcoming lessons</p>
          </div>
        </article>
      </section>

      <section className="dash-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2><FiFileText size={17} /> Pending permission requests</h2>
            <Link href="/teacher/permissions" className="dash-link">
              Review all <FiArrowRight size={14} />
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="dash-empty">Nothing here!</p>
          ) : (
            <ul className="dash-list">
              {pending.slice(0, 5).map((r) => (
                <li key={r.id} className="dash-list-item">
                  <span className="dash-list-dot" />
                  <div className="dash-list-body">
                    <p className="dash-list-title">{r.studentName}</p>
                    <p className="dash-list-sub">{r.lessonTitle} · {r.date}</p>
                  </div>
                  <span className="dash-list-chip">Pending</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2><FiCalendar size={17} /> Upcoming lessons</h2>
            <Link href="/teacher/lessons" className="dash-link">
              Manage <FiArrowRight size={14} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="dash-empty">No upcoming lessons scheduled.</p>
          ) : (
            <ul className="dash-list">
              {upcoming.map((l) => (
                <li key={l.id} className="dash-list-item">
                  <span className="dash-list-dot alt" />
                  <div className="dash-list-body">
                    <p className="dash-list-title">{l.title}</p>
                    <p className="dash-list-sub">{l.date} · {l.startTime}:{l.endTime}</p>
                  </div>
                  <span className="dash-list-chip">{l.location || "Lesson"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
