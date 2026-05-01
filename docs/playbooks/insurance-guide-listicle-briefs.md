# Insurance Guide Listicles — Content Briefs for Editorial Team

**For:** Phase 3 of `docs/playbooks/insurance-seo-strategy-plan.md`
**Author of briefs:** Claude Opus, 2026-05-02
**Author of final content:** Editorial team (per user direction)

---

## How to use these briefs

Each brief below is a content spec, not a draft. The editorial team:
1. Picks a brief
2. Writes 800–1500 words following the structure outlined
3. Adds the comparison table where indicated (real data, not placeholders)
4. Adds the 3–5 internal links to existing `/insurance/[insurer]` pages
5. Adds the 2–3 internal links to `/best/[city]/[category]/accepting/[insurer]` Phase 2 pages (eligible combos only)
6. Submits for review — Claude / engineering does SEO/wiring QA before merge

The destination is the existing inline `GUIDES` array in `src/app/(directory)/insurance/guide/[slug]/page.tsx` — same format as existing entries (`maternity-insurance-uae`, `freelancer-health-insurance`, etc.).

---

## Slug 1: `walk-in-clinic-insurance`

**Target query:** "UAE walk-in clinics insurance" / "walk-in doctor accepts insurance Dubai"
**Search intent:** Patient looking for same-day care without an appointment, wants to know which insurance plans direct-bill at walk-in clinics.
**Word count:** 1000–1200
**Structure:**
1. **Hook (100 words):** What "walk-in" means in the UAE context — distinct from emergency, distinct from booked appointments. Most expats discover walk-ins after-hours.
2. **The acceptance landscape (250 words):** Daman Enhanced, Sukoon, AXA, Cigna, Allianz, MetLife, Bupa Global accept at most walk-in chains. Aster Walk-In, Mediclinic Express, NMC ProVita, Zulekha Express. Mention typical co-pay for walk-in (often higher than booked).
3. **Comparison table:** Insurer × walk-in chain (5×6 grid). Data: which insurer is direct-billed at which chain. Editorial team should source from each chain's published billing list.
4. **Best for "no appointment Daman" / "after-hours Cigna" / etc. (300 words):** Practical breakdowns by insurer.
5. **Pricing without insurance (150 words):** Typical walk-in consult cost AED 150–500.
6. **What to bring (100 words):** Insurance card, EID, prior records.
7. **FAQ (100 words):** 3–4 Q&As.
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/cigna`, `/insurance/axa`, `/insurance/allianz-care`, `/insurance/sukoon`
- `/best/dubai/clinics/accepting/daman-enhanced`, `/best/abu-dhabi/clinics/accepting/daman-enhanced`

---

## Slug 2: `direct-billing-insurance-uae`

**Target query:** "direct billing insurance UAE" / "no claim form insurance Dubai"
**Word count:** 1000–1200
**Structure:**
1. **Hook (100 words):** Why direct billing matters — patient pays only co-pay, not full bill upfront. Reimbursement claims take 2–6 weeks.
2. **How direct billing works (300 words):** TPA (Third-Party Administrator) role. Daman, NEXtCARE, MedNet are the three biggest TPAs in UAE.
3. **Insurers with widest direct-billing networks (350 words):** Daman Enhanced (1500+ providers), Sukoon (1800+), AXA Gulf (1200+), Cigna (premium tier), Bupa Global (premium tier).
4. **Comparison table:** Insurer × network depth × TPA × pre-auth strictness.
5. **What can break direct billing (150 words):** Plan exclusions, missed pre-auth, out-of-network providers, walk-in centres not in scheme.
6. **FAQ (150 words):** 4–5 Q&As covering "what if my clinic isn't in network", "what if I'm refused billing at the desk", "TPA vs insurer".
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/cigna`, `/insurance/sukoon`, `/insurance/axa`, `/insurance/bupa-global`
- `/best/dubai/clinics/accepting/daman-enhanced`, `/best/abu-dhabi/hospitals/accepting/cigna`

---

## Slug 3: `same-day-claims-insurance`

