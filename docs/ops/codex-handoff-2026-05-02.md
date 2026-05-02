# Handoff to Codex — 2026-05-02

**From:** Claude Code Opus 4.7
**To:** Codex (next session, will have better context per user)
**Branch state:** Work staged on `phase-1-seo-and-handoff` (local) → being pushed to `codex/staging-green-full-20260430211038`. **Nothing pushed to `live`.**
**User directive (verbatim):** "Don't push the codex branch to live. Push everything to the codex branch itself, and let the current setup exist like it is existing. I will later work with Codex to solve for that. It will have better context, so just make sure that you are doing all the documentation so that Codex knows all the stuff that you're doing."

---

## TL;DR for codex

1. The `live` branch divergence is **still open**. Production is on the codex branch tip (`07774b3`). `live` is 10 commits ahead with code that has never deployed. Claude did NOT touch this — it's yours to resolve.
2. Claude shipped Phase 2 SEO + four Tier 4 patches + a critical `/login` QA fix on top of the codex branch lineage. All staged, none deployed.
3. **Critical strategic decision pending from you:** the user has told us clinic sign-in is moving to the Zavis platform (separate SaaS). `/provider-portal/login` exists on this directory and is in tension with that direction. See § "The provider-portal sign-in conflict" below.
4. Read `.ai-collab/CHANGELOG.md` 2026-05-02 entry and `docs/ops/deployment-mess-issue.md` § "2026-05-02 Update" for the full file-by-file delta.

---

## What ships when you next run `promote-staged.sh` against this branch

After codex pulls/promotes this branch, here's what changes in production:

### Frontend
- `/login` becomes a real consumer NextAuth credentials login (instead of the research dashboard password gate it was serving). Redirects to `/account` after sign-in.
- New tri-facet route `/best/[city]/[category]/accepting/[insurer]` (EN + AR mirror) with FAQ + JSON-LD. Eligible combos only.
- `/insurance/[insurer]` gains a "Top clinics by city × category" chip-link section.
- `/insurance` hub stops timing out (drop `force-dynamic`, ISR `revalidate=43200` now actually takes effect).
- `/professionals/cardiology` (and other specialty slugs) actually 301-redirect to their canonical `/professionals/{category}/{specialty}` URLs instead of 404'ing.
- AR catchall directory listing branch gets a 7-question Arabic FAQ block + FAQPage JSON-LD.
- Sitemap emits the new `/best/...` URLs with EN+AR hreflang alternates.
- Footer drops the broken `/api/search` link. Orphan `Header.tsx` is gone.

### Backend / ops
- `promote-staged.sh` will auto-apply EVERY `.sql` file in `scripts/db/migrations/` in lexical order on every promote. Idempotent migrations make this safe and self-healing — schema drift is caught at promote time, not at request time. **This was the root cause of the consumer-accounts + provider-slug-history outages in late April** — migrations were silently dropped because the old script only ran one hardcoded file.
- Provider portal invites actually send activation emails now (Plunk → Resend → console.warn fallback). Best-effort: failures are logged but don't fail the invite. Admin still gets the URL in the API response as a manual fallback.

### SEO infrastructure
- `TRI_FACET_INSURER_ALLOW`: 6 → 12 (added axa, cigna, metlife, allianz-care, bupa-global, aetna-international).
- `TRI_FACET_CATEGORY_ALLOW`: 8 → 12 (added orthopedics, mental-health, ent, fertility-ivf).
- **Silent bug fixed:** `TRI_FACET_CATEGORY_ALLOW` had non-matching slugs (`dentists, dermatologists, ...`) that didn't correspond to real directory category slugs (`dental, dermatology, ...`). This had been silently breaking sitemap tri-facet emission since whenever the constant was introduced.
- 6 new bilingual `INSURANCE_EDITORIAL` entries (drafts — flag for editorial team to verify before they go live).
- 10 Phase 3 content briefs in `docs/playbooks/insurance-guide-listicle-briefs.md` — editorial team writes the prose; brief covers slug, target query, structure, sources.

---

## The provider-portal sign-in conflict — needs your decision

**Background:**
- `docs/ops/clinic-portal-intent.md` (originated from your earlier sessions) describes an embed-first provider portal: clinic websites iframe `https://zavis.ai/provider-portal/embed#token=<HMAC>` with a 5-minute one-time token. `/provider-portal/login` exists as a fallback for activated clinic accounts.
- The provider portal feature set is real: `clinic_organizations`, `provider_ownerships`, `clinic_invites`, `provider_edit_requests`, `provider_portal_audit_logs` — all live in `src/lib/db/schema.ts`. Routes at `src/app/(provider-portal)/provider-portal/{login,activate,listings,embed}/`. APIs at `src/app/api/provider-portal/*`.

