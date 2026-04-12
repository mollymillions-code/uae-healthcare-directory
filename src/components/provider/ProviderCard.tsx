import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Accessibility, ShieldCheck, BadgeCheck, Quote } from "lucide-react";
import { getCategoryImagePath } from "@/lib/helpers";
import { CATEGORIES } from "@/lib/constants/categories";

function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

// ─── Types (a strict subset of LocalProvider fields the card may render) ──
// Keeping these as individual props (not a full LocalProvider) preserves
// tree-shaking + lets the existing call sites in the catch-all pass the
// same minimal set. New decision-card fields are all optional.

interface ProviderCardProps {
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  shortDescription?: string | null;
  googleRating?: string | null;
  googleReviewCount?: number | null;
  isClaimed?: boolean | null;
  isVerified?: boolean | null;
  basePath?: string;

  // Decision-card fields (all optional — every chip gates on truthy data).
  insurance?: string[] | null;
  languages?: string[] | null;
  services?: string[] | null;
  operatingHours?: Record<string, { open: string; close: string }> | null;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  } | null;
  reviewSnippet?: string | null;
  // Set to true for GCC (qa/sa/bh/kw) providers whose Arabic
  // counterpart pages do not exist. Without this, the card emits a
  // "عربي" link to /ar/directory/{city}/… which would 404.
  hideCounterpart?: boolean;
}

// ─── Open-now surrogate ────────────────────────────────────────────────────
// Minimum-viable "open / closing soon / opens" badge computed from
// operatingHours. Returns null when hours data is unparseable. Uses the
// viewer's clock, not a server-authoritative time — callers that need exact
// provider local time should re-compute client-side.

type OpenState =
  | { kind: "open"; label: string; tone: "green" | "amber" }
  | { kind: "closed"; label: string; tone: "gray" }
  | null;

const DAY_KEY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABEL: Record<(typeof DAY_KEY_ORDER)[number], string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

function toMinutes(s: string | undefined | null): number | null {
  if (!s) return null;
  const raw = String(s).trim().toLowerCase();
  // 24-hour: "HH:MM"
  const h24 = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (h24) {
    const h = Number(h24[1]);
    const m = Number(h24[2]);
    if (h >= 0 && h <= 24 && m >= 0 && m < 60) return h * 60 + m;
  }
  // 12-hour: "H(:MM)? AM|PM"
  const h12 = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/.exec(raw);
  if (h12) {
    let h = Number(h12[1]);
    const m = Number(h12[2] ?? "0");
    const ap = h12[3];
    if (h < 1 || h > 12 || m < 0 || m >= 60) return null;
    if (ap === "am" && h === 12) h = 0;
    if (ap === "pm" && h !== 12) h += 12;
    return h * 60 + m;
  }
  return null;
}

/**
 * Normalize a raw day key ("mon", "Monday", "MONDAY") to the 3-letter lowercase
 * key we use for lookups. Returns null on unrecognized keys.
 */
function normalize3(k: string): (typeof DAY_KEY_ORDER)[number] | null {
  const raw = k.trim().toLowerCase();
  const short = raw.slice(0, 3);
  return (DAY_KEY_ORDER as readonly string[]).includes(short)
    ? (short as (typeof DAY_KEY_ORDER)[number])
    : null;
}

