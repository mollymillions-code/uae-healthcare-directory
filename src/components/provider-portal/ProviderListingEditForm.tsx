"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { normalizeDayName } from "@/lib/hours-utils";

const OPERATING_HOUR_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type ProviderEditorData = {
  id: string;
  phone: string | null;
  phoneSecondary: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  shortDescription: string | null;
  description: string | null;
  services: string[] | null;
  insurance: string[] | null;
  languages: string[] | null;
  operatingHours: Record<string, { open?: string | null; close?: string | null }> | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  photos: string[] | null;
};

type OperatingHoursForm = Record<(typeof OPERATING_HOUR_DAYS)[number], { open: string; close: string }>;

function listToText(value: string[] | null | undefined): string {
  return (value || []).join("\n");
}

function textToList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOperatingHours(
  value: ProviderEditorData["operatingHours"]
): OperatingHoursForm {
  const hours = Object.fromEntries(
    OPERATING_HOUR_DAYS.map((day) => [day, { open: "", close: "" }])
  ) as OperatingHoursForm;

  if (!value || typeof value !== "object") return hours;

  for (const [rawDay, rawHours] of Object.entries(value)) {
    const day = normalizeDayName(rawDay);
    if (!day || !(day in hours) || !rawHours || typeof rawHours !== "object") continue;
    const entry = rawHours as { open?: unknown; close?: unknown };
    hours[day as keyof OperatingHoursForm] = {
      open: entry.open == null ? "" : String(entry.open),
      close: entry.close == null ? "" : String(entry.close),
    };
  }

  return hours;
}

function operatingHoursToPayload(hours: OperatingHoursForm) {
  const payload: Record<string, { open: string; close: string }> = {};
  for (const day of OPERATING_HOUR_DAYS) {
    const open = hours[day].open.trim();
    const close = hours[day].close.trim();
    if (!open && !close) continue;
    payload[day] = { open, close };
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

export function ProviderListingEditForm({ provider }: { provider: ProviderEditorData }) {
  const [form, setForm] = useState({
    phone: provider.phone || "",
    phoneSecondary: provider.phoneSecondary || "",
    whatsapp: provider.whatsapp || "",
    email: provider.email || "",
    website: provider.website || "",
    address: provider.address || "",
    shortDescription: provider.shortDescription || "",
    description: provider.description || "",
    services: listToText(provider.services),
    insurance: listToText(provider.insurance),
    languages: listToText(provider.languages),
    operatingHours: normalizeOperatingHours(provider.operatingHours),
    logoUrl: provider.logoUrl || "",
    coverImageUrl: provider.coverImageUrl || "",
    photos: listToText(provider.photos),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateOperatingHours(
    day: keyof OperatingHoursForm,
    field: keyof OperatingHoursForm[keyof OperatingHoursForm],
    value: string
  ) {
    setForm((current) => ({
      ...current,
      operatingHours: {
        ...current.operatingHours,
        [day]: {
          ...current.operatingHours[day],
          [field]: value,
        },
      },
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const res = await fetch(`/api/provider-portal/listings/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: form.phone,
        phoneSecondary: form.phoneSecondary,
        whatsapp: form.whatsapp,
        email: form.email,
        website: form.website,
        address: form.address,
        shortDescription: form.shortDescription,
        description: form.description,
        services: textToList(form.services),
        insurance: textToList(form.insurance),
        languages: textToList(form.languages),
        operatingHours: operatingHoursToPayload(form.operatingHours),
        logoUrl: form.logoUrl,
        coverImageUrl: form.coverImageUrl,
        photos: textToList(form.photos),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not submit listing edits.");
      setSaving(false);
      return;
    }

    setMessage("Edits submitted for Zavis review.");
    window.parent?.postMessage(
      { type: "zavis_provider_portal_edit_submitted", providerId: provider.id },
      "*"
    );
    setSaving(false);
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-black/[0.10] bg-white px-4 py-3 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]";

  return (
    <form onSubmit={submit} className="space-y-6">
      {message && (
        <div className="rounded-xl border border-[#006828]/20 bg-[#006828]/[0.04] px-4 py-3 font-['Geist',sans-serif] text-sm text-[#006828]">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Geist',sans-serif] text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Primary phone
          </span>
          <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Secondary phone
          </span>
          <input className={inputClass} value={form.phoneSecondary} onChange={(e) => update("phoneSecondary", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            WhatsApp
          </span>
          <input className={inputClass} value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Email
          </span>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Website
          </span>
          <input type="url" className={inputClass} value={form.website} onChange={(e) => update("website", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Address
          </span>
          <textarea rows={3} className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </label>
      </section>

      <section className="grid gap-4">
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Short description
          </span>
          <textarea rows={3} className={inputClass} value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Full description
          </span>
          <textarea rows={6} className={inputClass} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Services
          </span>
          <textarea rows={7} className={inputClass} value={form.services} onChange={(e) => update("services", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Insurance
          </span>
          <textarea rows={7} className={inputClass} value={form.insurance} onChange={(e) => update("insurance", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Languages
          </span>
          <textarea rows={7} className={inputClass} value={form.languages} onChange={(e) => update("languages", e.target.value)} />
        </label>
      </section>

      <section className="grid gap-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">
          Operating hours
        </h2>
        <div className="grid gap-3">
          {OPERATING_HOUR_DAYS.map((day) => (
            <div
              key={day}
              className="grid gap-2 rounded-xl border border-black/[0.06] bg-[#f8f8f6] p-3 sm:grid-cols-[120px_1fr_1fr] sm:items-center"
            >
              <p className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
                {day}
              </p>
              <label className="block">
                <span className="sr-only">{day} opening time</span>
                <input
                  className={inputClass}
                  value={form.operatingHours[day].open}
                  onChange={(e) => updateOperatingHours(day, "open", e.target.value)}
                  placeholder="Open"
                />
              </label>
              <label className="block">
                <span className="sr-only">{day} closing time</span>
                <input
                  className={inputClass}
                  value={form.operatingHours[day].close}
                  onChange={(e) => updateOperatingHours(day, "close", e.target.value)}
                  placeholder="Close"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Logo URL
          </span>
          <input type="url" className={inputClass} value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Cover image URL
          </span>
          <input type="url" className={inputClass} value={form.coverImageUrl} onChange={(e) => update("coverImageUrl", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
            Gallery photo URLs
          </span>
          <textarea rows={5} className={inputClass} value={form.photos} onChange={(e) => update("photos", e.target.value)} />
        </label>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-wait disabled:opacity-70"
        >
          <Save className="h-4 w-4" />
          {saving ? "Submitting..." : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
