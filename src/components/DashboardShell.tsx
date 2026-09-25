"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { FiArrowLeft, FiBell, FiLogOut, FiMenu, FiSearch, FiX } from "react-icons/fi";
import type { IconType } from "react-icons";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon?: IconType;
}

/**
 * Logged-in app shell (SchoolGear-inspired layout): sticky top header,
 * left sidebar navigation, content area and a copyright footer.
 * Built entirely with plain CSS classes (.app-*) — no Tailwind.
 */
export default function DashboardShell({
  children,
  navItems,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Close the mobile sidebar whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const initials =
    (profile?.fullName ?? "User")
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // Only show the bell when the role actually has a notifications page.
  const notificationsHref = navItems.find((i) =>
    i.href.includes("notifications")
  )?.href;

  // Header search filters the sidebar navigation.
  const visibleNav = navItems.filter((i) =>
    i.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <button
            type="button"
            className="app-icon-btn app-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          <button
            type="button"
            className="app-icon-btn"
            onClick={() => router.back()}
            aria-label="Go back"
            title="Go back"
          >
            <FiArrowLeft size={18} />
          </button>

          <Link href="/" className="app-brand">
            <span className="app-brand-mark">SM</span>
            <span className="app-brand-name">Students Management</span>
          </Link>

          <div className="app-header-spacer" />

          <label className="app-search">
            <FiSearch size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search menu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search navigation"
            />
          </label>

          {notificationsHref && (
            <Link
              href={notificationsHref}
              className="app-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiBell size={18} />
            </Link>
          )}

          <div className="app-user">
            <span className="app-user-avatar">{initials}</span>
            <span className="app-user-meta">
              <span className="app-user-name">{profile?.fullName}</span>
              <span className="app-user-role">{profile?.role}</span>
            </span>
          </div>

          <button
            type="button"
            className="app-icon-btn"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      <div className="app-body">
        {menuOpen && (
          <div className="app-scrim" onClick={() => setMenuOpen(false)} />
        )}

        <aside
          className={menuOpen ? "app-sidebar open" : "app-sidebar"}
          aria-label="Dashboard navigation"
        >
          <nav className="app-nav">
            <p className="app-nav-section">Menu</p>
            {visibleNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "app-nav-link active" : "app-nav-link"}
                >
                  <span className="app-nav-icon">
                    {Icon ? <Icon size={17} /> : null}
                  </span>
                  {item.label}
                </Link>
              );
            })}
            {visibleNav.length === 0 && (
              <p className="app-nav-empty">No matching menu items</p>
            )}
          </nav>

          <div className="app-sidebar-foot">
            <div className="app-side-user">
              <span className="app-user-avatar">{initials}</span>
              <div className="app-side-user-meta">
                <p className="app-sidebar-user">{profile?.fullName}</p>
                <p className="app-sidebar-role">{profile?.role}</p>
              </div>
            </div>
            <button type="button" className="app-signout-btn" onClick={handleLogout}>
              <FiLogOut size={15} /> Sign out
            </button>
          </div>
        </aside>

        <div className="app-content">
          <main className="app-main">{children}</main>
          <footer className="app-footer">
            <div className="app-footer-inner">
              <span>
                © {new Date().getFullYear()} Students Management. All rights
                reserved.
              </span>
              <span className="app-footer-tag">
                Built for schools · Lessons, attendance &amp; performance
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
