"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiUsers,
} from "react-icons/fi";

const FEATURES = [
  {
    icon: FiBookOpen,
    title: "Lessons & calendar",
    text: "Teachers create and update lessons; students see their own schedule and calendar in one place.",
  },
  {
    icon: FiCheckCircle,
    title: "Attendance tracking",
    text: "Present, absent and excused statuses recorded per lesson, with a full history for every student.",
  },
  {
    icon: FiFileText,
    title: "Permission requests",
    text: "Students ask for permission in a click; teachers approve or deny and attendance updates itself.",
  },
  {
    icon: FiBarChart2,
    title: "Marks & feedback",
    text: "Teachers record grades with written feedback; students follow their own progress by subject.",
  },
  {
    icon: FiBell,
    title: "Notifications",
    text: "Everyone gets notified about permission decisions, new marks and lesson updates in real time.",
  },
  {
    icon: FiUsers,
    title: "Two clear roles",
    text: "Students only ever see their own data. Teachers act as admins with full create, edit and delete rights.",
  },
];

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      router.replace(profile.role === "teacher" ? "/teacher" : "/student");
    }
  }, [loading, user, profile, router]);

  if (loading || (user && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="site-page">
      <header className="site-header">
        <div className="site-header-inner">
          <a href="/" className="site-brand">
            <span className="site-brand-mark">SM</span>
            <span className="site-brand-name">Students Management</span>
          </a>
          <nav className="site-nav" aria-label="Main">
            <a href="#features">Features</a>
            <a href="#roles">Solutions</a>
            <a href="/login?role=teacher">Admin sign in</a>
            <Link href="/login" className="site-nav-btn">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="site-hero">
          <p className="site-hero-kicker">Whole-school learning platform</p>
          <h1>All-in-one management for students and teachers</h1>
          <p className="site-hero-lead">
            Lessons, attendance, permission requests, marks and notifications
            flow together effortlessly — so your school day stays organised.
          </p>
          <div className="site-hero-actions">
            <Link href="/register" className="btn-primary">
              Get started
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </section>

        <section className="site-features" id="features">
          <div className="site-section-head">
            <h2>Everything your school needs</h2>
            <p>One simple solution for teaching, learning and administration.</p>
          </div>
          <div className="site-grid">
            {FEATURES.map((f) => (
              <article className="site-card" key={f.title}>
                <span className="site-card-icon">
                  <f.icon size={20} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-roles" id="roles">
          <div className="site-section-head">
            <h2>Built for both sides of the classroom</h2>
            <p>One platform, two experiences — each focused on what matters.</p>
          </div>
          <div className="site-roles-grid">
            <article className="site-role-card">
              <span className="site-role-tag">For students</span>
              <h3>Your learning at a glance</h3>
              <ul>
                <li><FiCheckCircle size={16} /> View notifications the moment they arrive</li>
                <li><FiCheckCircle size={16} /> Follow lessons on the calendar</li>
                <li><FiCheckCircle size={16} /> Ask for permission online</li>
                <li><FiCheckCircle size={16} /> See your own marks and attendance only</li>
              </ul>
              <Link href="/register" className="site-role-link">
                Create a student account <FiArrowRight size={15} />
              </Link>
            </article>
            <article className="site-role-card site-role-card-alt">
              <span className="site-role-tag">For teachers · Admin</span>
              <h3>Full control of your classes</h3>
              <ul>
                <li><FiCheckCircle size={16} /> Create, edit and delete lessons</li>
                <li><FiCheckCircle size={16} /> Mark attendance and review permissions</li>
                <li><FiCheckCircle size={16} /> Record marks with written feedback</li>
                <li><FiCheckCircle size={16} /> Track every student&rsquo;s progress</li>
              </ul>
              <Link href="/login?role=teacher" className="site-role-link">
                Admin sign in <FiArrowRight size={15} />
              </Link>
            </article>
          </div>
        </section>

        <section className="site-cta">
          <h2>Ready to see it in action?</h2>
          <p>Bring curriculum, attendance and communication together in one place.</p>
          <div className="site-hero-actions">
            <Link href="/register" className="btn-primary">
              Get started
            </Link>
            <Link href="/login?role=teacher" className="btn-secondary">
              Admin sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <span className="site-brand-mark">SM</span>
            <span className="site-brand-name">Students Management</span>
            <p>A smarter way to run your school.</p>
          </div>
          <div className="site-footer-col">
            <h4>Platform</h4>
            <a href="#features">Features</a>
            <a href="#roles">For students</a>
            <a href="#roles">For teachers</a>
          </div>
          <div className="site-footer-col">
            <h4>Accounts</h4>
            <Link href="/login">Student sign in</Link>
            <Link href="/register">Create student account</Link>
            <Link href="/login?role=teacher">Admin sign in</Link>
          </div>
        </div>
        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} Students Management. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
