# Zavis Free Tools — Product Requirements (2026-05)

**Status:** Draft for review · Local only · Author: Claude Opus 4.7 · Date: 2026-05-02

## Strategic context

Five free B2B clinic-operator tools mounted under `/tools/*` on zavis.ai. Each ranks for queries that UAE clinic operators (insurance coordinators, practice managers, clinic owners) Google daily, captures their email, and funnels into a Zavis demo. The HubSpot/Ahrefs playbook adapted for UAE healthcare.

**Why this works for Zavis specifically:**
- Existing `/directory/*` SEO authority — internal links from a 17,000-listing directory accelerate ranking for `/tools/*` URLs
- Existing `/insurance/*` editorial coverage — these tools are the operational counterparts to the consumer-facing insurance content
- We already source from DHA/DOH/MOHAP — credibility on compliance topics is structurally higher than tools built by overseas SaaS

**Competitive moat:**
- Scanned 18 competitors (NexHealth, Weave, Solutionreach, Doctible, Insta, Practo, Medas, etc.). Only 4 run free tools, all US-only. MENA = zero clinic-side free tools. Pure greenfield.
- All 5 tools below are Arabic+English first-class. Existing competitors are English-only.

## Shared design principles (all tools)

- Mounted at `/tools/<slug>`. Optional `/ar/tools/<slug>` AR mirror.
- Use Zavis design tokens from `docs/design-templates.md`: Bricolage Grotesque headings, Geist body, `#006828` brand green, `#1c1c1c` ink, `#f8f8f6` cream background, `rounded-2xl` cards, `border-black/[0.06]` borders.
- Each tool follows a 3-section pattern: (1) hero with H1 + answer-block describing the tool, (2) the interactive widget, (3) supporting editorial — how to use it, common scenarios, what to do next.
- Email capture is opt-in, not required. Use the existing `/api/notify-demo` endpoint to capture leads.
- All static data tables (insurance codes, license-renewal calendars, template library) are hardcoded TS files — no DB, no API. Easy to review and ship.
- AI-powered features (Tool 5 only) call the existing Gemini integration via the `GEMINI_API_KEY` env var.

## Shared lead-capture pattern

After the user has interacted with the tool (paste a code, copy a template, generate a form, etc.), surface a soft email-capture prompt:

> **&ldquo;Want this in your inbox? We&apos;ll send you the [tool result] plus monthly UAE healthcare-ops updates. No spam, no marketing — just useful.&rdquo;**
> [Email field] [Send]

Submit hits `POST /api/notify-demo` with payload `{ email, source: 'tool-<slug>', context: { ... } }`. The existing endpoint stores the lead and dispatches Plunk emails per the existing automation.

---

## Tool 1: UAE Claim Rejection Decoder

**Slug:** `/tools/claim-decoder`

**Audience:** Insurance coordinators, billing managers at UAE clinics. Daily users. They paste a rejection code from DHPO (Dubai Health Post Office), eClaimLink (Abu Dhabi), or Shafafiya (DHA TPA platform) into the tool and get the human-readable explanation, the most common cause, and the fix.

**The problem:**
UAE clinic billing systems return rejection codes from three different platforms with different vocabularies. Coordinators waste 10–30 minutes per rejection deciphering what code 4.06 means on DHPO vs eClaimLink. Loss is real: UAE clinics report 10–20% of revenue lost to claim errors that could be fixed if decoded faster.

**Functional spec:**
- Input: paste-or-type a rejection code or rejection reason (free text). Multi-platform: DHPO, eClaimLink, Shafafiya, NEXtCARE.
- Lookup: hardcoded TS table mapping code → { platform, plain-English explanation, common cause, recommended fix, related codes }.
- Output: card-style result with the 4 fields above, plus a `Copy as note` button (copies a templated explanation suitable for pasting into the clinic&apos;s ticket system or back to the prescribing doctor).
- Below the input: list of the top 20 most common rejection codes as quick-click chips for fast lookup.

**Static data:** ~80–100 codes across the 4 platforms. Sourced from publicly available DHA/DOH publications, NEXtCARE training materials, and clinic ops documentation.

**Lead capture:** &ldquo;Want a complete rejection-code reference cheat sheet (PDF, 80+ codes)? Drop your email.&rdquo;

**Build estimate:** 60 min (UI ~30 min + data table ~30 min)

---

## Tool 2: WhatsApp Reminder Template Library

**Slug:** `/tools/whatsapp-templates`

**Audience:** Practice managers, front-desk staff, marketing leads at UAE clinics. Used weekly when crafting reminder messages for appointments, lab results, follow-ups, payment reminders.

