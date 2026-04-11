# Editorial Backlog — Trust Page Content Expansion

**Priority:** P0 (deploy-blocking for trust/YMYL credibility; NOT deploy-blocking for code correctness)
**Owner:** Editorial team
**Source:** Audit 3 (Content Quality) from `.ai-collab/ZOCDOC-SEO-QUALITY-GATE.md`
**Date:** 2026-04-11

## Context

Two public trust pages ship with word counts substantially below the 1,000-word target that Google's YMYL ("Your Money, Your Life") ranking guidance rewards. Both pages already exist as routes, compile clean, and emit valid JSON-LD. The gap is purely narrative depth.

These are **content-writing P0s**, not code P0s — Phase A and Phase B of the Zocdoc roadmap fix list resolved every code-level blocker. The code is deploy-ready. The pages below need editorial expansion before the site's "WCAG compliance", "methodology transparency", and "data sources disclosure" claims are fully credible to Google and to UAE enterprise buyers.

---

## P0 #12 — `/data-sources` page expansion

**File:** `src/app/(directory)/data-sources/page.tsx`
**Current state:** ~120 words of intro narrative + a table of data sources.
**Target:** ≥1,000 words of substantive narrative.
**Why it matters:** This is the single trust page Google's quality raters weight most heavily for a health directory. A table alone reads as machine-compiled; prose per source signals editorial stewardship.

### What to add (≥4 sections, ~200 words each)

**Section 1 — DHA Sheryan provider + professional register (UAE)**
- Fields we pull: facility name (EN/AR), license number, license type (FTL/REG), address, phone, specialty, discipline, parent facility.
- Fields we discard: internal DHA audit notes, license expiry dates under 30 days (to avoid staleness display), personal email/phone where not explicitly public.
- Licence terms: Sheryan is a public register maintained by the Dubai Health Authority. Zavis indexes publicly-available data without modification or endorsement.
- Re-pull cadence: full snapshot monthly; delta refresh weekly where feasible.
- Known gaps: DHA does not publish Arabic doctor names (all Arabic fields on Zavis doctor profiles are currently omitted for that reason).

**Section 2 — DOH Abu Dhabi + MOHAP Northern Emirates facility registers**
- Same format as above for DOH (Department of Health Abu Dhabi) and MOHAP (Ministry of Health and Prevention).
- DOH covers Abu Dhabi + Al Ain + Al Dhafra; MOHAP covers Sharjah/Ajman/RAK/UAQ/Fujairah.
- Note: Abu Dhabi publishes Arabic facility names in its open-data portal (unlike DHA).

**Section 3 — Dubai Pulse `dm_community-open` + Abu Dhabi Open Data (neighborhoods)**
- What this is: Dubai Municipality's open GeoJSON of 226 community polygons with bilingual names.
- How Zavis uses it: to populate the neighborhood taxonomy under `/directory/[city]/[area]/...` without relying on Google Places for bulk storage.
- Licence terms: Dubai Pulse Open License; attribution required on reuse.
- Similar section for Abu Dhabi Open Data Platform.

**Section 4 — Google Places attribution (last-resort geocoding only)**
- Why: when a DHA facility record has no lat/lng, we call Google's one-time geocoding API (not Places bulk storage) to resolve coordinates.
- What we do NOT do: cache Places business records, cache review text, display Places ratings as Zavis ratings, or build a competing Places-derived directory.
- Licence terms: the Google Places API terms permit one-time geocoding with attribution; all bulk storage is explicitly out of scope.

**Section 5 — OpenStreetMap (Northern Emirates fallback)**
- Where OSM helps: for admin_level 8/9/10 boundaries in Sharjah/Ajman/RAK/UAQ/Fujairah, where Dubai Pulse and Abu Dhabi Open Data don't apply.
- Licence: ODbL (share-alike); attribution on derived datasets.

**Section 6 — What Zavis never does**
- We do not buy facility lists from third parties.
- We do not generate facility records from Google Places.
- We do not scrape PropertyFinder, Bayut, or any commercial real-estate listing service.
- We do not synthesize reviews. Every Google rating displayed is clearly labeled as sourced from Google Maps Platform, not as a Zavis-curated review.

### Acceptance criteria
- Word count ≥1,000 in the body (excluding the existing data-source table at the bottom)
- No invented claims; every statistic cited by source
- Arabic mirror at `/ar/data-sources` must be a genuine translation, not the English text
- No change to the JSON-LD schema on the page (already valid)