function computeOpenNow(
  hours: Record<string, { open: string; close: string }> | null | undefined
): OpenState {
  if (!hours) return null;
  const entries = Object.entries(hours);
  if (entries.length === 0) return null;

  // Normalize into a 3-letter keyed map.
  const normalized: Partial<Record<(typeof DAY_KEY_ORDER)[number], { o: number; c: number }>> = {};
  for (const [k, v] of entries) {
    const day = normalize3(k);
    if (!day || !v) continue;
    const o = toMinutes(v.open);
    const c = toMinutes(v.close);
    if (o == null || c == null) continue;
    normalized[day] = { o, c };
  }
  if (Object.keys(normalized).length === 0) return null;

  const now = new Date();
  const todayIdx = now.getDay(); // 0..6 Sun..Sat
  const todayKey = DAY_KEY_ORDER[todayIdx];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = normalized[todayKey];

  if (today) {
    const { o, c } = today;
    // 24-hour window.
    if (o === 0 && c >= 23 * 60 + 59) {
      return { kind: "open", label: "Open 24 hours", tone: "green" };
    }
    // Overnight: close < open means wrap past midnight.
    const openNow =
      c > o ? nowMin >= o && nowMin < c : nowMin >= o || nowMin < c;
    if (openNow) {
      const mins = c > o ? c - nowMin : (c + 24 * 60 - nowMin) % (24 * 60);
      if (mins > 0 && mins <= 60) {
        return { kind: "open", label: `Closes in ${mins} min`, tone: "amber" };
      }
      if (mins > 60 && mins <= 180) {
        const h = Math.round(mins / 60);
        return { kind: "open", label: `Closes in ${h}h`, tone: "amber" };
      }
      return { kind: "open", label: "Open now", tone: "green" };
    }
  }

  // Find the next day that has a window.
  for (let step = 1; step <= 7; step++) {
    const nextIdx = (todayIdx + step) % 7;
    const nextKey = DAY_KEY_ORDER[nextIdx];
    const next = normalized[nextKey];
    if (!next) continue;
    const hh = Math.floor(next.o / 60);
    const mm = next.o % 60;
    const pm = hh >= 12;
    const display = `${((hh + 11) % 12) + 1}${mm > 0 ? `:${String(mm).padStart(2, "0")}` : ""}${pm ? "pm" : "am"}`;
    const dayLabel = step === 1 ? "tomorrow" : DAY_LABEL[nextKey];
    return { kind: "closed", label: `Opens ${dayLabel} ${display}`, tone: "gray" };
  }
  return { kind: "closed", label: "Closed", tone: "gray" };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ProviderCard({
  name, slug, citySlug, categorySlug, address, phone,
  shortDescription, googleRating, googleReviewCount, isClaimed, isVerified,
  insurance, languages, services, operatingHours, accessibilityOptions,
  reviewSnippet,
  basePath = "/directory",
  hideCounterpart = false,
}: ProviderCardProps) {
  const rating = Number(googleRating) || 0;
  const reviewCount = Number(googleReviewCount) || 0;
  const category = getCategoryBySlug(categorySlug);
  const categoryName = category?.name || categorySlug;

  // Gating. A chip only renders when its source data is truthy.
  const showStars = rating >= 3 && reviewCount >= 3; // Codex schema discipline
  const showLowConfidence = rating > 0 && reviewCount > 0 && reviewCount < 3;
  const openState = computeOpenNow(operatingHours ?? null);
  const topInsurance = (insurance ?? []).filter(Boolean).slice(0, 3);
  const moreInsurance = Math.max(0, (insurance ?? []).length - topInsurance.length);
  const topLanguages = (languages ?? []).filter(Boolean).slice(0, 2);
  const topServices = (services ?? []).filter(Boolean).slice(0, 3);
  const wheelchair = Boolean(
    accessibilityOptions?.wheelchairAccessibleEntrance ||
      accessibilityOptions?.wheelchairAccessibleParking ||
      accessibilityOptions?.wheelchairAccessibleRestroom ||
      accessibilityOptions?.wheelchairAccessibleSeating
  );

  const href = `${basePath}/${citySlug}/${categorySlug}/${slug}`;
  // Cross-language counterpart path for the internal-link graph. On an
  // English card we point at the Arabic profile; on an Arabic card we
  // point back at the English profile. This adds one visible anchor to
  // the counterpart locale per card, which multiplied across every hub
  // gives Googlebot a real PageRank path into /ar/ instead of relying on
  // the single header button + sitemap submission.
  const isArabicCard = basePath === "/ar/directory";
  const counterpartHref = isArabicCard
    ? `/directory/${citySlug}/${categorySlug}/${slug}`
    : `/ar/directory/${citySlug}/${categorySlug}/${slug}`;
  const counterpartLabel = isArabicCard ? "English" : "عربي";
  const counterpartAria = isArabicCard
    ? `View ${name} in English`
    : `عرض ${name} بالعربية`;

  const openToneClass =
    openState?.tone === "green"
      ? "bg-[#006828]/[0.08] text-[#006828]"
      : openState?.tone === "amber"
      ? "bg-amber-500/[0.12] text-amber-700"
      : "bg-black/[0.04] text-black/50";

  return (
    // The whole card is clickable via the main Link's ::before pseudo
    // overlay (see below). The outer element is an <article>, NOT a
    // <Link>, because we need a second sibling <Link> inside for the
    // cross-language crawl anchor — nested <a> is invalid HTML and
    // React would either strip it or throw a hydration error.
    <article
      className="group relative bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 hover:-translate-y-0.5 transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#006828] focus-within:ring-offset-2"
    >
      {/* Top row: facility tag + rating badge */}
      <div className="flex items-center justify-between gap-2 mb-2 pointer-events-none">
        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">
          {categoryName}
        </span>
        {showStars && (
          <span
            className="inline-flex items-center gap-1 bg-[#006828] text-white text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]"
            aria-label={`${googleRating} out of 5 based on ${reviewCount.toLocaleString()} Google reviews`}
          >
            <span aria-hidden="true">{googleRating}</span>
            <span aria-hidden="true">★</span>
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 pointer-events-none">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl">
          <Image
            src={getCategoryImagePath(categorySlug)}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors truncate tracking-tight">
              {/* Main clickable link. The `before:` pseudo element makes
                  the whole card clickable. `pointer-events-auto` is
                  applied so the Link itself is focusable (the parent
                  flex row has pointer-events-none for click pass-through
                  to the overlay). */}
              <Link
                href={href}
                className="pointer-events-auto outline-none before:absolute before:inset-0 before:rounded-2xl before:content-['']"
                aria-label={`${name} — ${categoryName}`}
              >
                {name}
              </Link>
            </h3>
            {isVerified && (
              <span
                className="inline-flex items-center gap-0.5 bg-[#006828]/[0.08] text-[#006828] text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]"
                aria-label="Verified by Zavis"
              >
                <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
                Verified
              </span>
            )}
            {isClaimed && !isVerified && (
              <span
                className="inline-flex items-center gap-0.5 bg-black/[0.05] text-black/60 text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]"
                aria-label="Listing claimed by provider"
              >
                <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
                Claimed
              </span>
            )}
          </div>

          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-1 line-clamp-1">{address}</p>

          {/* Rating + review-count row (text-level, not pill) */}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {showStars ? (
              <span className="font-['Geist',sans-serif] text-xs font-medium text-[#006828]">
                {googleRating} ★{" "}
                <span className="text-black/30 font-normal">
                  ({reviewCount.toLocaleString()} reviews)
                </span>
              </span>
            ) : showLowConfidence ? (
              <span className="font-['Geist',sans-serif] text-xs text-black/30">
                Not enough ratings yet
              </span>
            ) : null}
            {phone && (
              <span className="font-['Geist',sans-serif] text-xs text-black/30 truncate">
                {phone}
              </span>
            )}
          </div>

          {/* Open-now surrogate */}
          {openState && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif] ${openToneClass}`}
                role="status"
                aria-label={openState.label}
              >
                {openState.label}
              </span>
            </div>
          )}

          {/* Review snippet — gated */}
          {reviewSnippet && showStars && (
            <div className="mt-2 flex items-start gap-1.5">
              <Quote className="h-3 w-3 text-[#006828]/40 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="font-['Geist',sans-serif] text-xs text-black/50 italic line-clamp-1">
                {reviewSnippet}
              </p>
            </div>
          )}

          {/* Short description — only when we don't already have a snippet */}
          {!reviewSnippet && shortDescription && (
            <p className="font-['Geist',sans-serif] text-xs text-black/30 line-clamp-1 mt-1.5">
              {shortDescription}
            </p>
          )}

          {/* Insurance chips */}
          {topInsurance.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Accepted insurance">
              {topInsurance.map((ins) => (
                <span
                  key={ins}
                  className="inline-block bg-[#006828]/[0.06] text-[#006828] text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif] truncate max-w-[90px]"
                  title={ins}
                >
                  {ins}
                </span>
              ))}
              {moreInsurance > 0 && (
                <span className="inline-block bg-black/[0.04] text-black/40 text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">
                  +{moreInsurance} more
                </span>
              )}
            </div>
          )}

          {/* Language chips + accessibility */}
          {(topLanguages.length > 0 || wheelchair) && (
            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
              {topLanguages.map((lang) => (
                <span
                  key={lang}
                  className="inline-block bg-black/[0.03] text-black/50 text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]"
                >
                  {lang}
                </span>
              ))}
              {wheelchair && (
                <span
                  className="inline-flex items-center gap-0.5 bg-black/[0.03] text-black/50 text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]"
                  aria-label="Wheelchair accessible"
                  role="img"
                >
                  <Accessibility className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
              )}
            </div>
          )}

          {/* Top services — inline text, no chips for overflow safety */}
          {topServices.length > 0 && (
            <p className="font-['Geist',sans-serif] text-[10px] text-black/40 mt-1.5 line-clamp-1">
              <span className="text-black/30">Services:</span> {topServices.join(" · ")}
            </p>
          )}
        </div>

        <ChevronRight
          className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0"
          aria-hidden="true"
        />
      </div>

      {/* Cross-language crawl anchor. Sits on top of the card's main
          clickable ::before overlay via `relative z-10` + explicit
          pointer-events, so its own click is not swallowed by the
          main provider link. This is the actual PageRank path into
          the counterpart locale — hreflang metadata alone does not
          transfer link equity. Suppressed for GCC providers whose
          Arabic counterpart pages do not exist. */}
      {!hideCounterpart && (
        <Link
          href={counterpartHref}
          className="relative z-10 pointer-events-auto mt-3 inline-block text-[10px] font-medium text-black/40 hover:text-[#006828] font-['Geist',sans-serif]"
          aria-label={counterpartAria}
        >
          {counterpartLabel}
        </Link>
      )}
    </article>
  );
}