**Target query:** "fast claim turnaround UAE insurance" / "quickest insurance reimbursement Dubai"
**Word count:** 800–1000
**Structure:**
1. **Hook (100 words):** Why claim speed matters for cash-flow — long turnaround can be 4–6 weeks, fast TPAs settle in 5–10 days.
2. **What "same-day" actually means (150 words):** Direct billing is true same-day (zero-claim flow). Reimbursement claims are different.
3. **TPA-by-TPA breakdown (300 words):** NEXtCARE, MedNet, Almoosa, NAS — typical settlement times.
4. **Insurer-by-insurer (300 words):** Top 6 insurers ranked by claim turnaround.
5. **How to file a faster claim (150 words):** Itemized bill, original receipts, doctor's notes, online portal vs paper.
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/cigna`, `/insurance/metlife`, `/insurance/allianz-care`

---

## Slug 4: `dental-insurance-uae-2026`

**Target query:** "best dental insurance UAE" / "Daman dental coverage" / "dental insurance Dubai expat"
**Word count:** 1200–1500
**Structure:**
1. **Hook (150 words):** Dental is rarely fully covered. Most plans sub-limit to AED 2,000–5,000 annually.
2. **What's typically covered (300 words):** Cleanings, fillings, X-rays, simple extractions. NOT covered: cosmetic, orthodontics (most plans), implants (most plans).
3. **By-insurer dental breakdown (400 words):** Daman Enhanced, Sukoon Gold, AXA Premium, Cigna Premier, Bupa Global Lifeline, Allianz Premier, MetLife.
4. **Comparison table:** Insurer × annual dental sub-limit × ortho × implants × cosmetic.
5. **Standalone dental insurance (200 words):** Dawak, Cigna Dental Standalone — for users who don't want a full medical plan.
6. **Tips for getting dental approved (200 words):** Pre-auth, cost transparency, treatment plans.
7. **FAQ (150 words).**
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/sukoon`, `/insurance/axa`, `/insurance/cigna`, `/insurance/bupa-global`
- `/best/dubai/dental/accepting/daman-enhanced`, `/best/abu-dhabi/dental/accepting/sukoon`

---

## Slug 5: `chronic-disease-coverage-uae`

**Target query:** "diabetes insurance UAE" / "chronic disease coverage Dubai" / "hypertension insurance"
**Word count:** 1000–1200
**Structure:**
1. **Hook (150 words):** UAE has high chronic disease prevalence (~17% diabetes, ~30% hypertension). Coverage matters.
2. **Mandatory coverage (200 words):** EBP / Basic Plans — what they cover for chronic disease.
3. **Pre-existing condition rules (250 words):** Most plans exclude for the first 12 months. Some carriers waive with employer-paid plans.
4. **Best plans for diabetes (300 words):** Insulin coverage, glucometer strips, endocrinologist visits, retinal screening.
5. **By-insurer breakdown (200 words):** Daman, Sukoon, Cigna, MetLife, Allianz.
6. **FAQ (150 words).**
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/sukoon`, `/insurance/cigna`, `/insurance/metlife`

---

## Slug 6: `outpatient-vs-inpatient-uae`

**Target query:** "outpatient inpatient difference UAE insurance"
**Word count:** 800–1000
**Structure:**
1. **Hook (100 words):** Outpatient = day visit, inpatient = ≥1 night stay. Coverage differs dramatically.
2. **Outpatient coverage (250 words):** Co-pay 10–20% typical, capped at AED 500–1,500 annually.
3. **Inpatient coverage (250 words):** Co-pay 0% on most enhanced plans, room category limits, pre-auth required.
4. **The grey area: day surgery (200 words):** Some insurers classify as outpatient, others inpatient. Check plan.
5. **By-tier comparison (150 words):** Basic vs Enhanced vs Premium across the major insurers.
6. **FAQ (100 words).**
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/cigna`, `/insurance/axa`, `/insurance/bupa-global`

---

## Slug 7: `expat-vs-resident-insurance`

