"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/provider-portal";
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    const res = await fetch("/api/provider-portal/magic-link/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirect }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not send sign-in link.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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

      {error && <p className="font-['Geist',sans-serif] text-sm text-red-600">{error}</p>}
      {sent && (
        <p className="rounded-xl border border-[#006828]/15 bg-[#006828]/[0.04] px-4 py-3 font-['Geist',sans-serif] text-sm text-[#006828]">
          If Zavis has granted this email access, a secure sign-in link has been sent.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Sending link..." : "Send secure sign-in link"}
      </button>

      <p className="font-['Geist',sans-serif] text-xs leading-relaxed text-black/40">
        Clinic teams can sign in only after Zavis grants access. Zavis staff can
        use their @zavis.ai email for provider QA.
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
