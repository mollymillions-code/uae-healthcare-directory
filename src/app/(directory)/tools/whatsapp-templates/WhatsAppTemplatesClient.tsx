"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Mail, Sparkles, Loader2 } from "lucide-react";
import type { WhatsAppTemplate, Specialty, MessageType } from "@/lib/tools/whatsapp-templates";
import { ZavisAIBadge } from "@/components/tools/ZavisAIBadge";

interface Props {
  templates: WhatsAppTemplate[];
  specialties: { slug: Specialty; label: string; arLabel: string }[];
  messageTypes: { slug: MessageType; label: string; arLabel: string }[];
}

interface AIResult {
  scenarioInterpretation: string;
  messageEn: string;
  messageAr: string;
  fillInBlanks: string[];
  alternativeTone: string;
  complianceNote: string;
}

export function WhatsAppTemplatesClient({ templates, specialties, messageTypes }: Props) {
  const [specialtyFilter, setSpecialtyFilter] = useState<Specialty | "all">("all");
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageType | "all">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // AI generator state
  const [aiScenario, setAiScenario] = useState("");
  const [aiSpecialty, setAiSpecialty] = useState("");
  const [aiTone, setAiTone] = useState<"warm" | "concise" | "firm">("warm");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  async function runAIGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (aiScenario.trim().length < 10) {
      setAiError("Describe the scenario in at least 10 characters.");
      setAiStatus("error");
      return;
    }
    setAiStatus("loading");
    setAiError("");
    setAiResult(null);
    try {
      const res = await fetch("/api/tools/whatsapp-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: aiScenario,
          specialty: aiSpecialty || undefined,
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Could not generate. Try again.");
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

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (specialtyFilter !== "all" && t.specialty !== specialtyFilter) return false;
      if (messageTypeFilter !== "all" && t.messageType !== messageTypeFilter) return false;
      return true;
    });
  }, [templates, specialtyFilter, messageTypeFilter]);

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
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
          source: "tool-whatsapp-templates",
          context: { specialty: specialtyFilter, messageType: messageTypeFilter },
        }),
      });
      setEmailStatus(res.ok ? "sent" : "error");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div>
      {/* ── AI generator (primary action) ─────────────────────────────── */}
      <div className="mb-10 rounded-2xl border-2 border-[#006828]/15 bg-gradient-to-br from-[#006828]/[0.04] via-white to-white p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#006828]" strokeWidth={2.25} />
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c]">
              Generate a custom message for your scenario
            </p>
          </div>
          <ZavisAIBadge />
        </div>
        <p className="mt-2 font-['Geist',sans-serif] text-[13px] text-black/55 leading-relaxed">
          Describe the patient-communication scenario in plain English. Zavis AI returns a bilingual (EN + AR) WhatsApp message tailored to UAE patients, with PDPL-safe placeholders for any sensitive fields.
        </p>

        <form onSubmit={runAIGenerate} className="mt-4 space-y-3">
          <textarea
            value={aiScenario}
            onChange={(e) => setAiScenario(e.target.value)}
            placeholder="e.g. 'Dental hygiene patient missed two appointments, last contact was 3 weeks ago via SMS, want to bring them back without sounding pushy'"
            rows={3}
            maxLength={4000}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={aiSpecialty}
              onChange={(e) => setAiSpecialty(e.target.value)}
              placeholder="Specialty (optional)"
              className="flex-1 min-w-[180px] rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828]"
            />
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value as "warm" | "concise" | "firm")}
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] outline-none focus:border-[#006828]"
            >
              <option value="warm">Warm tone</option>
              <option value="concise">Concise tone</option>
              <option value="firm">Firm tone</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={aiStatus === "loading"}
            className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220] disabled:opacity-60"
          >
            {aiStatus === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                Generate with Zavis AI
              </>
            )}
          </button>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
            Free · 5 generations per IP per hour. Your input is never stored or shared.
          </p>
        </form>

        {aiError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-[13px] text-red-700">
            {aiError}
          </p>
        )}

        {aiResult && (
          <div className="mt-5 space-y-4">
            <p className="font-['Geist',sans-serif] text-[12px] italic text-black/55">
              {aiResult.scenarioInterpretation}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-black/[0.06] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
                    English
                  </p>
                  <button
                    type="button"
                    onClick={() => copyText("ai-en", aiResult.messageEn)}
                    className="text-[11px] text-[#006828] hover:underline"
                  >
                    {copiedKey === "ai-en" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] leading-relaxed">
                  {aiResult.messageEn}
                </p>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-white p-4" dir="rtl">
                <div className="flex items-center justify-between" dir="ltr">
                  <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
                    العربية
                  </p>
                  <button
                    type="button"
                    onClick={() => copyText("ai-ar", aiResult.messageAr)}
                    className="text-[11px] text-[#006828] hover:underline"
                  >
                    {copiedKey === "ai-ar" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] leading-relaxed">
                  {aiResult.messageAr}
                </p>
              </div>
            </div>
            {aiResult.fillInBlanks?.length > 0 && (
              <div>
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
                  Placeholders to fill
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aiResult.fillInBlanks.map((b, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-[#006828]/[0.06] px-2.5 py-0.5 font-['Geist_Mono',monospace] text-[11px] text-[#006828]"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiResult.alternativeTone && (
              <div className="rounded-xl bg-[#f8f8f6] p-4">
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
                  Alternative tone
                </p>
                <p className="mt-1 font-['Geist',sans-serif] text-[13px] text-black/65 leading-relaxed">
                  {aiResult.alternativeTone}
                </p>
              </div>
            )}
            {aiResult.complianceNote && (
              <div className="rounded-xl bg-[#006828]/[0.04] px-4 py-3">
                <p className="font-['Geist',sans-serif] text-[12px] text-[#1c1c1c]">
                  <strong className="font-medium">PDPL note:</strong> {aiResult.complianceNote}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/[0.08]" />
        <span className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.16em] text-black/40">
          Or browse 64 ready-made templates
        </span>
        <span className="h-px flex-1 bg-black/[0.08]" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value as Specialty | "all")}
          className="rounded-full border border-black/[0.08] bg-white px-4 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
        >
          <option value="all">All specialties</option>
          {specialties.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={messageTypeFilter}
          onChange={(e) => setMessageTypeFilter(e.target.value as MessageType | "all")}
          className="rounded-full border border-black/[0.08] bg-white px-4 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
        >
          <option value="all">All message types</option>
          {messageTypes.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.label}
            </option>
          ))}
        </select>

        <span className="font-['Geist',sans-serif] text-sm text-black/45 self-center ml-auto">
          {filtered.length} template{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Template cards */}
      <div className="space-y-4">
        {filtered.map((t) => {
          const specLabel = specialties.find((s) => s.slug === t.specialty)?.label || t.specialty;
          const typeLabel = messageTypes.find((m) => m.slug === t.messageType)?.label || t.messageType;
          const enKey = `${t.specialty}-${t.messageType}-en`;
          const arKey = `${t.specialty}-${t.messageType}-ar`;
          const bothKey = `${t.specialty}-${t.messageType}-both`;
          return (
            <div key={`${t.specialty}-${t.messageType}`} className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-black/[0.06] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-[#006828]/[0.08] px-2.5 py-0.5 font-['Geist',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#006828]">
                    {specLabel}
                  </span>
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-medium text-[#1c1c1c]">
                    {typeLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(bothKey, `EN: ${t.en}\n\nAR: ${t.ar}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1 font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c] hover:border-[#006828]/30"
                >
                  {copiedKey === bothKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === bothKey ? "Copied" : "Copy both"}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06]">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">
                      English
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(enKey, t.en)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-black/55 hover:text-[#006828]"
                    >
                      {copiedKey === enKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === enKey ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap">
                    {t.en}
                  </p>
                </div>
                <div className="p-5" dir="rtl" lang="ar">
                  <div className="flex items-center justify-between mb-2" dir="ltr">
                    <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">
                      العربية
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(arKey, t.ar)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-black/55 hover:text-[#006828]"
                    >
                      {copiedKey === arKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === arKey ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap">
                    {t.ar}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Email capture */}
      <div className="mt-10 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6 max-w-3xl">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#006828] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
          <div className="flex-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c]">
              Want all 64 templates as a copy-paste sheet (PDF + DOCX)?
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/55">
              We&apos;ll email both formats. Plus an invite to see how Zavis automates this end-to-end.
            </p>
            {emailStatus === "sent" ? (
              <p className="mt-3 font-['Geist',sans-serif] text-sm text-[#006828] font-medium">
                Sent. Check your inbox in 1–2 minutes.
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
                  {emailStatus === "sending" ? "Sending…" : "Send templates"}
                </button>
              </form>
            )}
            {emailStatus === "error" && (
              <p className="mt-2 font-['Geist',sans-serif] text-xs text-red-600">
                Could not submit. Try again in a minute.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
