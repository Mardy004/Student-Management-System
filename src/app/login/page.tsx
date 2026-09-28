"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserProfile, createUserProfile } from "@/lib/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Support /login?role=teacher (the "Admin sign in" link) so teachers get a
  // dedicated heading. The sign-in flow itself is identical for both roles.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("role") === "teacher") {
        setIsAdmin(true);
      }
    } catch {
      // no window available — fall back to the student heading
    }
  }, []);

  const routeAfterLogin = async (uid: string) => {
    const profile = await getUserProfile(uid);
    router.replace(profile?.role === "teacher" ? "/teacher" : "/student");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await routeAfterLogin(cred.user.uid);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUserProfile(cred.user.uid);
      if (!existing) {
        // First time this Google account signs in: default to student.
        await createUserProfile({
          uid: cred.user.uid,
          role: "student",
          fullName: cred.user.displayName ?? "New user",
          email: cred.user.email ?? "",
          photoURL: cred.user.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
      await routeAfterLogin(cred.user.uid);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 font-body">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            SM
          </div>
          <span className="font-display text-lg font-semibold text-ink">Students Management</span>
        </Link>

        <div className="card">
          <h1 className="font-display text-xl font-semibold text-ink">
            {isAdmin ? "Teacher sign in" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {isAdmin ? "Sign in to your teacher (admin) dashboard." : "Sign in to continue."}
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">
              {error}
            </p>
          )}

          <form onSubmit={handleEmailLogin} className="mt-5 flex flex-col gap-4">
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
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink/40">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button onClick={handleGoogleLogin} disabled={busy} className="btn-secondary w-full">
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-ink/60">
          No account?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-ink/60">
          {isAdmin ? (
            <>
              Student?{" "}
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className="font-semibold text-primary"
              >
                Sign in here
              </button>
            </>
          ) : (
            <>
  
            </>
          )}
        </p>
      </div>
    </main>
  );
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "Incorrect email or password.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Something went wrong signing you in. Please try again.";
}
