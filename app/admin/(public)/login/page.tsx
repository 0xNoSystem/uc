"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClasses =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json().catch(() => null)) as {
        success: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "Unable to log in.");
        return;
      }

      router.push("/admin");
    } catch (error) {
      console.error("Admin login failed", error);
      setError("Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter the admin email first.");
      return;
    }
    setError(null);
    setNotice(null);
    setIsSendingReset(true);

    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json().catch(() => null)) as {
        success: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "Unable to send reset email.");
        return;
      }

      setNotice("Reset link sent. Check your email.");
    } catch (error) {
      console.error("Reset request failed", error);
      setError("Unable to send reset email.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Undercontrol Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-white/60">
          Manage products, pricing, and store settings.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className={inputClasses}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className={inputClasses}
              placeholder="password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-white py-3 text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-white/60">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="font-semibold uppercase tracking-wide text-white/70 hover:text-white disabled:opacity-60"
            disabled={isSendingReset}
          >
            {isSendingReset ? "Sending..." : "Forgot password"}
          </button>
          <Link href="/" className="uppercase tracking-wide hover:text-white">
            Back to store
          </Link>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {notice ? (
          <p className="mt-4 text-sm text-emerald-200">{notice}</p>
        ) : null}
      </div>
    </main>
  );
}
