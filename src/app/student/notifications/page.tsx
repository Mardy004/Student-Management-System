"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { getNotificationsForUser, markNotificationRead } from "@/lib/firestore";
import type { AppNotification } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function StudentNotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getNotificationsForUser(profile.uid).then((n) => {
      setNotifications(n);
      setLoading(false);
    });
  }, [profile]);

  const handleRead = async (n: AppNotification) => {
    if (n.read) return;
    await markNotificationRead(n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
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
        <h1 className="font-display text-2xl font-bold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-ink/60">Updates on your permissions, marks, and lessons.</p>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/50">No notifications yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleRead(n)}
                  className={clsx(
                    "flex w-full items-start gap-3 py-3.5 text-left first:pt-0 last:pb-0"
                  )}
                >
                  <span
                    className={clsx(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-primary"
                    )}
                  />
                  <div className="min-w-0">
                    <p className={clsx("text-sm", n.read ? "font-normal text-ink/70" : "font-semibold text-ink")}>
                      {n.title}
                    </p>
                    <p className="text-sm text-ink/50">{n.message}</p>
                    <p className="mt-0.5 text-xs text-ink/40">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
