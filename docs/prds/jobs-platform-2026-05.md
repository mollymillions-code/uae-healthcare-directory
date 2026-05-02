# Open Healthcare Jobs by Zavis — Strategic Plan (v3)

**Status:** Plan. No build yet.
**Author:** Claude Opus 4.7
**Date:** 2026-05-02 (v3 — three-user-type architecture, full build now, recruiter-side feature-flagged)
**Trigger:** Sayan flagged steady job-related inbound on Zavis contact forms. Demand exists; we're not capturing it.

---

## TL;DR

**Open Healthcare Jobs by Zavis.** Free for everyone, forever. Built into the existing Zavis platform as a third user category alongside patients and clinic owners.

The platform now has three first-class user types, each with their own login, profile, and feature surface:

| User type | Login route | Schema table | Purpose |
|---|---|---|---|
| **Patient / customer** | `/login` (existing) | `consumer_users` | Browse directory, save providers, set insurance |
| **Job seeker** *(new)* | `/jobs/login` | `candidate_users` + `candidate_profiles` | Create candidate profile, apply for jobs, get notified by clinics |
| **Clinic owner / admin** | `/provider-portal/login` (existing) | `clinic_users` | Manage listing — and (feature-flagged) post jobs + browse candidates |

Candidates can both **apply to specific jobs** (active path) and **be discovered via their profile** (passive path). Both surfaces are built into the platform — not WhatsApp.

Build everything end-to-end now — including the clinic-recruiter side. Ship it behind a `ENABLE_CLINIC_RECRUITER_ACCESS` feature flag set to false. When the candidate side has enough volume + the clinic side is polished, flip the flag. No scramble later.

**Editorial + matching = Claude.** I write the 20 listicles, curate the launch job inventory, and do the AI-driven candidate↔job matching. No human ops team in Phase 1.

---

## Brand & framing

**Canonical:** "Open Healthcare Jobs by Zavis" — mirrors "UAE Open Healthcare Directory by Zavis".

Across the site, copy emphasises:
- Free for healthcare workers. Free for clinics. No subscription. No application fees. Forever.
- Open data infrastructure for UAE healthcare. The directory is free, the jobs board is free, the intelligence section is free.

Informal references in copy: "Zavis Healthcare Jobs", "Zavis Jobs". The full canonical name is the one used in `<title>`, hero H1, JSON-LD `Organization`, and press materials.

---

## The three-user-type architecture

### Why three separate user systems

Each user type has fundamentally different consent boundaries, data sensitivity, and feature surfaces:

- **Patients** consent to PDPL data sharing for their own health-record use. Their profile is small (name, email, insurance preference). They never have access to candidate data or clinic-admin tooling.
- **Candidates** consent to a richer data export (CV, salary expectation, current employer). Their profile is sensitive — leaking the wrong field can cost them their current job. They never see other candidates' profiles.
- **Clinic admins** consent on behalf of an organisation. They have access to applicant data and (feature-flagged) candidate-browse. They never see patient consumer accounts.

Mixing these into one role-flagged table makes auth checks fragile and PDPL audits harder. Three tables, three auth flows, three layouts. Shared dependencies (NextAuth session, common UI primitives) but distinct surfaces.

### Auth flows

```
                ┌──────────────────────────┐
                │   /login (patient)       │  ← existing
                │   /jobs/login            │  ← NEW
                │   /provider-portal/login │  ← existing
                └──────────────────────────┘
                          │
                          │ NextAuth credentials
                          ▼
            ┌─────────────────────────────────┐
            │   user.role discriminator       │
            │   on session                    │
            └─────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
      consumer_users  candidate_users  clinic_users
```

A unified signup landing at `/get-started` (new) shows three cards: "I'm looking for a doctor / clinic" (patient), "I'm a healthcare worker looking for a job" (candidate), "I run a clinic and want to manage my listing or hire" (clinic). Each card routes to its own signup flow. Patients can also sign up directly during a "save provider" interaction, candidates during "apply to job", clinics during "claim listing". The unified hub exists for direct visitors who arrive without context.

**Cross-account constraint:** an email can be registered as more than one role (a clinic owner might also be a patient browsing care for their family). Each account is independent — no single sign-in shows multiple-role surfaces in one shell. If you want to switch, you sign out and sign in as the other role. Simple and secure.

---

## Audience segmentation

### Candidate-side personas

