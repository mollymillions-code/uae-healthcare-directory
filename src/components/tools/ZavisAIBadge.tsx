import { Sparkles } from "lucide-react";

/**
 * "Powered by Zavis AI" badge. Used on every AI-backed free tool to
 * (a) signal AI is involved (b) carry brand impression on every share.
 */
export function ZavisAIBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#006828]/20 bg-[#006828]/[0.04] px-3 py-1 font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.16em] text-[#006828] ${className}`}
    >
      <Sparkles className="h-3 w-3" strokeWidth={2.5} />
      Powered by Zavis AI
    </span>
  );
}
