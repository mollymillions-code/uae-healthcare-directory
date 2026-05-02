"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/provider-portal";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/provider-portal/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Email or password is incorrect.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
          Work email
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

      {error && <p className="font-['Geist',sans-serif] text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>

      <p className="font-['Geist',sans-serif] text-xs leading-relaxed text-black/40">
        Access is only available after Zavis approves your listing claim or your team
        grants you access from the B2B app.
      </p>

      <Link href="/claim" className="block font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline">
        Claim a listing instead
      </Link>
    </form>
  );
}

export function ProviderPortalLoginForm() {
  return (
    <Suspense fallback={<div className="h-48" />}>
      <LoginFormInner />
    </Suspense>
  );
}