| Persona | Volume | Why they show up |
|---|---|---|
| **Overseas doctor moving to UAE** (Egypt / India / Pakistan / Philippines / UK / EU / US) | High | Search results land them on Zavis; profile gives them a UAE-specific signal |
| **UAE-resident doctor open to opportunities** | Medium | Limited-visibility profile keeps them off their current employer's radar |
| **Fresh-grad doctor / house officer** | Medium | Internships are scarce; passive discovery beats blind applications |
| **Nurse (BSN, RN, RM)** | Very high | Largest healthcare-worker segment; high mobility |
| **Allied health (lab tech, radiographer, physio, pharmacist)** | Medium | Underserved by general boards |
| **Admin / Operations** | Medium | Specialty-aware profile differentiates from general-admin job boards |

### Clinic-recruiter personas (Phase 2 — built now, gated)

| Persona | When they get access |
|---|---|
| Hospital HR (NMC, Mediclinic, Burjeel) | Once feature flag flips for verified directory clinics |
| Mid-size clinic chain HR | Same |
| Single clinic owner | Same |
| Healthcare staffing agency | Phase 2.5 — separate gating to avoid spam |

---

## What we build

### Routes

**Public (everyone):**
- `/jobs` — hub
- `/jobs/[city]` (8)
- `/jobs/[specialty]` (~30)
- `/jobs/[city]/[specialty]` (programmatic, 3-job min eligibility)
- `/jobs/[city]/[specialty]/[id]-[slug]` (job detail)
- `/jobs/employer/[clinicSlug]` (all jobs at one clinic)
- `/jobs/guides/[slug]` (20 listicles)
- `/get-started` (unified signup hub for the three user types)

**Job-seeker–authenticated:**
- `/jobs/login` — sign-in
- `/jobs/signup` — multi-step profile builder (also where new candidates land from "Apply" CTAs)
- `/jobs/profile` — view + edit own profile
- `/jobs/profile/visibility` — visibility tier + notification prefs
- `/jobs/applications` — list of jobs the candidate applied to + status
- `/jobs/saved` — saved jobs
- `/jobs/inbox` — notifications + recruiter-interest log
- `/jobs/account` — settings, password, deletion

**Clinic-admin (built now, behind `ENABLE_CLINIC_RECRUITER_ACCESS` feature flag):**
- `/provider-portal/jobs` — list of clinic's posted jobs
- `/provider-portal/jobs/new` — post a new job
- `/provider-portal/jobs/[id]` — job detail + applicants
- `/provider-portal/jobs/[id]/applications` — applicant list with sort/filter
- `/provider-portal/jobs/[id]/applications/[appId]` — single applicant view
- `/provider-portal/candidates` — search candidate profiles (consent-gated)
- `/provider-portal/candidates/[id]` — anonymized profile view
- `/provider-portal/inbox` — application notifications + candidate-interest threads

When `ENABLE_CLINIC_RECRUITER_ACCESS=false`, every `/provider-portal/jobs/*` and `/provider-portal/candidates/*` route renders a "Coming soon — early access opening shortly" placeholder with a waitlist email capture. The schema, components, and API logic are all live; only the UI gate is closed. When the flag flips, the existing data starts flowing immediately.

### Schema

