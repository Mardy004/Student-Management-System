"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/DashboardShell";
import {
  FiBarChart2,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
} from "react-icons/fi";

const NAV_ITEMS = [
  { href: "/student/notifications", label: "Notifications", icon: FiBell },
  { href: "/student/calendar", label: "Calendar", icon: FiCalendar },
  { href: "/student/permissions", label: "Permissions", icon: FiFileText },
  { href: "/student/marks", label: "Marks", icon: FiBarChart2 },
  { href: "/student/attendance", label: "Attendance", icon: FiCheckCircle },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="student">
      <DashboardShell navItems={NAV_ITEMS}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