**Target query:** "expat health insurance UAE" / "do I need UAE insurance as a tourist" / "visit visa insurance"
**Word count:** 1000–1200
**Structure:**
1. **Hook (150 words):** UAE residents must have insurance (legal requirement). Expats on visit visa: separate rules.
2. **What's mandatory (250 words):** Abu Dhabi: mandatory since 2007. Dubai: mandatory since 2014. Northern Emirates: phasing in.
3. **Resident plans (300 words):** Daman Enhanced, Sukoon, AXA — designed for residents and dependents.
4. **Expat-mobile plans (250 words):** Cigna Global, Bupa Global, Aetna International, Allianz Care — designed for moving abroad.
5. **Visit visa insurance (200 words):** Mandatory since 2018. Daman, Salama, Allianz offer day-rate covers.
6. **FAQ (150 words).**
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/cigna`, `/insurance/bupa-global`, `/insurance/aetna-international`, `/insurance/allianz-care`

---

## Slug 8: `top-up-insurance-uae`

**Target query:** "top up insurance UAE" / "supplement Daman Thiqa" / "additional cover above DHA basic"
**Word count:** 800–1000
**Structure:**
1. **Hook (150 words):** When DHA Basic / Daman Basic isn't enough — top-ups extend coverage.
2. **Why top up (250 words):** Basic plans cap at AED 150,000 annual. Most expat families need AED 500,000+ for serious illness.
3. **Top-up product types (300 words):** Group enhanced (employer-paid), individual top-up, international top-up.
4. **By-insurer top-up offerings (250 words):** Daman top-ups, Sukoon supplementary, AXA enhanced overlay.
5. **FAQ (150 words).**
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/sukoon`, `/insurance/axa`

---

## Slug 9: `mandatory-health-insurance-emirates`

**Target query:** "mandatory health insurance UAE" / "Dubai insurance law" / "Abu Dhabi insurance requirement"
**Word count:** 1000–1200
**Structure:**
1. **Hook (150 words):** Each emirate has its own rules. Federal law mandates insurance for residents but enforcement is per-emirate.
2. **Abu Dhabi mandate (250 words):** 2007 law. EBP, Thiqa, employer-paid. AED 500–1,000 fines.
3. **Dubai mandate (250 words):** 2014 law (DHA). EBP for low-income workers, Enhanced for everyone else.
4. **Sharjah & Northern Emirates (250 words):** Phased rollout 2025–2026. Limited mandate today.
5. **What happens without insurance (200 words):** Visa renewal blocked, fines, treatment refusal at non-emergency private facilities.
6. **FAQ (150 words).**
**Internal links:**
- `/insurance/daman-basic`, `/insurance/daman-enhanced`, `/insurance/thiqa`

---

## Slug 10: `insurance-claim-process-uae`

**Target query:** "how to file insurance claim UAE" / "Daman reimbursement form" / "Cigna claim Dubai"
**Word count:** 1000–1200
**Structure:**
1. **Hook (150 words):** Claim filing is the part most people don't think about until they need it. Get it wrong, get rejected.
2. **Direct billing vs reimbursement (200 words):** When each applies.
3. **Step-by-step reimbursement claim (350 words):** (1) collect itemized invoice, (2) original receipts, (3) doctor's diagnosis report, (4) prescription, (5) submit via portal/app, (6) wait 15–30 days, (7) escalation if rejected.
4. **Common rejection reasons (200 words):** Missing pre-auth, out-of-network, plan exclusion, late filing (90-day window).
5. **By-insurer process (200 words):** Daman portal, Sukoon app, Cigna eClaims, AXA online.
6. **FAQ (150 words).**
**Internal links:**
- `/insurance/daman-enhanced`, `/insurance/cigna`, `/insurance/sukoon`, `/insurance/axa`

---

## Editorial QA checklist (run before merge)

- [ ] All 10 slugs added to `GUIDES` array in `src/app/(directory)/insurance/guide/[slug]/page.tsx`
- [ ] Each entry has `slug`, `title`, `description`, `lastUpdated`, `body` (markdown / JSX)
- [ ] Each comparison table uses real data (verified against insurer's published 2026 product sheets)
- [ ] Each guide has `<JsonLd data={faqPageSchema(...)}>` for the FAQ
- [ ] Each guide has 3–5 `/insurance/[insurer]` internal links and 2–3 `/best/[city]/[category]/accepting/[insurer]` Phase 2 links (Phase 2 links must be against the eligible combos in `TRI_FACET_*_ALLOW`)
- [ ] hreflang alternates if AR translation exists; skip if no AR mirror
- [ ] Sitemap auto-includes via existing `INSURANCE_GUIDE_SLUGS` array in `src/app/sitemap.ts:48` — add new slugs there
- [ ] Slug naming: kebab-case, no year suffix unless time-sensitive (matches existing pattern)
