"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Students only have access to notifications, calendar, permissions, their own
 * marks, and their own attendance — so /student itself forwards to the
 * notifications page instead of exposing an overview dashboard.
 */
export default function StudentIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/notifications");
  }, [router]);

  return null;
}