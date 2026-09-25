"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/DashboardShell";
import {
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiGrid,
  FiUsers,
} from "react-icons/fi";

const NAV_ITEMS = [
  { href: "/teacher", label: "Overview", icon: FiGrid },
  { href: "/teacher/lessons", label: "Lessons", icon: FiBookOpen },
  { href: "/teacher/attendance", label: "Attendance", icon: FiCheckCircle },
  { href: "/teacher/permissions", label: "Permissions", icon: FiFileText },
  { href: "/teacher/marks", label: "Marks", icon: FiBarChart2 },
  { href: "/teacher/students", label: "Students", icon: FiUsers },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="teacher">
      <DashboardShell navItems={NAV_ITEMS}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
