import { Info } from "lucide-react";

/**
 * Standard "AI can make mistakes" disclaimer. Drop under every AI-generated
 * output panel. Matches the convention users already know from Google /
 * ChatGPT / Claude — sets expectations + protects clinic operators from
 * acting on a hallucination.
 */
export function AIDisclaimer({
  context,
  className = "",
}: {
  /** Optional domain hint, e.g. "claim", "WhatsApp message", "intake form". */
  context?: string;
  className?: string;
}) {
  const subject = context ? `this ${context}` : "this output";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg bg-black/[0.03] px-3 py-2 text-[11px] leading-snug text-black/55 ${className}`}
    >
      <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-black/40" strokeWidth={2.5} />
      <p className="font-['Geist',sans-serif]">
        AI-generated. Zavis AI can make mistakes — verify {subject} against your
        clinic&apos;s policies and the insurer/regulator&apos;s official guidance
        before acting. Not medical advice.
      </p>
    </div>
  );
}
