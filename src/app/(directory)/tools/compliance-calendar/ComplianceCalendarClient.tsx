"use client";

import { useState, useMemo } from "react";
import { Calendar, Download, Mail, Check, Sparkles, Loader2 } from "lucide-react";
import { ZavisAIBadge } from "@/components/tools/ZavisAIBadge";
import { AIDisclaimer } from "@/components/tools/AIDisclaimer";
import {
  type Authority,
  type LicenseType,
  type UpcomingMilestone,
  RULES,
  LICENSE_LABELS,
  computeMilestones,
} from "@/lib/tools/compliance-calendar";

interface AIPersonalizeItem {
  title: string;
  due: string;
  category: string;
  why: string;
  action: string;
}
interface AIPersonalizeResult {
  clinicSnapshot: string;
  next30Days: AIPersonalizeItem[];
  next60Days: AIPersonalizeItem[];
  next90Days: AIPersonalizeItem[];
  watchOutFor: string[];
  documentsToHaveOnFile: string[];
}

const CATEGORY_STYLES: Record<UpcomingMilestone["category"], { label: string; bg: string; text: string }> = {
  license_renewal: { label: "License renewal", bg: "bg-red-50", text: "text-red-700" },
  cme_deadline: { label: "CME deadline", bg: "bg-amber-50", text: "text-amber-700" },
  dataflow: { label: "DataFlow", bg: "bg-purple-50", text: "text-purple-700" },
  insurance_renewal: { label: "Insurance contract", bg: "bg-blue-50", text: "text-blue-700" },
  inspection_window: { label: "Inspection window", bg: "bg-emerald-50", text: "text-emerald-700" },
};

