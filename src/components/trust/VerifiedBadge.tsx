/**
 * VerifiedBadge — reusable trust tier indicator
 *
 * Part of Zocdoc→Zavis Roadmap Item 7. Ships alongside the `/verified-reviews`
 * policy page so the directory has a single canonical component ready when
 * the verification system actually launches (target: Q3 2026).
 *
 * Until then: DO NOT render this component on any public provider listing.
 * The `/verified-reviews` policy page is its only current consumer, and it
 * renders each tier inside an explanatory section so the visual language is
 * introduced to users before any badge ever appears next to a real provider.
 *
 * Design: TC/Zavis tokens only — `accent` (#006828), `dark` (#1c1c1c),
 * `light-100`, `light-200`, `font-sans`, `font-mono`. No external SVG files;
 * every icon is inline so the badge is safe for server components and for
 * Arabic RTL mirroring with no path-ordering gotchas.
 */
import type { ReactNode } from "react";

export type VerifiedTier =
  | "visit"
  | "prescription"
  | "gold"
  | "editorial"
  | "license";

export type VerifiedBadgeSize = "sm" | "md" | "lg";

interface VerifiedBadgeProps {
  tier: VerifiedTier;
  size?: VerifiedBadgeSize;
  /**
   * Compact renders only the icon + short label (e.g. for list cards).
   * Non-compact renders icon + long label + tier blurb (for detail rows).
   */
  compact?: boolean;
  /**
   * Optional locale override — "ar" swaps to Arabic labels. Defaults to "en".
   * The component itself does not set `dir`; parent layout owns that.
   */
  locale?: "en" | "ar";
  className?: string;
}

interface TierDef {
  labelEn: string;
  labelAr: string;
  shortEn: string;
  shortAr: string;
  blurbEn: string;
  blurbAr: string;
  /** Background tint class (light family). */
  bg: string;
  /** Solid foreground class (text + icon stroke). */
  fg: string;
  /** Border class. */
  border: string;
  icon: ReactNode;
}

const ICON_CHECK = (
  <path
    d="M5 12l4 4L19 6"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />
);
const ICON_DOC = (
  <>
    <path
      d="M7 3h7l4 4v14H7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M14 3v4h4M9 13h6M9 17h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </>
);
const ICON_STAR = (
  <path
    d="M12 3l2.6 5.4 5.9.9-4.3 4.2 1 5.9L12 16.7 6.8 19.4l1-5.9L3.5 9.3l5.9-.9z"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    fill="none"
  />
);
const ICON_PEN = (
  <>
    <path
      d="M4 20l4-1 11-11-3-3L5 16z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M13 5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>
);
const ICON_SHIELD = (
  <>
    <path
      d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </>
);