```sql
-- ─── User table for job seekers ────────────────────────────────────────
-- Mirrors `consumer_users` shape but with its own auth + its own profile relation.
CREATE TABLE candidate_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  password_hash text,                    -- nullable for future OAuth
  email_verified_at timestamptz,
  last_login_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Candidate profiles ────────────────────────────────────────────────
CREATE TABLE candidate_profiles (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES candidate_users(id) ON DELETE CASCADE,
  -- Core
  role text NOT NULL CHECK (role IN ('doctor','nurse','allied_health','admin','other')),
  specialty_slug text,
  subspecialty_slug text,
  experience_years integer,
  -- Discreet field — only visible to recruiters who pass the consent gate
  current_employer_optional text,
  -- Licensing
  license_status text CHECK (license_status IN ('dha','doh','mohap','dataflow_pending','outside_uae','none')),
  license_number_optional text,
  -- Geographic
  preferred_city_slugs text[] NOT NULL DEFAULT '{}',
  current_city_slug text,
  willing_to_relocate boolean DEFAULT false,
  visa_status text CHECK (visa_status IN ('citizen','residence','needs_sponsorship')),
  -- Compensation & employment
  salary_expectation_min_aed integer,
  salary_expectation_max_aed integer,
  employment_type_pref text[] NOT NULL DEFAULT '{}',
  -- Bio + media
  bio_md text,                           -- ~150 word pitch
  cv_url text,                           -- Cloudflare R2, encrypted at rest
  cv_uploaded_at timestamptz,
  photo_url text,
  languages text[] NOT NULL DEFAULT '{}',
  -- Status
  availability text CHECK (availability IN ('actively_looking','open','not_looking')) DEFAULT 'open',
  visibility text CHECK (visibility IN ('public','limited','private')) NOT NULL DEFAULT 'limited',
  profile_completeness integer NOT NULL DEFAULT 0,  -- 0..100, recomputed on update
  -- Notification prefs
  notify_email boolean NOT NULL DEFAULT true,
  notify_whatsapp boolean NOT NULL DEFAULT false,
  whatsapp_number text,
  -- PDPL consent capture (versioned — required for compliance)
  consent_terms_at timestamptz NOT NULL,
  consent_terms_version text NOT NULL,
  consent_data_processing_at timestamptz NOT NULL,
  consent_recruiter_visibility_at timestamptz,    -- only set when visibility != private
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidate_specialty_city ON candidate_profiles(specialty_slug, current_city_slug);
CREATE INDEX idx_candidate_visibility ON candidate_profiles(visibility, availability);

-- ─── Jobs ──────────────────────────────────────────────────────────────
CREATE TABLE jobs (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_ar text,
  -- Either an in-directory clinic or an external one
  clinic_id text REFERENCES providers(id),
  external_clinic_name text,
  external_clinic_url text,
  city_slug text NOT NULL,
  specialty_slug text NOT NULL,
  subspecialty_slug text,
  seniority text CHECK (seniority IN ('intern','junior','mid','senior','consultant','head_of_dept')),
  employment_type text CHECK (employment_type IN ('full_time','part_time','locum','visiting')),
  description_md text NOT NULL,
  requirements_md text,
  benefits_md text,
  license_required text,
  dataflow_required boolean,
  visa_sponsorship boolean,
  salary_min_aed integer,
  salary_max_aed integer,
  salary_disclosed boolean DEFAULT false,
  application_deadline timestamptz,
  posted_at timestamptz NOT NULL DEFAULT now(),
  closing_at timestamptz,
  status text CHECK (status IN ('draft','published','closed','archived')) NOT NULL DEFAULT 'draft',
  -- Provenance: who/what added this job
  source text CHECK (source IN ('zavis_curated','clinic_direct','editorial_aggregated','candidate_referred')) NOT NULL,
  posted_by_clinic_user_id text REFERENCES clinic_users(id),  -- null for zavis_curated/aggregated
  -- Telemetry
  view_count integer NOT NULL DEFAULT 0,
  application_count integer NOT NULL DEFAULT 0,
  saved_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status_posted ON jobs(status, posted_at DESC);
CREATE INDEX idx_jobs_city_specialty ON jobs(city_slug, specialty_slug, status);
CREATE INDEX idx_jobs_clinic ON jobs(clinic_id);

-- ─── Applications (active path: candidate → applies to specific job) ──
CREATE TABLE job_applications (
  id text PRIMARY KEY,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_user_id text NOT NULL REFERENCES candidate_users(id) ON DELETE CASCADE,
  candidate_profile_id text REFERENCES candidate_profiles(id),
  cover_note_md text,
  cv_url_at_apply text,                  -- snapshot of CV at apply time (not live)
  status text CHECK (status IN (
    'submitted','seen_by_clinic','shortlisted',
    'interviewed','offered','hired','rejected','withdrawn'
  )) NOT NULL DEFAULT 'submitted',
  status_updated_at timestamptz,
  status_updated_by_clinic_user_id text REFERENCES clinic_users(id),
  candidate_visible_status text,         -- what the candidate sees (may lag clinic-side actual)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_user_id)      -- one application per candidate per job
);

CREATE INDEX idx_applications_candidate ON job_applications(candidate_user_id, created_at DESC);
CREATE INDEX idx_applications_job ON job_applications(job_id, status);

-- ─── Profile interest events (passive path: clinic → expresses interest) ──
CREATE TABLE profile_interest_events (
  id text PRIMARY KEY,
  candidate_profile_id text NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  recruiter_clinic_id text REFERENCES providers(id),
  recruiter_clinic_user_id text REFERENCES clinic_users(id),
  source text NOT NULL CHECK (source IN ('zavis_match','recruiter_view','recruiter_interest')),
  job_id text REFERENCES jobs(id),
  message_md text,
  notified_candidate_at timestamptz,
  candidate_responded_at timestamptz,
  candidate_response text CHECK (candidate_response IN ('accepted','declined','ignored')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_interest_events_candidate ON profile_interest_events(candidate_profile_id, created_at DESC);

-- ─── Saved jobs (candidate-side bookmark) ──────────────────────────────
CREATE TABLE candidate_saved_jobs (
  id text PRIMARY KEY,
  candidate_user_id text NOT NULL REFERENCES candidate_users(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_user_id, job_id)
);

-- ─── Job alert subscriptions (anonymous email is fine, no auth required) ──
CREATE TABLE job_alert_subscriptions (
  id text PRIMARY KEY,
  email text NOT NULL,
  candidate_user_id text REFERENCES candidate_users(id),  -- null for anon subscribers
  city_slugs text[] NOT NULL DEFAULT '{}',
  specialty_slugs text[] NOT NULL DEFAULT '{}',
  seniority text[] NOT NULL DEFAULT '{}',
  frequency text CHECK (frequency IN ('daily','weekly','realtime')) NOT NULL DEFAULT 'weekly',
  consent_pdpl_at timestamptz NOT NULL DEFAULT now(),
  unsubscribe_token text NOT NULL UNIQUE,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Notifications log (audit + dedupe + read state) ──────────────────
CREATE TABLE candidate_notifications (
  id text PRIMARY KEY,
  candidate_user_id text NOT NULL REFERENCES candidate_users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','in_app')),
  type text NOT NULL,
  payload jsonb,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_candidate ON candidate_notifications(candidate_user_id, created_at DESC);
```

