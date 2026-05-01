"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Heart, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 lg:min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* ── Form panel ──────────────────────────────────────────── */}
        <main className="flex flex-col px-6 pb-12 pt-8 sm:px-10 lg:px-16 lg:pt-14 lg:pb-20">
          <Link
            href="/directory"
            className="inline-flex items-center font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]"
          >
            zavis<span className="text-[#006828]">.</span>
          </Link>

          <div className="mt-12 max-w-[440px] lg:my-auto">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
              Sign in
            </p>
            <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-[#1c1c1c] sm:text-[48px]">
              Welcome back.
            </h1>
            <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
              Pick up your saved clinics, your insurance preferences, and your search — across phone, laptop, and future visits.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <label className="block">
                <span className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3.5 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
                />
              </label>
              <label className="block">
                <div className="flex items-baseline justify-between">
                  <span className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
                    Password
                  </span>
                  <Link
                    href="/forgot-password"
                    className="font-['Geist',sans-serif] text-[13px] font-medium text-[#006828] hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3.5 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#006828] px-5 py-3.5 font-['Geist',sans-serif] text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] transition-all hover:bg-[#005220] hover:shadow-[0_12px_32px_-10px_rgba(0,104,40,0.6)] disabled:cursor-wait disabled:opacity-70"
              >
                <span>{loading ? "Signing in…" : "Sign in"}</span>
                {!loading && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                  />
                )}
              </button>
            </form>

            <p className="mt-8 font-['Geist',sans-serif] text-[14px] text-black/55">
              New here?{" "}
              <Link
                href={`/signup?redirect=${encodeURIComponent(redirect)}`}
                className="font-medium text-[#1c1c1c] underline decoration-[#006828]/40 decoration-2 underline-offset-4 hover:decoration-[#006828]"
              >
                Create a free account
              </Link>
            </p>
          </div>

          <p className="mt-12 max-w-[440px] font-['Geist',sans-serif] text-[12px] leading-relaxed text-black/40 lg:mt-10">
            Are you a clinic? Manage your listing through the{" "}
            <span className="text-black/55">Zavis platform</span> — provider sign-in is not on this directory.
          </p>
        </main>

        {/* ── Brand / trust panel ────────────────────────────────── */}
        <aside className="hidden lg:flex relative overflow-hidden bg-[#0e1410]">
          {/* Soft green glow */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#006828]/30 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-[#00c853]/10 blur-[120px]" />

          <div className="relative flex flex-1 flex-col justify-between px-12 py-14 xl:px-16 xl:py-16">
            {/* Top — quote */}
            <div>
              <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#88e0a8]">
                Open healthcare data · UAE
              </p>
              <h2 className="mt-5 font-['Bricolage_Grotesque',sans-serif] text-[32px] font-medium leading-[1.15] tracking-[-0.015em] text-white xl:text-[36px]">
                The directory that respects your time and your data.
              </h2>
              <p className="mt-5 max-w-[440px] font-['Geist',sans-serif] text-[15px] leading-relaxed text-white/65">
                Sourced directly from DHA, DOH and MOHAP licensing registers. No fake reviews, no pay-to-rank, no spam — just current healthcare information for the UAE.
              </p>
            </div>

            {/* Middle — stat block */}
            <div className="my-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/[0.06] xl:my-16">
              <div className="bg-[#0e1410] p-5">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium text-white xl:text-3xl">
                  17k+
                </p>
                <p className="mt-1 font-['Geist',sans-serif] text-[12px] leading-snug text-white/50">
                  Licensed facilities
                </p>
              </div>
              <div className="bg-[#0e1410] p-5">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium text-white xl:text-3xl">
                  99k+
                </p>
                <p className="mt-1 font-['Geist',sans-serif] text-[12px] leading-snug text-white/50">
                  DHA-registered professionals
                </p>
              </div>
              <div className="bg-[#0e1410] p-5">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium text-white xl:text-3xl">
                  81
                </p>
                <p className="mt-1 font-['Geist',sans-serif] text-[12px] leading-snug text-white/50">
                  Insurance plans tracked
                </p>
              </div>
            </div>

            {/* Bottom — value props */}
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                  <Heart className="h-3.5 w-3.5 text-[#88e0a8]" fill="#88e0a8" strokeWidth={0} />
                </span>
                <div>
                  <p className="font-['Geist',sans-serif] text-[14px] font-medium text-white">Save what you find.</p>
                  <p className="font-['Geist',sans-serif] text-[13px] text-white/50">Build a personal shortlist of clinics and doctors across visits.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#88e0a8]" strokeWidth={2.25} />
                </span>
                <div>
                  <p className="font-['Geist',sans-serif] text-[14px] font-medium text-white">Set your insurance once.</p>
                  <p className="font-['Geist',sans-serif] text-[13px] text-white/50">See direct-billing-eligible clinics first, every time.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#88e0a8]" strokeWidth={2.25} />
                </span>
                <div>
                  <p className="font-['Geist',sans-serif] text-[14px] font-medium text-white">Verified providers, surfaced.</p>
                  <p className="font-['Geist',sans-serif] text-[13px] text-white/50">Zavis-Verified clinics carry a tier badge built on licensing + audit data.</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
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