const TIERS: Record<VerifiedTier, TierDef> = {
  visit: {
    labelEn: "Verified Visit",
    labelAr: "زيارة موثقة",
    shortEn: "Verified Visit",
    shortAr: "زيارة موثقة",
    blurbEn:
      "Patient proved they actually visited the provider via SMS-OTP, QR code, or insurance claim.",
    blurbAr:
      "أثبت المريض زيارته الفعلية للمنشأة عبر رمز التحقق، أو رمز QR، أو مطالبة تأمين.",
    bg: "bg-[#006828]/10",
    fg: "text-[#006828]",
    border: "border-[#006828]/30",
    icon: ICON_CHECK,
  },
  prescription: {
    labelEn: "Verified Prescription",
    labelAr: "وصفة موثقة",
    shortEn: "Verified Rx",
    shortAr: "وصفة موثقة",
    blurbEn:
      "Patient uploaded a PII-redacted prescription or discharge summary confirming treatment.",
    blurbAr:
      "قام المريض برفع وصفة طبية أو ملخص خروج بعد إخفاء البيانات الشخصية لإثبات العلاج.",
    bg: "bg-[#1c1c1c]/5",
    fg: "text-[#1c1c1c]",
    border: "border-[#1c1c1c]/20",
    icon: ICON_DOC,
  },
  gold: {
    labelEn: "Zavis Gold",
    labelAr: "زافيس جولد",
    shortEn: "Zavis Gold",
    shortAr: "زافيس جولد",
    blurbEn:
      "Insurer-surfaced and co-branded: the payer has independently confirmed the provider meets network quality criteria.",
    blurbAr:
      "موصى به من قِبل شركة التأمين ومشارَك التوسيم: أكد المؤمِّن استقلالياً أن المنشأة تستوفي معايير جودة الشبكة.",
    bg: "bg-[#b88a00]/10",
    fg: "text-[#8a6700]",
    border: "border-[#b88a00]/40",
    icon: ICON_STAR,
  },
  editorial: {
    labelEn: "Editorial Review",
    labelAr: "مراجعة تحريرية",
    shortEn: "Editorial",
    shortAr: "تحريرية",
    blurbEn:
      "The Zavis editorial team has reviewed this provider's claim history, credentials, and public record.",
    blurbAr:
      "راجع فريق زافيس التحريري سجل ادعاءات هذه المنشأة، ووثائق اعتمادها، وسجلها العام.",
    bg: "bg-[#2a2a2a]/5",
    fg: "text-[#2a2a2a]",
    border: "border-[#2a2a2a]/20",
    icon: ICON_PEN,
  },
  license: {
    labelEn: "License Verified",
    labelAr: "ترخيص موثق",
    shortEn: "License",
    shortAr: "ترخيص",
    blurbEn:
      "Zavis confirmed a current, active DHA, DOH, or MOHAP license number for this provider.",
    blurbAr:
      "تحقق زافيس من رقم ترخيص ساري المفعول من DHA أو DOH أو MOHAP لهذه المنشأة.",
    bg: "bg-[#006828]/5",
    fg: "text-[#004d1e]",
    border: "border-[#006828]/25",
    icon: ICON_SHIELD,
  },
};

const SIZE_MAP: Record<
  VerifiedBadgeSize,
  { wrap: string; icon: number; label: string; blurb: string }
> = {
  sm: {
    wrap: "px-2 py-1 gap-1.5 text-[11px]",
    icon: 12,
    label: "text-[11px] font-medium",
    blurb: "text-[10px]",
  },
  md: {
    wrap: "px-2.5 py-1.5 gap-2 text-xs",
    icon: 14,
    label: "text-xs font-medium",
    blurb: "text-[11px]",
  },
  lg: {
    wrap: "px-3 py-2 gap-2.5 text-sm",
    icon: 18,
    label: "text-sm font-semibold",
    blurb: "text-xs",
  },
};

export function VerifiedBadge({
  tier,
  size = "md",
  compact = false,
  locale = "en",
  className = "",
}: VerifiedBadgeProps) {
  const def = TIERS[tier];
  const sz = SIZE_MAP[size];
  const label = locale === "ar" ? def.labelAr : def.labelEn;
  const shortLabel = locale === "ar" ? def.shortAr : def.shortEn;
  const blurb = locale === "ar" ? def.blurbAr : def.blurbEn;
  const shownLabel = compact ? shortLabel : label;
  const a11y = locale === "ar" ? `${label}: ${blurb}` : `${label}: ${blurb}`;

  return (
    <span
      role="img"
      aria-label={a11y}
      title={blurb}
      className={[
        "inline-flex items-center rounded-full border font-['Geist',sans-serif]",
        def.bg,
        def.fg,
        def.border,
        sz.wrap,
        className,
      ].join(" ")}
    >
      <svg
        width={sz.icon}
        height={sz.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="shrink-0"
      >
        {def.icon}
      </svg>
      <span className={sz.label}>{shownLabel}</span>
      {!compact && (
        <span className={`${sz.blurb} opacity-70 hidden sm:inline`}>
          {locale === "ar" ? "" : ""}
        </span>
      )}
    </span>
  );
}

/**
 * Static metadata for the 5 tiers — exported so the `/verified-reviews` policy
 * page (and its Arabic mirror) can render a canonical tier table without
 * duplicating the label/blurb strings.
 */
export const VERIFIED_TIERS: Array<{
  tier: VerifiedTier;
  labelEn: string;
  labelAr: string;
  blurbEn: string;
  blurbAr: string;
}> = (Object.keys(TIERS) as VerifiedTier[]).map((tier) => ({
  tier,
  labelEn: TIERS[tier].labelEn,
  labelAr: TIERS[tier].labelAr,
  blurbEn: TIERS[tier].blurbEn,
  blurbAr: TIERS[tier].blurbAr,
}));
