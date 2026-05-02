"use client";

import { useState } from "react";

interface AccountSettingsFormProps {
  user: {
    name: string | null;
    phone: string | null;
    preferredCitySlug: string | null;
    preferredInsurance: string | null;
    marketingOptIn: boolean;
  };
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [preferredCitySlug, setPreferredCitySlug] = useState(user.preferredCitySlug ?? "");
  const [preferredInsurance, setPreferredInsurance] = useState(user.preferredInsurance ?? "");
  const [marketingOptIn, setMarketingOptIn] = useState(user.marketingOptIn);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    const res = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        preferredCitySlug,
        preferredInsurance,
        marketingOptIn,
      }),
    });
    setStatus(res.ok ? "saved" : "error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
        />
      </label>
      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Phone</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
        />
      </label>
      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Preferred city</span>
        <input
          value={preferredCitySlug}
          onChange={(event) => setPreferredCitySlug(event.target.value)}
          placeholder="dubai"
          className="mt-1 w-full rounded-xl border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]"
        />
      </label>
      <label className="block">
        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">Preferred insurance</span>
        <input
          value={preferredInsurance}
          onChange={(event) => setPreferredInsurance(event.target.value)}
          placeholder="Daman, Cigna, AXA..."
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
        <span className="font-['Geist',sans-serif] text-sm leading-relaxed text-black/55">
          Send me useful Zavis updates.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
        >
          {status === "saving" ? "Saving..." : "Save settings"}
        </button>
        {status === "saved" && <span className="font-['Geist',sans-serif] text-sm text-[#006828]">Saved</span>}
        {status === "error" && <span className="font-['Geist',sans-serif] text-sm text-red-600">Could not save</span>}
      </div>
    </form>
  );
}
