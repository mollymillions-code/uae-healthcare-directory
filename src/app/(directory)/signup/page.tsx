"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, marketingOptIn }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/directory" className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]">
          zavis<span className="text-[#006828]">.</span>
        </Link>
        <h1 className="mt-8 font-['Bricolage_Grotesque',sans-serif] text-[28px] font-medium tracking-tight text-[#1c1c1c]">
          Create your Zavis account
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/50">
          Save providers, remember useful clinics, and return to your healthcare search later.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
            />
          </label>
          <label className="block">
            <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Email</span>
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
            <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
            />
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-[#f8f8f6] p-3">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              className="mt-1"
            />
            <span className="font-['Geist',sans-serif] text-xs leading-relaxed text-black/55">
              Send me useful Zavis updates about healthcare directories, insurance, and clinic discovery.
            </span>
          </label>

          {error && <p className="font-['Geist',sans-serif] text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 font-['Geist',sans-serif] text-sm text-black/50">
          Already have an account?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-medium text-[#006828] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f8f6]" />}>
      <SignupForm />
    </Suspense>
  );
}