---

## P0 #13 — `/about/corrections` page expansion

**File:** `src/app/(directory)/about/corrections/page.tsx`
**Current state:** ~403 words.
**Target:** ≥1,000 words.
**Why it matters:** Codex's "corrections policy" is Zavis's primary legal + reputation defense for the ~12,500 facility + ~65–75,000 doctor pages indexing from public registers. A thin corrections page reads as boilerplate; a detailed one positions Zavis as a responsible editorial operation.

### What to add

**Section 1 — How to report a correction**
- Preferred channel: `trust@zavis.ai` (existing).
- What to include in the report: the exact URL affected, the field in question, the corrected value, a brief reason, and any supporting link (DHA Sheryan portal URL, DOH profile page, etc.).
- How we triage on receipt (within 48 hours we acknowledge).

**Section 2 — SLA matrix per correction class**
- **Critical (provider impersonation, license falsification, factual medical harm):** same-day noindex + removal pending review, full response within 72 hours.
- **High (incorrect facility name, wrong license number, wrong address):** acknowledged within 48 hours, corrected within 5 business days.
- **Medium (outdated phone, outdated hours, outdated specialty):** corrected within 10 business days on the next data refresh cycle.
- **Low (translation polish, stylistic preference):** reviewed during quarterly editorial audits.

**Section 3 — The escalation chain**
- Level 1: editorial response via `trust@zavis.ai`.
- Level 2: legal review if the reporter disputes the correction outcome (route to `legal@zavis.ai`).
- Level 3: UAE Federal Decree Law No. 45 of 2021 (PDPL) right-to-erasure request handled separately via the dedicated DPO channel (see `/privacy-policy`).

**Section 4 — Example past corrections**
- Anonymized case log of 3-5 examples:
  - e.g. "Physician misattribution: Dr X was listed at Facility Y by DHA Sheryan before a facility change; the register updated in Q2 2026 and our next snapshot picked it up automatically. We also honored the direct correction request via `trust@zavis.ai` one week earlier."
  - e.g. "Facility name typo: an Arabic transliteration error was corrected within 3 business days; original listing noindex'd during review, restored on confirmation."
- If no corrections have been issued yet, state so transparently: "As of 2026-04-11, no corrections have been issued. This log will be updated as events occur."

**Section 5 — PDPL erasure linkage**
- Corrections and data-erasure requests are different workflows; corrections change the displayed value, erasure removes the record entirely.
- For erasure under PDPL Art. 12, use `dpo@zavis.ai` — the DPO will respond within the 30-day statutory window.
- Corrections do not require identity verification; erasure requests do.

**Section 6 — How corrections propagate**
- When a correction is accepted, the Zavis database is updated at the next scheduled refresh window (within 24 hours for the directory tables).
- The sitemap regenerates nightly; Google typically re-crawls affected URLs within 7-14 days.
- ISR cache invalidation runs hourly (per `revalidate: 3600`), so users see the corrected page faster than Googlebot.

**Section 7 — Our commitments**
- We will never silently edit a correction without logging it.
- We will never suppress a correction for a fee or advertising incentive.
- We will never represent a provider's paid "claim" as a verified correction (claim and correction are separate workflows).
- We will always cite the source of the correction in the internal audit trail.

### Acceptance criteria
- Word count ≥1,000
- Arabic mirror at `/ar/about/corrections` is a genuine translation
- Links to `trust@zavis.ai` and `dpo@zavis.ai` are real mailboxes (not placeholders) before deploy
- Corrections log section populates over time — it's OK to start empty

---

## Relationship to code deployment

**These content gaps are NOT deploy-blockers for the code.** Every code-level P0 from the Zocdoc SEO Quality Gate is resolved as of 2026-04-11. The site compiles clean (TSC + lint), all roadmap pages render, and the trust pages work — they just have less prose than the YMYL ceiling wants.

**Deploy decision:** deploy the code now if business conditions justify it; expand trust-page content in parallel. A 600-word methodology page is materially better than a missing methodology page. Google won't penalize; it just won't reward as heavily.

**If you want to hold deploy until trust content is expanded:** budget ~4-6 hours of editorial writing time per page. One editor can draft both in a single day. The code path doesn't need to change.

---

**Last updated:** 2026-04-11
**Owner:** Editorial desk (no code changes required)
