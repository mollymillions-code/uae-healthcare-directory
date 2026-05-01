"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/directory"
          className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]"
        >
          zavis<span className="text-[#006828]">.</span>
        </Link>
        <h1 className="mt-8 font-['Bricolage_Grotesque',sans-serif] text-[28px] font-medium tracking-tight text-[#1c1c1c]">
          Welcome back
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/50">
          Sign in to pick up your saved clinics and continue your healthcare search.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
            />
          </label>
          <label className="block">
            <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="font-['Geist',sans-serif] text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link
            href="/forgot-password"
            className="font-['Geist',sans-serif] text-black/55 hover:text-[#006828]"
          >
            Forgot password?
          </Link>
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="font-['Geist',sans-serif] font-medium text-[#006828] hover:underline"
          >
            Create account
          </Link>
        </div>

        <p className="mt-6 border-t border-black/[0.06] pt-5 font-['Geist',sans-serif] text-xs text-black/40">
          Are you a clinic? Manage your listing through the Zavis platform — provider sign-in is not on this directory.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f8f6]" />}>
      <LoginForm />
    </Suspense>
  );
}
