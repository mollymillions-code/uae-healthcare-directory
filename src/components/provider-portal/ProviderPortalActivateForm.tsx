"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ActivateFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/provider-portal/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, phone, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not activate portal access.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/provider-portal");
      router.refresh();
    }, 800);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#006828]" />
        <h2 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium text-[#1c1c1c]">
          Portal activated
        </h2>
        <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
          Opening your listing dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!token && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Geist',sans-serif] text-sm text-red-700">
          Activation token is missing. Open the full activation link from your invite.
        </p>
      )}

      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
          Your name
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
        />
      </label>

      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
          WhatsApp or phone
        </span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
        />
      </label>

      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
          Create password
        </span>
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

      {error && <p className="font-['Geist',sans-serif] text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Activating..." : "Activate portal"}
      </button>
    </form>
  );
}

export function ProviderPortalActivateForm() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <ActivateFormInner />
    </Suspense>
  );
}
