import { BadgeCheck, ClipboardCheck, ShieldCheck } from "lucide-react";

interface VerifiedClinicBadgeProps {
  variant?: "card" | "hero" | "table" | "inline";
  className?: string;
}

const base =
  "inline-flex shrink-0 items-center font-['Geist',sans-serif] font-semibold";

export function VerifiedClinicBadge({
  variant = "card",
  className = "",
}: VerifiedClinicBadgeProps) {
  if (variant === "hero") {
    return (
      <span
        className={`${base} gap-2 rounded-full border border-white/35 bg-white px-3 py-1.5 text-xs text-[#006828] shadow-[0_12px_30px_rgba(0,104,40,0.26)] ring-1 ring-[#006828]/20 ${className}`}
        aria-label="Zavis Verified clinic profile"
        title="Zavis Verified clinic profile"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#006828] text-white shadow-[0_0_0_3px_rgba(0,104,40,0.14)]">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        Zavis Verified
      </span>
    );
  }

  if (variant === "table") {
    return (
      <span
        className={`${base} justify-center gap-1 rounded-full border border-[#006828]/15 bg-[#006828]/[0.07] px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#006828] ${className}`}
        aria-label="Zavis Verified"
        title="Zavis Verified"
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
        aria-label="Zavis Verified"
        title="Zavis Verified"
      >
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Verified
      </span>
    );
  }

  return (
    <span
      className={`${base} gap-1 rounded-full border border-[#006828]/15 bg-[#006828]/[0.07] px-2 py-0.5 text-[9px] text-[#006828] shadow-[0_6px_16px_rgba(0,104,40,0.10)] ${className}`}
      aria-label="Zavis Verified clinic profile"
      title="Zavis Verified clinic profile"
    >
      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#006828] text-white">
        <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
      </span>
      Zavis Verified
    </span>
  );
}

export function VerifiedClinicTrustStrip({ className = "" }: { className?: string }) {
  const items = [
    {
      icon: BadgeCheck,
      label: "Verified profile",
      helper: "This clinic has been marked verified in Zavis.",
    },
    {
      icon: ClipboardCheck,
      label: "Details reviewed",
      helper: "Core listing details are checked before the mark is shown.",
    },
    {
      icon: ShieldCheck,
      label: "Authorized updates",
      helper: "Clinic edits are routed through an owner or approved representative.",
    },
  ];

  return (
    <section
      className={`rounded-2xl border border-[#006828]/15 bg-[#f5fbf7] p-4 shadow-[0_16px_40px_rgba(0,104,40,0.08)] ${className}`}
      aria-label="Zavis Verified clinic signals"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#006828] text-white shadow-[0_0_0_5px_rgba(0,104,40,0.10)]">
            <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-['Bricolage_Grotesque',sans-serif] text-lg font-medium tracking-tight text-[#1c1c1c]">
              Zavis Verified clinic
            </p>
            <p className="font-['Geist',sans-serif] text-sm text-black/50">
              A higher-trust profile signal for clinics that complete verification.
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