export function ComplianceCalendarClient() {
  const [authority, setAuthority] = useState<Authority>("DHA");
  const [licenseType, setLicenseType] = useState<LicenseType>("facility_clinic");
  const [lastRenewal, setLastRenewal] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // AI personalizer state
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState<AIPersonalizeResult | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  async function runAIPersonalize(e: React.FormEvent) {
    e.preventDefault();
    if (aiDescription.trim().length < 20) {
      setAiError("Describe your clinic in at least 20 characters.");
      setAiStatus("error");
      return;
    }
    setAiStatus("loading");
    setAiError("");
    setAiResult(null);
    try {
      const res = await fetch("/api/tools/compliance-calendar/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicDescription: aiDescription,
          emirate: authority === "DHA" ? "Dubai" : authority === "DOH" ? "Abu Dhabi" : "Northern Emirates",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Could not personalize. Try again.");
        setAiStatus("error");
        return;
      }
      setAiResult(data);
      setAiStatus("idle");
    } catch {
      setAiError("Network error. Try again.");
      setAiStatus("error");
    }
  }

  const validLicenseTypes = useMemo(() => {
    const set = new Set(RULES.filter((r) => r.authority === authority).map((r) => r.licenseType));
    return Array.from(set);
  }, [authority]);

  const milestones = useMemo(() => {
    return computeMilestones(authority, licenseType, lastRenewal);
  }, [authority, licenseType, lastRenewal]);

  function downloadIcs() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Zavis Free Tools//Compliance Calendar//EN",
    ];
    for (const m of milestones) {
      const dt = m.date.replace(/-/g, "");
      const uid = `${m.category}-${dt}@zavis.ai`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dt}T000000Z`,
        `DTSTART;VALUE=DATE:${dt}`,
        `SUMMARY:${m.title}`,
        `DESCRIPTION:${m.description.replace(/\n/g, " ")}`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zavis-compliance-${authority.toLowerCase()}-${licenseType}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setEmailStatus("sending");
    try {
      const res = await fetch("/api/tools/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "tool-compliance-calendar",
          context: { authority, licenseType, lastRenewal, milestones: milestones.length },
        }),
      });
      setEmailStatus(res.ok ? "sent" : "error");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div className="max-w-3xl">
      {/* ── AI personalizer (primary action) ──────────────────────────── */}
      <div className="mb-10 rounded-2xl border-2 border-[#006828]/15 bg-gradient-to-br from-[#006828]/[0.04] via-white to-white p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#006828]" strokeWidth={2.25} />
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c]">
              Get a personalized 90-day compliance plan
            </p>
          </div>
          <ZavisAIBadge />
        </div>
        <p className="mt-2 font-['Geist',sans-serif] text-[13px] text-black/55 leading-relaxed">
          Describe your clinic in plain English — emirate, specialty, headcount, recent hires, current concerns. Zavis AI returns a 30/60/90-day priority list tailored to your setup, plus UAE-specific gotchas to watch out for.
        </p>

        <form onSubmit={runAIPersonalize} className="mt-4 space-y-3">
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. '3-clinic dental group in Dubai with 14 dentists, just hired 4 hygienists from Philippines, planning to add ortho specialty next quarter, current pain is Dataflow timelines'"
            rows={4}
            maxLength={4000}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          />
          <button
            type="submit"
            disabled={aiStatus === "loading"}
            className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220] disabled:opacity-60"
          >
            {aiStatus === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Personalizing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                Personalize with Zavis AI
              </>
            )}
          </button>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
            Free · 5 personalizations per IP per hour. Your input is never stored or shared.
          </p>
        </form>

        {aiError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-[13px] text-red-700">
            {aiError}
          </p>
        )}

        {aiResult && (
          <div className="mt-5 space-y-5">
            <p className="font-['Geist',sans-serif] text-[13px] italic text-black/65">
              {aiResult.clinicSnapshot}
            </p>
            {(["next30Days", "next60Days", "next90Days"] as const).map((window) => {
              const items = aiResult[window];
              if (!items?.length) return null;
              const label = window === "next30Days" ? "Next 30 days" : window === "next60Days" ? "Days 31–60" : "Days 61–90";
              return (
                <div key={window}>
                  <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#006828]">
                    {label}
                  </p>
                  <div className="mt-2 space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c]">{item.title}</p>
                          <span className="rounded-full bg-[#f8f8f6] px-2 py-0.5 font-['Geist_Mono',monospace] text-[10px] text-black/55">{item.due}</span>
                        </div>
                        <p className="mt-1 font-['Geist',sans-serif] text-[12px] text-black/55">{item.why}</p>
                        <p className="mt-1 font-['Geist',sans-serif] text-[12px] text-[#006828]"><strong>Action:</strong> {item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {aiResult.watchOutFor?.length > 0 && (
              <div className="rounded-xl bg-amber-50 px-4 py-3">
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                  Watch out for
                </p>
                <ul className="mt-1 space-y-1 font-['Geist',sans-serif] text-[13px] text-amber-900">
                  {aiResult.watchOutFor.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiResult.documentsToHaveOnFile?.length > 0 && (
              <div>
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
                  Documents to keep on file
                </p>
                <ul className="mt-1 space-y-1 font-['Geist',sans-serif] text-[12px] text-black/65">
                  {aiResult.documentsToHaveOnFile.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>
            )}
            <AIDisclaimer context="compliance plan" />
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/[0.08]" />
        <span className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.16em] text-black/40">
          Or compute deadlines from your renewal date
        </span>
        <span className="h-px flex-1 bg-black/[0.08]" />
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Authority</span>
            <select
              value={authority}
              onChange={(e) => {
                const next = e.target.value as Authority;
                setAuthority(next);
                const valid = RULES.filter((r) => r.authority === next).map((r) => r.licenseType);
                if (!valid.includes(licenseType)) setLicenseType(valid[0]);
              }}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            >
              <option value="DHA">DHA (Dubai)</option>
              <option value="DOH">DOH / Sheryan (Abu Dhabi)</option>
              <option value="MOHAP">MOHAP (Northern Emirates)</option>
            </select>
          </label>

          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">License type</span>
            <select
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value as LicenseType)}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            >
              {validLicenseTypes.map((t) => (
                <option key={t} value={t}>
                  {LICENSE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Last renewal date</span>
            <input
              type="date"
              value={lastRenewal}
              onChange={(e) => setLastRenewal(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            />
          </label>
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight">
            Upcoming compliance milestones (next 12 months)
          </h3>
          <button
            type="button"
            onClick={downloadIcs}
            disabled={milestones.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c] hover:border-[#006828]/30 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Add to calendar (.ics)
          </button>
        </div>

        {milestones.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/[0.08] bg-[#f8f8f6] p-6 text-center font-['Geist',sans-serif] text-sm text-black/55">
            No milestones found in the next 12 months. Verify the last renewal date.
          </p>
        ) : (
          <ul className="space-y-3">
            {milestones.map((m, i) => {
              const style = CATEGORY_STYLES[m.category];
              return (
                <li key={i} className="rounded-2xl border border-black/[0.06] bg-white p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#f8f8f6]">
                      <Calendar className="h-5 w-5 text-[#006828]" strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-['Geist',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em] ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        <span className="font-['Geist_Mono',monospace] text-xs text-black/55">
                          {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="font-['Geist',sans-serif] text-xs text-black/40">
                          ({m.daysOut} days)
                        </span>
                      </div>
                      <p className="mt-1.5 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c]">
                        {m.title}
                      </p>
                      <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Email capture */}
      <div className="mt-10 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#006828] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
          <div className="flex-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c]">
              Get email reminders 90 / 60 / 30 / 7 days before each milestone
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/55">
              We&apos;ll send a checklist of what to prepare for each renewal. No spam.
            </p>
            {emailStatus === "sent" ? (
              <p className="mt-3 font-['Geist',sans-serif] text-sm text-[#006828] font-medium inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Subscribed. First reminder lands ~90 days before your earliest milestone.
              </p>
            ) : (
              <form onSubmit={submitEmail} className="mt-3 flex gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.ae"
                  required
                  className="flex-1 min-w-[180px] rounded-full border border-black/[0.08] bg-white px-4 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828]"
                />
                <button
                  type="submit"
                  disabled={emailStatus === "sending"}
                  className="rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220] disabled:opacity-60"
                >
                  {emailStatus === "sending" ? "Subscribing…" : "Set up reminders"}
                </button>
              </form>
            )}
            {emailStatus === "error" && (
              <p className="mt-2 font-['Geist',sans-serif] text-xs text-red-600">
                Could not subscribe. Try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
