"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import type { Role } from "@/types";

/**
 * Public registration page. Only students can sign up here — the teacher
 * (admin) registration form lives at /register/teacher and is intentionally
 * not linked anywhere in the public UI.
 */
export default function RegisterPage() {
  const router = useRouter();
  const role: Role = "student";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await createUserProfile({
        uid: cred.user.uid,
        role,
        fullName,
        email,
        createdAt: new Date().toISOString(),
      });
      router.replace("/student");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUserProfile(cred.user.uid);
      if (!existing) {
        await createUserProfile({
          uid: cred.user.uid,
          role,
          fullName: cred.user.displayName ?? "New user",
          email: cred.user.email ?? "",
          photoURL: cred.user.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
      const profile = existing ?? (await getUserProfile(cred.user.uid));
      router.replace(profile?.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-10 font-body">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            SM
          </div>
          <span className="font-display text-lg font-semibold text-ink">Students Management</span>
        </Link>

        <div className="card">
          <h1 className="font-display text-xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink/60">Register as a student to get started.</p>

          {error && (
            <p className="mt-4 rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">
              {error}
            </p>
          )}

          <form onSubmit={handleRegister} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                required
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Creating account…" : `Create ${role} account`}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink/40">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button onClick={handleGoogleRegister} disabled={busy} className="btn-secondary w-full">
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-ink/60">
          Teacher or admin?{" "}
          <Link href="/login?role=teacher" className="font-semibold text-primary">
            Admin sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("email-already-in-use")) return "An account with this email already exists.";
  if (code.includes("weak-password")) return "Please choose a stronger password.";
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  return "Something went wrong creating your account. Please try again.";
}
