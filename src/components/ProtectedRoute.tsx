"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole: Role;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile && profile.role !== allowedRole) {
      router.replace(profile.role === "teacher" ? "/teacher" : "/student");
    }
  }, [loading, user, profile, allowedRole, router]);

  if (loading || !user || !profile || profile.role !== allowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