**The problem:**
Zero Arabic WhatsApp template libraries exist for UAE healthcare. English ones from US SaaS aren&apos;t culturally appropriate (greeting style, formality register, tone toward elderly Emirati patients). Clinic staff write the same templates from scratch every week, often poorly — leading to lower confirmation rates.

**Functional spec:**
- Browse-by-axis filter UI: filter templates by (1) specialty (dental / GP / pediatrics / ob-gyn / dermatology / cardiology / radiology / lab), (2) message type (appointment confirmation / reminder 24h / reminder 1h / follow-up / lab-result-ready / payment reminder / no-show recovery / birthday), (3) language (Arabic / English / both).
- Template cards: each shows the template text in EN + AR side-by-side, a placeholder for `{patient_name}`, `{appointment_time}`, `{clinic_name}`, etc.
- Actions per card: `Copy English`, `Copy Arabic`, `Copy both`. Copies to clipboard with placeholders intact (user replaces in WhatsApp Business).
- Arabic templates use UAE-appropriate formality: `حضرتك` for elderly patients, neutral for younger; greeting prefixes per time-of-day; closing in clinic-name+contact format.

**Static data:** ~80 templates (8 specialties × 8 message types × 1 default + variants). Each template is bilingual EN+AR.

**Lead capture:** &ldquo;Want all 80 templates as a copy-paste sheet? Drop your email.&rdquo; Plus &ldquo;Get a Zavis AI agent that sends these automatically based on your appointment system.&rdquo; (this funnels to Zavis platform demo).

**Build estimate:** 90 min (~30 min UI + 60 min template library writing)

---

## Tool 3: DHA/DOH/MOHAP Compliance Calendar

**Slug:** `/tools/compliance-calendar`

**Audience:** Clinic owners, compliance officers, practice managers. Used quarterly when planning license renewals, CME requirements, DataFlow verifications.

**The problem:**
UAE clinic-side compliance is fragmented across DHA (Dubai), DOH/Sheryan (Abu Dhabi), and MOHAP (Northern Emirates). Each has different renewal cycles for facility licenses, professional licenses, CME requirements, drug-licensing renewals, and audits. Missing a deadline = penalty + potential license suspension. Existing competitor: nothing UAE-specific. Zavis already ranks for &ldquo;DHA license renewal&rdquo; with text content — interactive form converts that organic traffic.

**Functional spec:**
- User inputs:
  - Health authority (DHA / DOH / MOHAP / multi)
  - Professional or facility type (doctor / dentist / pharmacist / clinic facility / hospital facility / pharmacy / lab)
  - Last renewal date (or initial license date for first-time users)
- Output: calendar view of upcoming compliance dates for the next 12 months
  - License renewal (facility + each professional license)
  - CME hours requirement deadline
  - DataFlow verification renewal (every 5 years for some categories)
  - Insurance contract renewal (annual)
  - DHA inspection windows (predictive based on inspection cycle)
- Actions:
  - `Email me 90/60/30 day reminders` → captures email, sets up Plunk-based scheduled reminder mails
  - `Add to Google Calendar` → exports `.ics` file with all dates
  - `Print as compliance schedule` → opens print-optimised view

**Static data:**
- DHA renewal cycle rules (facility 1 year, professional 2 years, CME varies by specialty)
- DOH/Sheryan equivalents
- MOHAP equivalents
- DataFlow verification schedule (5-year cycle)

**Lead capture:** Email reminders are the core feature, so email is the natural conversion. Plus a &ldquo;See how Zavis automates this for your full clinic&rdquo; CTA → Zavis platform demo.

**Build estimate:** 120 min (form + calendar UI + ICS export + reminder logic)

---

## Tool 4: Bilingual Patient Intake Form Generator

**Slug:** `/tools/intake-form`

**Audience:** Clinic owners, front-desk leads at UAE clinics setting up new practices or refreshing intake. Used at clinic launch and quarterly when forms need updates.

**The problem:**
UAE clinic intake forms must be bilingual (Arabic + English) and NABIDH-aware (UAE national health information network). Global form-builder tools (JotForm, Typeform, Google Forms) are English-centric and don&apos;t handle Arabic RTL well. Building intake from scratch takes 2–4 hours of designer time per clinic.

**Functional spec:**
- User inputs:
  - Clinic name, logo upload (optional), specialty (dental / GP / pediatrics / etc.)
  - Toggle which sections to include: (1) demographics — required, (2) insurance details, (3) emergency contact, (4) medical history checkboxes, (5) current medications, (6) allergies, (7) family history, (8) smoking/alcohol, (9) consent for treatment, (10) consent for NABIDH data sharing, (11) consent for marketing communication
  - Custom additional questions (free text, up to 5)
