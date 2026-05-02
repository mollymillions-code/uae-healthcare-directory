"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Mail } from "lucide-react";
import type { WhatsAppTemplate, Specialty, MessageType } from "@/lib/tools/whatsapp-templates";

interface Props {
  templates: WhatsAppTemplate[];
  specialties: { slug: Specialty; label: string; arLabel: string }[];
  messageTypes: { slug: MessageType; label: string; arLabel: string }[];
}

export function WhatsAppTemplatesClient({ templates, specialties, messageTypes }: Props) {
  const [specialtyFilter, setSpecialtyFilter] = useState<Specialty | "all">("all");
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageType | "all">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
