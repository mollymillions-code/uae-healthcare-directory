"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/directory" className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]">
          zavis<span className="text-[#006828]">.</span>
        </Link>
        <h1 className="mt-8 font-['Bricolage_Grotesque',sans-serif] text-[28px] font-medium tracking-tight text-[#1c1c1c]">
          Reset your password
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/50">
          Enter your email and we will send a reset link if an account exists.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-[#006828]/[0.06] p-4 font-['Geist',sans-serif] text-sm text-[#006828]">
            Check your inbox for a password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-5 inline-block font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