- Output:
  - Live preview pane showing the intake form in Arabic and English side-by-side, with RTL formatting on the AR side
  - `Download PDF` (formatted, 2-page A4, both languages)
  - `Download as fillable HTML` (single HTML file the clinic can host on their website or load in iPad kiosk)
  - `Copy embed code` (iframe-style for the clinic website — points to a Zavis-hosted form ID with the clinic&apos;s data baked in; this is the upsell hook)

**Static data:**
- Standardised question bank per specialty (~150 standard medical-history questions, all pre-translated EN+AR)
- NABIDH consent boilerplate text (EN + AR)
- PDPL-compliant consent boilerplate

**Lead capture:** &ldquo;Want to actually deploy this form? Zavis hosts it for free for the first 100 patient submissions, then it&apos;s a Zavis-platform feature. Drop your clinic name + email.&rdquo;

**Build estimate:** 150 min (most complex tool — form builder + bilingual rendering + PDF export + HTML export)

---

## Tool 5: AI Google Review Reply Generator

**Slug:** `/tools/review-reply`

**Audience:** Practice managers, marketing leads, clinic owners. Used weekly to reply to Google Maps reviews. Particularly valuable for negative review management.

**The problem:**
UAE clinics get Google Maps reviews in Arabic and English. Replying takes thought (PDPL — UAE data protection law — restricts what you can disclose about a patient even in reply). Doctible sells this exact feature as a $300/month paid product in the US; nothing similar exists for UAE.

**Functional spec:**
- User inputs:
  - Paste the review (Arabic or English, auto-detected)
  - Star rating (1–5)
  - Clinic specialty (used for tone/context)
  - Optional: clinic name (auto-filled in reply)
- AI generates 3 reply variants via Gemini API:
  - Variant 1: Empathetic / apologetic (best for negative reviews)
  - Variant 2: Grateful / professional (best for positive reviews)
  - Variant 3: Concise / neutral (best for ambiguous reviews)
- Each variant in EN+AR side-by-side, with copy-to-clipboard buttons
- PDPL safety filter: Gemini system prompt explicitly forbids disclosing patient diagnoses, names, treatment specifics, dates of visits, or any personally-identifiable health information. Examples included in the prompt.
- Tone slider (optional): formal ↔ friendly. Adjusts the prompt before generation.

**Tech:**
- Gemini API call via existing `GEMINI_API_KEY` (already in `.env.local`)
- Server-side route at `/api/tools/review-reply` to keep the API key server-only
- Client-side rate limit: 5 generations per hour per IP (lightweight in-memory limiter)
- Prompt template stored as a static string in the API route file

**Lead capture:** &ldquo;Want Zavis to auto-reply to all your reviews 24/7, with audit logs? That&apos;s the Zavis platform.&rdquo; CTA → Zavis platform demo.

**Build estimate:** 90 min (UI ~40 min + API route ~30 min + prompt tuning ~20 min)

---

## Tools index page

**Slug:** `/tools`

Hub page listing all 5 tools, each as a card with: tool name, 1-line description, &ldquo;Free, no signup&rdquo; tag, who-it&apos;s-for tag, &ldquo;Open tool&rdquo; CTA.

Header link: add &ldquo;Tools&rdquo; entry to the directory header (`ZavisHeader`) menu.

Footer link: add a &ldquo;Free Tools&rdquo; column to the footer.

## Tracking

All 5 tools and the tools index emit GA4 `tool_open`, `tool_action` (with action-name), `lead_captured` events via the existing `trackEvent` helper. Internal-only metrics dashboard via the existing `/api/research/*` infrastructure if needed later.

## Build order &amp; dependencies

Order chosen to ship the simplest tools first and prove the pattern, then build the more complex ones:

1. **Tool 1 (Claim Rejection Decoder)** — simplest. Lookup table + UI.
2. **Tool 2 (WhatsApp Templates)** — content-heavy but mechanically simple. Static templates + filter + copy.
3. **Tool 3 (Compliance Calendar)** — date math + ICS export. Medium complexity.
4. **Tool 4 (Intake Form Generator)** — most complex. PDF + HTML export.
5. **Tool 5 (Review Reply Generator)** — AI integration. Smaller UI but dependency on Gemini.
6. **Tools index page** + header/footer integration — last, after all tools are built.

All work LOCAL only — no commits, no deploys until user reviews in the morning.
