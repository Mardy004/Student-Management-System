"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserProfile, createUserProfile } from "@/lib/firestore";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Support /login?role=teacher
  useEffect(() => {
    try {
      if (
        new URLSearchParams(window.location.search).get("role") ===
        "teacher"
      ) {
        setIsAdmin(true);
      }
    } catch {
      // Fall back to student heading
    }
  }, []);

  const routeAfterLogin = async (uid: string) => {
    const profile = await getUserProfile(uid);

    router.replace(
      profile?.role === "teacher" ? "/teacher" : "/student"
    );
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

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

        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            SM
          </div>

          <span className="font-display text-lg font-semibold text-ink">
            Students Management
          </span>
        </Link>

        {/* Login Card */}
        <div className="card">
          <h1 className="font-display text-xl font-semibold text-ink">
            {isAdmin ? "Teacher sign in" : "Welcome back"}
          </h1>

          <p className="mt-1 text-sm text-ink/60">
            {isAdmin
              ? "Sign in to your teacher (admin) dashboard."
              : "Sign in to continue."}
          </p>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">
              {error}
            </p>
          )}

          <form
            onSubmit={handleEmailLogin}
            className="mt-5 flex flex-col gap-4"
          >
            {/* Email */}
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input w-full pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Eye / EyeOff Button */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 transition hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />

            <span className="text-xs text-ink/40">
              or
            </span>

            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={busy}
            className="btn-secondary w-full"
          >
            Continue with Google
          </button>
        </div>

        {/* Register */}
        <p className="mt-5 text-center text-sm text-ink/60">
          No account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary"
          >
            Create one
          </Link>
        </p>

        {/* Student / Teacher */}
        <p className="mt-2 text-center text-sm text-ink/60">
          {isAdmin && (
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
          )}
        </p>
      </div>
    </main>
  );
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";

  if (
    code.includes("user-not-found") ||
    code.includes("wrong-password") ||
    code.includes("invalid-credential")
  ) {
    return "Incorrect email or password.";
  }

  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "Something went wrong signing you in. Please try again.";
}
