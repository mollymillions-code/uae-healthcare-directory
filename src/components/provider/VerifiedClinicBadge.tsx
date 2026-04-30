import { BadgeCheck, ClipboardCheck, ShieldCheck } from "lucide-react";

interface VerifiedClinicBadgeProps {
  variant?: "card" | "hero" | "table" | "inline";
  className?: string;
}

const base =
  "inline-flex shrink-0 items-center font-['Geist',sans-serif] font-semibold";
export const VERIFIED_CLINIC_EXPLANATION =
  "Verified means Zavis has collaborated with this clinic and confirmed that the information on this profile is accurate.";

export function VerifiedClinicBadge({
  variant = "card",
  className = "",
}: VerifiedClinicBadgeProps) {
  if (variant === "hero") {
    return (
      <span
        className={`${base} gap-2 rounded-full border border-white/50 bg-white px-3.5 py-1.5 text-xs text-[#006828] shadow-[0_16px_36px_rgba(0,104,40,0.28)] ring-1 ring-[#006828]/20 ${className}`}
        aria-label="Verified clinic profile"
        title={VERIFIED_CLINIC_EXPLANATION}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#006828] text-white shadow-[0_0_0_4px_rgba(0,104,40,0.14)]">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        Verified
      </span>
    );
  }

  if (variant === "table") {
    return (
      <span
        className={`${base} justify-center gap-1 rounded-full border border-[#006828]/15 bg-[#006828]/[0.07] px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#006828] ${className}`}
        aria-label="Verified clinic profile"
        title={VERIFIED_CLINIC_EXPLANATION}
      >
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Verified
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={`${base} gap-1 rounded-full bg-[#006828]/[0.08] px-2 py-0.5 text-[9px] text-[#006828] ${className}`}
        aria-label="Verified clinic profile"
        title={VERIFIED_CLINIC_EXPLANATION}
      >
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Verified
      </span>
    );
  }

  return (
    <span
      className={`${base} gap-1 rounded-full border border-[#006828]/15 bg-[#006828]/[0.08] px-2 py-0.5 text-[9px] text-[#006828] shadow-[0_8px_18px_rgba(0,104,40,0.12)] ${className}`}
      aria-label="Verified clinic profile"
      title={VERIFIED_CLINIC_EXPLANATION}
    >
      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#006828] text-white">
        <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
      </span>
      Verified
    </span>
  );
}

export function VerifiedClinicTrustStrip({ className = "" }: { className?: string }) {
  const items = [
    {
      icon: BadgeCheck,
      label: "Clinic collaboration",
      helper: "The clinic has worked with Zavis to review this profile.",
    },
    {
      icon: ClipboardCheck,
      label: "Information confirmed",
      helper: "Core details such as location, contact routes, services, and photos have been checked.",
    },
    {
      icon: ShieldCheck,
      label: "Owner-led updates",
      helper: "Future profile edits are routed through the clinic owner or an approved representative.",
    },
  ];

  return (
    <section
      className={`rounded-2xl border border-[#006828]/20 bg-[linear-gradient(135deg,#f3fbf6_0%,#ffffff_58%,#eef9f2_100%)] p-5 shadow-[0_18px_48px_rgba(0,104,40,0.12)] ${className}`}
      aria-label="Verified clinic profile"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#006828] text-white shadow-[0_0_0_6px_rgba(0,104,40,0.11),0_14px_28px_rgba(0,104,40,0.22)]">
            <BadgeCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <p className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
              Verified
            </p>
            <p className="mt-1 max-w-2xl font-['Geist',sans-serif] text-xs leading-relaxed text-black/50">
              {VERIFIED_CLINIC_EXPLANATION}
            </p>
          </div>
        </div>
        <VerifiedClinicBadge variant="table" className="self-start sm:self-center" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-[#006828]/10 bg-white px-3 py-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#006828]" aria-hidden="true" />
                <p className="font-['Geist',sans-serif] text-xs font-semibold text-[#1c1c1c]">
                  {item.label}
                </p>
              </div>
              <p className="mt-1 font-['Geist',sans-serif] text-[11px] leading-relaxed text-black/45">
                {item.helper}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