**New constraint from user (2026-05-02, verbatim):**
> "The sign-in is supposed to be happening via the Zavis platform for the clinics, but for the patients and users, the sign-in will happen here. For clinics, there is not going to be any sign-in here. ... what is this dash code stuff, bro? Like, what have you put in here?"

(Dash-code = "Dashboard password" UI from the research dashboard gate that `/login` had inherited. That's now fixed.)

**The question for you:** `/provider-portal/login` has a `ProviderPortalLoginForm` styled with "Clinic listing portal" / "Manage your Zavis listing" copy. Three options, ordered by complexity:

- **Option A — Keep portal embed-only.** Delete `/provider-portal/login` (the form), redirect any direct hits to a notice page or to the Zavis platform login URL. Activation flow still uses `/provider-portal/activate?token=...` from invite emails to set the password, but after that, sign-ins happen via embed token only. Aligns best with your original embed-first vision.
- **Option B — Bridge to Zavis platform.** Replace `/provider-portal/login` with a 302 redirect to `https://platform.zavis.ai/login` (or whatever the canonical Zavis SaaS login is). Embed flow continues working. Requires the Zavis platform side to authenticate against the same `provider_portal_users` table or to issue compatible session cookies.
- **Option C — Rip out `/provider-portal/*` entirely.** Move every clinic-facing flow to the Zavis platform from scratch. Most invasive; also kills the email-invite plumbing Claude just wired up.

**Why Claude did not pick:** the existing invite flow is half-built (admin approves claim → invite email → activate page → set password → sign in). Removing `/provider-portal/login` unilaterally would break invited clinic accounts that haven't activated yet. You have better context on what the Zavis platform looks like and which option matches it.

---

## Repo state at handoff

```
$ git branch --show-current
phase-1-seo-and-handoff

$ git log codex/staging-green-full-20260430211038 -1 --format='%h %s'
07774b3 Fix directory search navigation and doctor route stability

$ git log zavis-support/live -1 --format='%h %s'
[10 commits ahead of 07774b3 — content unverified by Claude during this session]
```

Production is serving `07774b3` (codex branch tip). After Claude's commit lands on the codex branch, the production tip won't change until `promote-staged.sh` is run.

**Do not run `deploy.sh` until the divergence is resolved.** `deploy.sh` checks out `origin/live`, which would roll production back to a state that doesn't include any of the codex commits or this work. The user is aware and explicitly chose to defer the merge to you.

---

## Files Claude touched in this session

See `.ai-collab/CHANGELOG.md` 2026-05-02 entry for the full list with per-file rationale. Quick summary:

**New:**
- `src/app/(directory)/best/[city]/[category]/accepting/[insurer]/page.tsx`
- `src/app/(directory)/ar/best/[city]/[category]/accepting/[insurer]/page.tsx`
- `docs/playbooks/insurance-guide-listicle-briefs.md`
- `docs/ops/qa-audit-2026-05-02.md`
- `docs/ops/codex-handoff-2026-05-02.md` (this file)
- `docs/ops/clinic-portal-intent.md` (audit of the existing provider portal — read this first if you want context on what's currently built)
- `docs/ops/codex-session-audit.md`, `docs/ops/codex-shipped-audit.md`

**Rewritten:**
- `src/app/(directory)/login/page.tsx` (was research dashboard gate; now consumer NextAuth credentials)

**Edited (additive):**
- `src/app/sitemap.ts`
- `src/app/(directory)/insurance/[insurer]/page.tsx`
- `src/app/(directory)/ar/directory/[city]/[...segments]/page.tsx`
- `src/lib/seo/facet-rules.ts`
- `src/lib/insurance-facets/editorial-copy.ts`
- `src/lib/auth/email.ts`
- `src/lib/provider-portal/invites.ts`
- `scripts/ec2-deploy-infra/promote-staged.sh`
- `src/components/landing/pages/HomePageClient.tsx` (pre-existing modified state, content unverified)
- `src/lib/data.ts`, `src/lib/db/schema.ts` (pre-existing modified state, content unverified)

**Edited (bug fixes):**
- `src/app/(directory)/professionals/[category]/page.tsx` (Map → find lookup)
- `src/app/(directory)/ar/professionals/[category]/page.tsx` (same)
- `src/app/(directory)/insurance/page.tsx` (drop `force-dynamic`)
- `src/components/layout/Footer.tsx` (drop broken `/api/search` link)

**Edited (claim flow consolidation — pre-existing unsstaged state, NOT Claude's changes in this session):**
- `next.config.mjs`, `src/app/(directory)/claim/[listingId]/page.tsx`, `src/app/(directory)/claim/page.tsx`, `src/app/(directory)/request-listing/page.tsx`, `src/app/api/admin/providers/[id]/route.ts`
- Deleted: `src/app/api/claim/search/route.ts`, `src/app/api/claims/route.ts`, `src/app/api/listing-requests/route.ts`, `src/components/claim/ClaimForm.tsx`, `src/components/claim/ClaimProviderSearch.tsx`, `src/components/listing-request/ListingRequestForm.tsx`

**Note on the claim-flow deletions:** these were already in the working tree when Claude started this session — likely from your earlier consolidation work. Claude did not author or verify them. They will be included in the commit because they're modifications/deletions in the same working tree. Review carefully if you want to keep them.

**Deleted (Claude this session):**
- `src/components/layout/Header.tsx` (orphan, zero references in codebase)

---

## Idempotency check on migrations (relevant to Tier 4c)

All migrations in `scripts/db/migrations/` were verified before patching `promote-staged.sh`:

| File | Idempotent? | Pattern |
|---|---|---|
| `2026-04-11-authors-reviewers.sql` | yes | CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS |
| `2026-04-11-insurance-plans.sql` | yes | same |
| `2026-04-11-neighborhoods-taxonomy.sql` | yes | same |
| `2026-04-11-professionals-index.sql` | yes | same |
| `2026-04-11-reports.sql` | yes | same |
| `2026-04-30-consumer-accounts.sql` | yes | CREATE TABLE IF NOT EXISTS |
| `2026-04-30-provider-portal.sql` | yes | CREATE TABLE IF NOT EXISTS |
| `2026-04-30-provider-verification-badges.sql` | yes | DO $$ block selecting by stable id with slug fallback |
| `2026-05-01-professionals-index-education-columns.sql` | yes | additive ADD COLUMN IF NOT EXISTS |
| `2026-05-01-provider-slug-history.sql` | yes | CREATE TABLE IF NOT EXISTS |

If you add a non-idempotent migration in future, the new auto-apply behavior will fail loudly on the second promote. That's a feature, not a bug — but write idempotent migrations or gate them with a `DO $$ ... IF NOT EXISTS ... END $$` block.

---

## Things Claude deliberately did NOT do

- Did NOT merge codex branch into `live`. User explicitly deferred this to you.
- Did NOT push to `live` or run `deploy.sh`. Per standing instruction "Before pushing anything to deployment, ask me." plus the new directive.
- Did NOT delete `/provider-portal/login` despite the new strategic constraint. Load-bearing for the existing flow; you have better context to decide.
- Did NOT touch `src/lib/seo.ts` or `src/app/layout.tsx` (gtag-shim and recursion guards are load-bearing per `docs/analytics-and-gtm.md`).
- Did NOT touch `src/components/provider/ProviderCard.tsx` or `ProviderListPaginated` (Item 0.5 / Item 4 ownership).
- Did NOT touch the Nginx config, the `_next/static` serving setup, or anything in `/etc/nginx/`.

---

## Suggested order of operations for you

1. Pull `codex/staging-green-full-20260430211038` from `origin` (Claude pushes at end of session).
2. Read `.ai-collab/CHANGELOG.md` 2026-05-02 entry and `docs/ops/deployment-mess-issue.md` § "2026-05-02 Update".
3. Decide on the provider-portal sign-in question (Option A/B/C above).
4. Decide on the `live` branch divergence (merge codex → live, or revert).
5. Run `promote-staged.sh` against this branch (idempotent migrations will catch any DB drift).
6. Verify the new `/best/...` route renders with real data (`/best/dubai/dental/accepting/daman` is a good smoke test).
7. Verify `/login` shows the consumer credentials form, not the research dashboard.
8. If you keep `sendProviderPortalInviteEmail`: ensure `PLUNK_SECRET_KEY` or `RESEND_API_KEY` is set in `/home/ubuntu/zavis-shared/.env.local`.

Good luck. Ping the user if any of this is wrong or missing context.
