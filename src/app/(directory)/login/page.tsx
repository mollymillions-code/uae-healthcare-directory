"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ArrowRight, Sparkles } from "lucide-react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/research/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(redirect);
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  };

  return (
    <section className="relative overflow-hidden bg-surface-cream min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Hero copy */}
        <div className="text-center mb-8">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Research dashboard
          </p>
          <h1 className="font-display font-semibold text-ink text-display-md lg:text-[40px] leading-[1.04] tracking-[-0.022em]">
            Welcome back.
          </h1>
          <p className="font-sans text-z-body text-ink-soft mt-3 leading-relaxed">
            Sign in to access the Zavis research dashboard.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-8 shadow-z-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
              >
                Dashboard password
              </label>
              <div className="relative">
                <Lock
                  className="h-4 w-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.75}
                />
                <input
                  id="password"
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white rounded-z-md border border-ink-hairline pl-11 pr-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                  disabled={loading}
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="mt-2 font-sans text-z-caption text-red-600 flex items-center gap-1.5"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-z-pill px-5 py-3 font-sans font-semibold text-z-body-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="font-sans text-z-caption text-ink-muted text-center mt-6 pt-6 border-t border-ink-hairline">
            Trouble signing in? Email{" "}
            <a
              href="mailto:support@zavis.ai"
              className="font-medium text-ink underline underline-offset-2 hover:text-ink-soft"
            >
              support@zavis.ai
            </a>
            .
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/directory"
            className="font-sans text-z-caption text-ink-muted hover:text-ink underline underline-offset-2"
          >
            ← Back to directory
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-surface-cream min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <div className="inline-flex items-center gap-2 font-sans text-z-body-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
