"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPermissionRequestsForTeacher, decidePermissionRequest } from "@/lib/firestore";
import type { PermissionRequest } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";

export default function TeacherPermissionsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    const r = await getPermissionRequestsForTeacher(profile.uid);
    setRequests(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDecision = async (req: PermissionRequest, decision: "approved" | "denied") => {
    setDecidingId(req.id);
    try {
      await decidePermissionRequest(req, decision);
      await load();
    } finally {
      setDecidingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Permission requests</h1>
        <p className="mt-1 text-sm text-ink/60">
          Approving marks attendance as excused; denying marks it absent.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-display text-base font-semibold">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/50">Nothing pending review.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{r.studentName}</p>
                  <p className="text-sm text-ink/70">{r.lessonTitle} · {r.date}</p>
                  <p className="text-sm text-ink/50">{r.reason}</p>
                  {r.details && <p className="text-xs text-ink/40">{r.details}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(r, "approved")}
                    disabled={decidingId === r.id}
                    className="btn-primary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(r, "denied")}
                    disabled={decidingId === r.id}
                    className="btn-secondary text-status-absent"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 font-display text-base font-semibold">Decided</h2>
        {decided.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/50">No decisions made yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {decided.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{r.studentName}</p>
                  <p className="text-xs text-ink/50">{r.lessonTitle} · {r.date}</p>
                </div>
                <StatusBadge status={r.status as "approved" | "denied"} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
