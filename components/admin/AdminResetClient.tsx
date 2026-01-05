"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputClasses =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none";

export default function AdminResetClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!token) {
      setError("Reset link is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = (await response.json().catch(() => null)) as
        | { success: boolean; error?: string }
        | null;

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "Unable to reset password.");
        return;
      }

      setNotice("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/admin/login"), 1200);
    } catch (error) {
      console.error("Reset failed", error);
      setError("Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Admin Reset
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Set a new password</h1>
        <p className="mt-2 text-sm text-white/60">
          Use the reset link from your email to choose a new password.
        </p>

        {!token ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
            No reset token found. Open the reset link from your email or request a
            new one from the login page.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                className={inputClasses}
                placeholder="password"
              />
            </div>
            <div>
              <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                className={inputClasses}
                placeholder="password"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-white py-3 text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          <Link href="/admin/login" className="hover:text-white">
            Back to login
          </Link>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rose-300">{error}</p>
        ) : null}
        {notice ? (
          <p className="mt-4 text-sm text-emerald-200">{notice}</p>
        ) : null}
      </div>
    </main>
  );
}