All migrations idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

---

## Candidate signup + apply flow (the core happy path)

### From discovery to applied — every step

1. **Land on a job listing.** Browse anonymously, no signup. Hit `/jobs/dubai/cardiology` or a specific `/jobs/dubai/cardiology/cardiologist-mediclinic-parkview-id123`.
2. **Click "Apply".**
3. If not signed in: AuthModal opens with the three-card chooser. The "Job seeker" card is preselected (we know intent from the click). Sign up with email + password, OR sign in if account already exists.
4. Right after signup → multi-step profile builder. Cannot apply without a complete-enough profile (gates: role, specialty, license status, current city, experience years, consent). CV is optional.
5. PDPL clickwrap accepts: terms, data processing consent, notification consent, visibility tier choice (Limited as default), declarations.
6. Profile published.
7. Now back on the job page → "Apply" again is now active. Click → confirmation modal: "You're applying as {name}. Your profile (anonymized to {clinic name}) will be sent. Add a cover note (optional)." Submit.
8. `job_applications` row created. Application count increments. Clinic admin (when feature enabled) sees it instantly. In Phase 1 (clinic flag off), I (Claude) see a queue and surface candidates back to clinics via direct outreach.
9. Candidate sees confirmation: "Application sent. {Clinic} will be notified. You'll get an email when they update the status."
10. Email confirmation goes out via Plunk.
11. Candidate's `/jobs/applications` page lists this with status `submitted`.

### Re-apply flow

If a candidate is signed in and clicks Apply on a new job:
1. Confirmation modal opens with their existing profile summary + cover-note field.
2. Submit creates the `job_applications` row.
3. No re-signup, no re-profile-fill. The friction is the cover note and the click.

This is the difference between Zavis and Bayt: Bayt forces you to re-fill an "application form" per job because there's no global profile. We have one profile, applied to many jobs.

### "Express interest" alternative path

For candidates who don't want to officially apply yet (still browsing, want to signal soft interest), there's an "Express interest" CTA below "Apply".

- Express interest = creates a `job_candidate_interests` row.
- Candidate is bookmarked against the job — appears in clinic admin's "interested candidates" pool (when feature enabled).
- No formal application. No status tracking. Lower commitment.

This catches the "I'm not sure if I'd take this but I want them to know I exist" candidates that pure-application-only platforms miss.

---

## How clinics see applications (Phase 2 / feature-flagged)

Built now, gated by `ENABLE_CLINIC_RECRUITER_ACCESS` env flag.

### Clinic admin workflow

