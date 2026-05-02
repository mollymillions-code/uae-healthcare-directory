"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not reset password.");
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
          Choose a new password
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/50">
          Use at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
            />
          </label>

          {error && <p className="font-['Geist',sans-serif] text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f8f6]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
