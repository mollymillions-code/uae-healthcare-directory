"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Star, Mail } from "lucide-react";
import { ZavisAIBadge } from "@/components/tools/ZavisAIBadge";
import { AIDisclaimer } from "@/components/tools/AIDisclaimer";

interface Variant {
  tone: string;
  en: string;
  ar: string;
}

const SPECIALTIES = ["General", "Dental", "Pediatrics", "OB-GYN", "Dermatology", "Cardiology", "Lab / Imaging"];

export function ReviewReplyClient() {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(3);
  const [specialty, setSpecialty] = useState("General");
  const [clinicName, setClinicName] = useState("");
  const [tone, setTone] = useState<"default" | "formal" | "friendly">("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setVariants(null);
    try {
      const res = await fetch("/api/tools/review-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewText, rating, specialty, clinicName, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed.");
        return;
      }
      setVariants(data.variants);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

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
          source: "tool-review-reply",
          context: { specialty, rating },
        }),
      });
      setEmailStatus(res.ok ? "sent" : "error");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Form */}
      <form onSubmit={generate} className="rounded-2xl border border-black/[0.06] bg-white p-6 space-y-5">
        <label className="block">
          <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Review text (Arabic or English)</span>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            placeholder="Paste the Google Maps review here…"
            className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828]"
          />
        </label>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Star rating</span>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  aria-label={`${r} stars`}
                  className="p-1"
                >
                  <Star
                    className={`h-5 w-5 ${r <= rating ? "fill-amber-400 text-amber-400" : "text-black/20"}`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Specialty</span>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Clinic name (optional)</span>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            />
          </label>
        </div>

        <div>
          <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Tone preference</span>
          <div className="mt-2 inline-flex gap-1 p-1 rounded-full bg-[#f8f8f6]">
            {(["formal", "default", "friendly"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`px-4 py-1.5 rounded-full font-['Geist',sans-serif] text-xs font-medium transition-colors ${
                  tone === t ? "bg-[#1c1c1c] text-white" : "text-black/55 hover:text-[#1c1c1c]"
                }`}
              >
                {t === "default" ? "Balanced" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !reviewText}
          className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220] disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating…" : "Generate 3 reply variants"}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700">{error}</p>
        )}
      </form>

      {/* Results */}
      {variants && variants.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight">
              Reply variants
            </h3>
            <ZavisAIBadge />
          </div>
          {variants.map((v, i) => (
            <div key={i} className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-black/[0.06] flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-[#006828]/[0.08] px-2.5 py-0.5 font-['Geist',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#006828]">
                  {v.tone}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(`v${i}-both`, `EN: ${v.en}\n\nAR: ${v.ar}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1 font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c] hover:border-[#006828]/30"
                >
                  {copiedKey === `v${i}-both` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === `v${i}-both` ? "Copied" : "Copy both"}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06]">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">English</span>
                    <button
                      type="button"
                      onClick={() => copyText(`v${i}-en`, v.en)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-black/55 hover:text-[#006828]"
                    >
                      {copiedKey === `v${i}-en` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === `v${i}-en` ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] leading-relaxed">{v.en}</p>
                </div>
                <div className="p-5" dir="rtl" lang="ar">
                  <div className="flex items-center justify-between mb-2" dir="ltr">
                    <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">العربية</span>
                    <button
                      type="button"
                      onClick={() => copyText(`v${i}-ar`, v.ar)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-black/55 hover:text-[#006828]"
                    >
                      {copiedKey === `v${i}-ar` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === `v${i}-ar` ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] leading-relaxed">{v.ar}</p>
                </div>
              </div>
            </div>
          ))}
          <AIDisclaimer context="review reply" />
        </div>
      )}

      {/* Email capture */}
      <div className="mt-10 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#006828] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
          <div className="flex-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c]">
              Want Zavis to reply to all your reviews automatically?
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/55">
              The Zavis platform monitors Google Maps + WhatsApp reviews 24/7, generates PDPL-safe replies, and queues them for your approval. Audit log included.
            </p>
            {emailStatus === "sent" ? (
              <p className="mt-3 font-['Geist',sans-serif] text-sm text-[#006828] font-medium inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Sent. We&apos;ll reach out within 24 hours.
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
                  {emailStatus === "sending" ? "Sending…" : "Get demo"}
                </button>
              </form>
            )}
            {emailStatus === "error" && (
              <p className="mt-2 font-['Geist',sans-serif] text-xs text-red-600">Could not submit. Try again.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