1. Sign in to `/provider-portal` (existing).
2. New "Hiring" tab in the side nav (only visible if flag is on AND clinic is in good standing in directory).
3. **Post a job:** structured form. Validated against PDPL/UAE labour-law rules at submit. Saves to `jobs` table with `source='clinic_direct'`.
4. **View applications:** `/provider-portal/jobs/[id]/applications` shows all applicants for that job, sortable by submission date / profile completeness / experience.
5. **Anonymized first:** initial view doesn't show name + contact. Clinic sees: role, specialty, experience years, license, languages, location, salary expectation, photo (if profile is `public` or `limited`), bio, CV (if uploaded), cover note. Clicking "Connect" sends a request to the candidate; only after candidate accepts does name + contact unlock.
6. **Browse candidate database** (`/provider-portal/candidates`) — search filtered by specialty / city / license / experience / availability. Same anonymized model. Each profile view logs to `profile_interest_events` for the candidate's "who saw me" audit trail.
7. **Update application status** — clinic moves an application through `submitted → seen → shortlisted → interviewed → offered → hired/rejected`. Status changes (or selected ones — UX setting per clinic) trigger candidate notifications.

### What clinics don't see

- Other clinics' applicants.
- Candidate's `current_employer_optional` field unless candidate explicitly opts in (separate consent).
- Aggregate ratings / scores (we don't compute these; reduces gaming).
- Direct contact info until candidate accepts the connect request.

---

## Editorial + matching role (= me, Claude)

In Phase 1, before the clinic flag flips, the platform looks alive and useful from day one because Claude does the editorial + AI matching.

### Editorial

I write:
- The 20 listicles (see SEO section). Applied with Anti-AI-Tells writing principles: no "delve", no "in this rapidly-evolving landscape", varied sentence rhythm, named UAE clinics and insurers, concrete AED salary ranges, real friction points (DataFlow timing, license endorsement complexity), occasional contrarian takes ("most candidates over-prepare for the DHA assessment exam — here's the actual minimum"), short paragraphs alternating with longer analytical ones.
- Job descriptions for the launch inventory. Source: public clinic career pages (NMC Careers, Mediclinic Careers, Burjeel, etc.) — I rewrite each into the Zavis voice with attribution back to the canonical source. Target: 50–100 jobs at launch, growing weekly.
- Hub-page editorial intros (`/jobs`, `/jobs/[city]`, `/jobs/[specialty]`).
- The "How UAE healthcare hiring works" evergreen primer.

### AI matching

I implement matching as a server-side function that runs:

1. **Daily for active candidates** (those with `availability='actively_looking'`):
   - For each candidate, compute embedding similarity between their `bio_md` + role + specialty + experience + license + cities against every published `job` row.
   - Surface top-5 matches to the candidate via in-app `/jobs/inbox` and weekly digest email.
   - Source attribution: `zavis_match`.

2. **Daily for new jobs:**
   - For each new job, compute the top-20 candidate matches.
   - In Phase 1: surface these to candidates as "{Job} at {Clinic} matches your profile".
   - In Phase 2: surface to clinic admin as a "suggested candidates" list inside the job's application page.

3. **Real-time for application submissions:**
   - When a candidate applies, score the application against the job's structured requirements (license match, experience match, location match) and append a Claude-generated 2-line summary to the application visible to clinic admin: "Strong match: 4y cardiology, DHA-licensed, currently in Dubai. Cover-note focus: pediatric cardiology subspecialty fit."

Matching uses Gemini (already wired in `lib/intelligence/automation/summarize.ts`) for embeddings + summarisation. No human-in-the-loop required for the match itself; my role is to set the prompts, validate outcomes weekly, and tune the ranking.

### Quality control

- Every job listed: I verify the clinic exists in our directory or has a verifiable public web presence.
- Every job copy: I rewrite to remove illegal nationality preferences, age preferences, and gender requirements.
- Every weekly digest: I review the top-20 most-promoted candidate-job pairs to catch matching bias.
- Every PDPL request: I respond within 48h (data export, deletion, etc.)

---

## SEO strategy

### 1. Programmatic city × specialty pages
8 cities × 30 specialties × seniority = potential 720 combos. With a 3-jobs-min eligibility gate and a curated ~150-job launch inventory, expect ~50–80 indexable pages at launch, growing organically.

### 2. Hub-page SEO depth
`/jobs` ranks for "healthcare jobs UAE", "medical jobs Dubai", "doctor jobs Dubai". Body emphasises FREE, profile-first, and "apply with one profile, not one form per job".

### 3. 20 long-form listicles (written by me, in Zavis voice with Anti-AI-Tells discipline)

**Process & licensing:**
1. "DHA license for doctors — full process and timeline (2026)"
2. "DataFlow Group verification for UAE doctors — how to get it"
3. "DOH / Sheryan license for doctors in Abu Dhabi"
4. "MOHAP healthcare professional license — Northern Emirates"
5. "UAE nursing license — DHA, DOH, MOHAP requirements"
6. "Pharmacist license in UAE — DHA / DOH / MOHAP comparison"
7. "Allied health license in UAE (lab tech, radiographer, physio)"

**Salary & negotiation:**
8. "Doctor salaries in the UAE — by specialty (2026)"
9. "Nurse salaries in the UAE — BSN, RN, RM ranges"
10. "How to negotiate your UAE clinic offer"
11. "Locum doctor day rates in the UAE"

**Geographic & demographic:**
12. "Healthcare jobs in UAE for Filipino nurses"
13. "Healthcare jobs in UAE for Indian / Pakistani / Egyptian doctors"
14. "Healthcare jobs in UAE for UK / EU / US doctors"
15. "How to get a doctor job in Dubai as a foreign-trained MD"
16. "Healthcare jobs in Abu Dhabi vs Dubai — which is better?"

**Career stage:**
17. "Internship and house officer roles in UAE healthcare"
18. "Consultant and head-of-department roles — UAE landscape"
19. "Visiting doctor and locum opportunities in UAE"

**Practical:**
20. "Visa sponsorship for healthcare workers in UAE"

Each: 1,500–2,000 words, 6–8 H2 sections, 5–6 FAQ items, JSON-LD `Article` + `FAQPage` + `BreadcrumbList` + `Speakable`. Internal links to the relevant `/jobs/[city]/[specialty]` programmatic pages.

### 4. Structured data
- `JobPosting` JSON-LD on every job detail page (Google's official format → unlocks the dedicated job-listing card in SERPs).
- `ItemList` of `JobPosting` on city/specialty hubs.
- `Article` + `FAQPage` on listicles.
- `Organization` + `WebSite` site-wide.

### 5. Internal linking
- Every clinic detail page (`/directory/<city>/<specialty>/<clinic>`) gets a "Jobs at this clinic" widget when `jobs.clinic_id = <clinic.id>` rows exist.
- Every professional profile (`/professionals/<id>`) gets "Open positions in {specialty} hiring now".
- Every insurance hub (`/insurance/<insurer>`) gets "Hiring at {insurer}-network clinics".

### 6. Free as a PR / backlink play
Press angle: "UAE startup launches free alternative to Bayt for healthcare hiring." Generates the high-authority backlinks that compound rankings.

---

## Comms architecture

### Candidate-side notifications

| Trigger | Channel | Cadence | Example |
|---|---|---|---|
| Profile published | Email | Once | "Your profile is live. Browse {N} jobs that fit your role." |
| Application status change | Email | Realtime | "Your application for Cardiologist at Mediclinic is now Shortlisted." |
| New matched job | Email | Per pref (daily/weekly) | "5 new cardiology jobs in Dubai match your profile." |
| Recruiter viewed profile (Phase 2) | Email + WhatsApp | Daily summary | "3 clinics viewed your profile today." |
| Recruiter requested connect (Phase 2) | Email + WhatsApp | Realtime | "{Clinic} would like to share contact info." |
| Weekly summary | Email | Mon 9am GST | Activity log + new matches |
| Profile incomplete nudge | Email | 3 days after signup if completeness < 60% | "Add a CV to triple your visibility to clinics." |

WhatsApp = outbound transactional only via WhatsApp Business API. One-way notifications (sent via approved templates). Candidates respond by signing in to the platform. No two-way WhatsApp chat anywhere.

### Clinic-side notifications (Phase 2 / flag-gated)

| Trigger | Channel | Example |
|---|---|---|
| New application on clinic's job | Email | "3 new applications for Cardiologist role." |
| Candidate accepted connect request | Email + in-app | "{Candidate} accepted your connect request — view contact." |
| Daily digest | Email | "12 new candidates matched your saved searches." |

### Anonymous (non-auth) notifications

- Job-alert subscribers (anyone with email): weekly digest of new jobs in their saved filter.
- Press / press-mentioned-in-listicle: never — we don't email people who aren't subscribers.

---

## Phase rollout

### Phase 1 (current build) — candidate side fully open, clinic side built but gated
- All routes and schemas built end-to-end.
- `ENABLE_CLINIC_RECRUITER_ACCESS = false` — clinic-recruiter UI shows "Coming soon" placeholder.
- Editorial + AI matching by Claude.
- 50–100 launch jobs curated.
- 20 listicles written.
- Candidate signup + profile + apply + saved + alerts all live.
- Goal: 1,500 candidate profiles + 500 jobs by month 3.

### Phase 2 trigger metrics — when to flip the flag
Recommend flipping `ENABLE_CLINIC_RECRUITER_ACCESS` to `true` when ALL of these are met:
- ≥ 1,000 published candidate profiles
- ≥ 500 published jobs
- ≥ 30 verified directory clinics on the waitlist
- ≥ 4 consecutive weeks of ≥ 50 new profiles/week (signal of organic growth, not a one-off promo spike)
- PDPL access-log audit completed and clean

When the flag flips: announce via email to all candidates ("UAE clinics can now message you directly") and to the waitlist clinics.

### Phase 2.5 (later — not built now)
- Healthcare staffing agencies — separate gating to avoid spam.
- Reverse jobs (clinic posts vacancy spec, Zavis sources passively).
- Salary benchmarking tool.

---

## Build sequence

### Sprint 1 (week 1–2) — schema + browse layer
- Migrations: 7 new tables (`candidate_users`, `candidate_profiles`, `jobs`, `job_applications`, `profile_interest_events`, `candidate_saved_jobs`, `job_alert_subscriptions`, `candidate_notifications`).
- Drizzle schema additions.
- Routes: `/jobs`, `/jobs/[city]`, `/jobs/[specialty]`, `/jobs/[city]/[specialty]`, `/jobs/[city]/[specialty]/[id]-[slug]`.
- Reuse `SearchControls` adapted for jobs.
- New `JobCardV2` component.
- `JobPosting` JSON-LD helper in `lib/seo.ts`.
- Sitemap entries.

### Sprint 2 (week 2–3) — auth + profile + apply
- `/jobs/login` + `/jobs/signup` + multi-step `/jobs/profile/setup`.
- `/jobs/profile` view + edit, `/jobs/profile/visibility`.
- NextAuth wiring for the third user type (`candidate_users` provider).
- Unified `/get-started` chooser.
- PDPL clickwrap consent screen + versioned-text storage.
- CV upload via R2 (signed-URL pattern, encrypted at rest).
- Apply flow: button on job page → AuthModal/profile setup → application submit → confirmation.
- `/jobs/applications` (candidate's application list).
- `/jobs/saved`.
- "Express interest" mechanism.

### Sprint 3 (week 3–4) — clinic-recruiter side built, feature-flagged
- All `/provider-portal/jobs/*` and `/provider-portal/candidates/*` routes built.
- API routes for job posting, application status update, candidate search.
- Feature flag: `ENABLE_CLINIC_RECRUITER_ACCESS` env var. UI gate: when false, render "Coming soon — early access opening shortly" + waitlist email capture.
- Clinic-side "post a job" form with PDPL/UAE-labour-law validation.
- Anonymized candidate browse view.
- Connect-request flow + candidate notification.

### Sprint 4 (week 4–5) — editorial + matching + notifications
- 20 listicles published (`/jobs/guides/[slug]`).
- 50–100 launch jobs curated by me.
- Plunk-driven cron jobs: daily match digest, weekly summary, application-status nudges.
- WhatsApp Business API outbound for high-priority notifications.
- AI matching service (Gemini-backed embedding similarity + ranking).
- Cross-link widgets on existing directory clinic + professional profile + insurance pages.
- GA4 events: `profile_create`, `profile_complete`, `job_apply`, `job_save`, `connect_request_sent`, `connect_request_accepted`, `cv_upload`, `application_status_change`.

### Sprint 5 (week 5) — launch hardening
- PDPL data-handling audit: CV encryption, retention (12 months inactivity → soft-delete; 36 months → hard-delete), access logging on every CV download, recruiter-side audit log.
- Spam / fake-profile detection.
- Operator runbook (for me + future humans): editorial workflow, matching review cadence, candidate complaint handling.
- Soft-launch: announce via existing newsletter, journalist outreach for "free healthcare jobs" angle.

---

## What "free forever" means

Publicly:
- "Open Healthcare Jobs by Zavis is free for healthcare workers. Always."
- "Free for clinics to post jobs and search the candidate database. Always. We don't charge for placements, premium tiers, or featured listings."

Internally (revenue model):
- Open Healthcare Jobs is **top of funnel** for the paid Zavis Platform SaaS (CRM, AI agents, automation, analytics that clinics buy separately).
- Clinics that use the free job board → discover the Platform → upgrade.
- Same play as the existing free directory: free public data → clinic claims listing → clinic upgrades to Platform tools.

This is the **public-data-moat → SaaS conversion** strategy. The user's contact-form inbound proved candidates trust Zavis. Free jobs makes that trust transactional.

---

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bait-and-switch jobs (clinic posts fake job to harvest CVs) | Medium | High | Editorial review on every job. Verified clinic only. Anonymized initial view in Phase 2 — clinic doesn't see contact until candidate accepts. CV stored encrypted, not auto-shared. |
| Profile abandonment after sign-up | High | Low | Re-engagement nudges. Profile-completeness gate before applying (forces some completion). Show "{N} clinics viewed similar profiles this week" as social proof. |
| Application volume overwhelms editorial workflow | Medium | Medium | When clinic flag flips, the manual ops layer evaporates — clinics handle their own. Until then, capacity-cap launch inventory at 100 jobs. |
| PDPL violation on candidate data | Medium | High | Encrypt CVs at rest. Access-log every retrieval. 12-month inactivity auto-purge. Versioned consent text stored. PDPL-compliance audit before flag flip. |
| LinkedIn / Bayt complaint | Low | Medium | Curate with attribution to canonical source; no scraping. Free model removes commercial-competition framing. |
| AI listicles flagged as low-quality by Google | Medium | High | Anti-AI-Tells discipline. Human-edited final pass on every listicle. Real UAE-specific data, named clinics, concrete numbers. Iterate based on Search Console performance. |
| Three-user-type architecture creates confusion at signup | Medium | Medium | `/get-started` chooser landing. Each role has a distinct visual treatment. AuthModal preselects role based on entry-point context (clicked "Apply for job" → preselect candidate). |
| Feature flag for clinic side accidentally flipped early | Low | High | `ENABLE_CLINIC_RECRUITER_ACCESS` is environment-only, not user-toggleable. Requires deploy. Plus a runtime guard that checks the env var on every clinic-recruiter API call. |

---

## Success metrics

### Phase 1 — month 3 targets (clinic flag still off)
- 1,500 candidate profiles published
- 500 jobs in `jobs` (status='published')
- 12,000 monthly visitors to `/jobs/*`
- 4,000 email subscribers (job alerts + profile notifications)
- 40% profile-completion rate
- 30 clinics on the waitlist for early-access recruiter side
- 6 of the 20 listicles ranking in Google top-10 for primary keyword

### Phase 2 — month 9 targets (after flag flip)
- 12,000 candidate profiles
- 50 active recruiter clinic accounts
- 30% of jobs posted directly by clinics (vs Zavis-curated)
- Average 8 recruiter "interest events" per active candidate per month
- 200 connect-request acceptances per month
- Open Healthcare Jobs is the #1 organic-search destination for "healthcare jobs UAE", "doctor jobs Dubai", "nursing jobs UAE"

---

## Decisions for Sayan / leadership before Sprint 1

1. **Brand confirmation:** "Open Healthcare Jobs by Zavis" canonical, "Zavis Healthcare Jobs" informal. Locked?
2. **Default candidate visibility:** Limited (recruiter-only) confirmed.
3. **CV upload at signup:** optional, confirmed.
4. **WhatsApp number at signup:** optional, confirmed.
5. **Email at signup:** required (only way to receive transactional updates).
6. **`ENABLE_CLINIC_RECRUITER_ACCESS` initial state:** false — confirm before Sprint 3.
7. **Phase 2 trigger metrics** above — confirmed?
8. **Editorial owner:** Claude — confirmed.
9. **Operator / matching owner:** Claude — confirmed.

---

## Next step if approved

I write the technical implementation plan (file-level: which routes, which components, which schema migrations, which env vars) and queue Sprint 1 against current eng capacity. Then start Sprint 1.

Local only. Nothing built without explicit go-ahead.
