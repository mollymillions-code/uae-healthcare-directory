# Audit — CTA visibility issues across Zavis platform

**Date:** 2026-05-02
**Trigger:** User reported invisible "List your clinic via WhatsApp" CTA on zavis.ai landing page (white pill, no visible label).
**Scope:** All `OwnerWhatsappCta` call sites + similar variant-based color components on the platform.
**Status:** Local fixes applied. NOT pushed to production.

---

## Root cause: Tailwind class collision

Components like `OwnerWhatsappCta` define a `variant` prop with hardcoded color classes (e.g., `bg-[#006828] text-white` for primary). Some call sites tried to override these by passing `className="bg-white text-[#006828]..."`. Tailwind doesn't deduplicate conflicting utility classes — both end up in the rendered className string, and the CSS cascade picks the winner based on **rule order in the generated stylesheet**, not className string order.

In production, the variant's classes happen to win, producing green-on-green text = invisible label.

---

## Findings — 3 affected sites, 8 safe sites

### ❌ Confirmed bug — landing page (the user-reported issue)
**File:** [src/components/landing/pages/HomePageClient.tsx:389](src/components/landing/pages/HomePageClient.tsx#L389)
**Section:** "List your clinic on the Zavis directory" green block on /
**Symptom:** WhatsApp CTA button shows as a white pill with no visible label.
**Cause:** No `variant` prop → falls into default primary variant (`bg-[#006828] text-white`). Override className `"bg-white text-[#006828] hover:bg-white/90 ..."` adds a second conflicting bg + text class. Tailwind's CSS cascade gives variant the win.
**Fix applied:** added `variant="invert"` to the call (new variant, see below) + simplified className to layout-only.

### ⚠️ Subtle bug — directory footer
**File:** [src/components/layout/Footer.tsx:87](src/components/layout/Footer.tsx#L87)
**Section:** "Get listed or edit" link in the Directory column of the footer.
**Symptom:** Link likely renders green-on-dark instead of white-on-dark (the intended footer link styling).
**Cause:** `variant="link"` sets `text-[#006828]`. Override className `text-white/60 hover:text-white` collides. CSS cascade unpredictable.
**Fix applied:** added Tailwind important modifier (`!text-white/60 hover:!text-white`) to make the override deterministically win over the variant's color.

### ✅ False positive (initially flagged, then re-verified safe) — claim page hero
**File:** [src/app/(directory)/claim/page.tsx:155](src/app/(directory)/claim/page.tsx#L155)
**Why it's safe:** The OwnerWhatsappCta has no className override. The `bg-white text-ink` className I initially flagged was on a sibling `<a href="#how-it-works">` element ("Learn more"), not on the CTA. CTA renders as default primary (green pill) on the cream-background hero — visible.

---

## Other call sites — all safe

| File | Line | Status | Notes |
|---|---|---|---|
| `request-listing/page.tsx` | 95 | ✅ | No color override, default primary |
| `request-listing/page.tsx` | 212 | ✅ | No color override, default primary |
| `claim/[listingId]/page.tsx` | 67 | ✅ | No color override |
| `claim/[listingId]/page.tsx` | 123 | ✅ | No color override |
| `claim/page.tsx` | 298 | ✅ | No color override |
| `claim/page.tsx` | 468 | ✅ | No color override (on dark bg, but variant primary green is visible on dark) |
| `directory-v2/detail/BookingCard.tsx` | 161 | ✅ | `variant="link"`, no color collision |
| `directory/ProviderSidebarCta.tsx` | 125 | ✅ | Layout-only override (`w-full`), no color collision |
| `professionals/DoctorProfilePage.tsx` | 64 | ✅ | `variant="secondary"`, layout-only override |

---

## Other components scanned

Scanned all components in `src/components/` for the same pattern:
- Components with internal `variant` prop AND accepted `className` override
- Searched for `bg-white text-[#006828]` patterns and similar inverse-color combos

**Result:** Only `OwnerWhatsappCta` had the variant-color collision risk. All other instances of `bg-white text-[#006828]` were on plain HTML elements (`<span>`, `<a>`, `<button>`) without component-internal variant logic — those render as written, no collision.

---

## Structural fix applied

Added a fourth variant `invert` to `OwnerWhatsappCta`:

| Variant | Pattern | Use case |
|---|---|---|
| `primary` (default) | `bg-[#006828] text-white` | Light/cream backgrounds — main CTA |
| `secondary` | `bg-white border-black/10 text-ink` | Light backgrounds — softer call |
| **`invert` (NEW)** | **`bg-white text-[#006828]`** | **Dark/coloured section backgrounds** |
| `link` | `text-[#006828] underline` | Inline text links |

With this variant available, the "white pill on green section" pattern is now expressible without className overrides — eliminating the collision class of bug.

A doc comment in the component explains the bug history and tells future developers to use `variant="invert"` instead of overriding colors via className.

**Files changed (4):**
- [src/components/owner/OwnerWhatsappCta.tsx](src/components/owner/OwnerWhatsappCta.tsx) — added `invert` variant + doc
- [src/components/landing/pages/HomePageClient.tsx](src/components/landing/pages/HomePageClient.tsx) — landing page CTA uses `variant="invert"`
- [src/components/layout/Footer.tsx](src/components/layout/Footer.tsx) — footer link uses Tailwind `!important` to override variant color
- (no third app-side change — original audit incorrectly flagged claim page)

Lint clean. TypeScript clean (variant union type expanded to include `"invert"`).

---

## Per your direction

All changes LOCAL. No commits. No pushes. No deploys. Verify locally with `npm run dev` then visit:
- http://localhost:3000/ — landing page, scroll to "List your clinic" green section. Button should now read "List your clinic via WhatsApp" with green text on white pill.
- Directory footer (visible from any /directory/* page) — "Get listed or edit" link should now be white-on-dark like other footer links.

---

## Recommendation for the platform

The collision pattern is broader than this one component. Suggest adopting `tailwind-merge` (`twMerge`) across all components that have `className?: string` props alongside internal styling. `twMerge` deduplicates colliding utility classes deterministically (last one in the input wins). Adding it requires:

1. `npm install tailwind-merge`
2. Wrap rendered className strings in `twMerge(...)` in each multi-source-className component
3. Optionally add a `cn()` helper that combines `clsx` + `twMerge` for general-purpose use

This eliminates the entire bug class going forward without manual variant-by-variant fixes. About 15-20 components would benefit. Roughly 1-2 hours of focused work.
