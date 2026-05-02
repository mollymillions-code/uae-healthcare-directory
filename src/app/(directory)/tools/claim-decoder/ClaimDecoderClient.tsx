"use client";

import { useMemo, useState } from "react";
import { Search, Copy, Check, Mail } from "lucide-react";
import type { ClaimCode } from "@/lib/tools/claim-codes";

interface Props {
  codes: ClaimCode[];
  topCodes: string[];
}

export function ClaimDecoderClient({ codes, topCodes }: Props) {
  const [query, setQuery] = useState("");
  const [copiedNote, setCopiedNote] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const result = useMemo<ClaimCode | null>(() => {
    const q = query.trim().toUpperCase();
    if (!q) return null;
    // Exact code match first.
    const exact = codes.find((c) => c.code.toUpperCase() === q);
    if (exact) return exact;
    // Substring match — useful when user pastes a longer rejection string.
    const partial = codes.find((c) => q.includes(c.code.toUpperCase()));
    if (partial) return partial;
    // Free-text search across explanation/cause.
    const free = codes.find(
      (c) =>
        c.explanation.toLowerCase().includes(query.trim().toLowerCase()) ||
        c.commonCause.toLowerCase().includes(query.trim().toLowerCase())
    );
    return free ?? null;
  }, [query, codes]);

  function copyAsNote() {
    if (!result) return;
    const note = `Claim rejection ${result.code} (${result.platform})\n\nWhat it means: ${result.explanation}\n\nMost common cause: ${result.commonCause}\n\nRecommended fix: ${result.fix}\n\nDecoded via Zavis Free Tools — zavis.ai/tools/claim-decoder`;
    navigator.clipboard.writeText(note).then(() => {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
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
          source: "tool-claim-decoder",
          context: { decodedCode: result?.code ?? null },
        }),
      });
      setEmailStatus(res.ok ? "sent" : "error");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" strokeWidth={2.25} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste a rejection code (e.g. EC-4.06, MNEC-001, SH-410)…"
          className="w-full rounded-xl border border-black/[0.08] bg-white pl-11 pr-4 py-3.5 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          autoFocus
        />
      </div>

      {/* Quick chips */}
      {!query && (
        <div className="mt-5">
          <p className="font-['Geist',sans-serif] text-xs uppercase tracking-[0.06em] text-black/40 mb-2">
            Top recent codes — click to decode
          </p>
          <div className="flex flex-wrap gap-2">
            {topCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setQuery(code)}
                className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 font-['Geist_Mono',monospace] text-xs text-[#1c1c1c] hover:border-[#006828]/30 hover:bg-[#006828]/[0.03] transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center rounded-full bg-[#006828]/[0.08] px-2.5 py-0.5 font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#006828]">
                {result.platform}
              </span>
              <p className="mt-2 font-['Geist_Mono',monospace] text-[18px] font-semibold text-[#1c1c1c]">
                {result.code}
              </p>
            </div>
            <button
              type="button"
              onClick={copyAsNote}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c] hover:border-[#006828]/30 transition-colors"
            >
              {copiedNote ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedNote ? "Copied" : "Copy as note"}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">
                What it means
              </p>
              <p className="mt-1 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] leading-relaxed">
                {result.explanation}
              </p>
            </div>
            <div>
              <p className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">
                Most common cause
              </p>
              <p className="mt-1 font-['Geist',sans-serif] text-[15px] text-black/65 leading-relaxed">
                {result.commonCause}
              </p>
            </div>
            <div>
              <p className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">
                Recommended fix
              </p>
              <p className="mt-1 font-['Geist',sans-serif] text-[15px] text-black/65 leading-relaxed">
                {result.fix}
              </p>
            </div>
            {result.related && result.related.length > 0 && (
              <div>
                <p className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40">
                  Related codes worth checking
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.related.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setQuery(r)}
                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1 font-['Geist_Mono',monospace] text-xs text-[#1c1c1c] hover:border-[#006828]/30 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No result */}
      {query && !result && (
        <div className="mt-6 rounded-2xl border border-dashed border-black/[0.08] bg-[#f8f8f6] p-6 text-center">
          <p className="font-['Geist',sans-serif] text-sm text-black/55">
            No match found for <span className="font-['Geist_Mono',monospace] text-[#1c1c1c]">{query}</span>.
          </p>
          <p className="mt-2 font-['Geist',sans-serif] text-[13px] text-black/40">
            The reference covers ~80 most common codes. For carrier-specific or rare codes, contact the carrier&apos;s claim-support line directly.
          </p>
        </div>
      )}

      {/* Email capture */}
      <div className="mt-10 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#006828] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
          <div className="flex-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c]">
              Want the full reference (80+ codes) as a PDF?
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/55">
              We&apos;ll email it plus monthly UAE healthcare-ops updates. No spam.
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
                  {emailStatus === "sending" ? "Sending…" : "Send PDF"}
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
