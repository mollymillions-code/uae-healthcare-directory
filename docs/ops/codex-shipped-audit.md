# Codex Shipped Audit Report — Zavis UAE Healthcare Directory

**Production Commit:** `07774b3` (branch: `codex/staging-green-full-20260430211038`)
**Audit Date:** 2026-05-01
**Commits Analyzed:** 10 commits from `38953992` to `07774b35`

---

## Executive Summary

Codex shipped **two major ghost features** (consumer accounts & provider portal) plus numerous supporting features. Both are fully built and live on the server, but neither has any navigation entry point — they're invisible to users.

- ✓ **Verified clinic badge** is properly wired (renders on provider cards and detail pages)
- ✓ **Demo API** is properly integrated (DemoForm and ContactPageClient POST to it)
- ✓ **Privacy SIP/VoIP disclosure** is in place (PrivacyPolicyPageClient shows it)
- ✓ **Search controls expansion** is fully functional (insurance, language, condition, city, specialty, emergency toggle all work)
- ✗ **Consumer account feature** (`/account/*`) is live but **NOT discoverable** — no navigation links exist in ZavisHeader or landing Navbar
- ✗ **Provider portal** (`/provider-portal/*`) is live but **NOT discoverable** — no public entry point
- ✗ **Auth flows** (`/signup`, `/login`, `/forgot-password`, `/reset-password`) exist but **NO UI entry points** — only accessible via direct URL or ConsumerAccountPrompt
- ⚠ **SaveProviderButton** component exists but is only imported by old `ProviderCard.tsx` (Arabic pages), NOT on the main directory V2 cards

---

## Per-Commit Status Table

| Hash | Title | What Shipped | UI Wiring | Severity |
|------|-------|--------------|-----------|----------|
| 38953992 | Stage verified clinic badge experience | VerifiedClinicBadge component, badge display logic, 2 clinics marked verified in DB | ✓ Wired (renders on ProviderCardV2, detail page, claim page) | — |
| 85bae31b | Stage account and provider portal experience | 105 files: consumer accts, provider portal, auth flows, save/activity APIs, migration tables | ✗ Ghost feature (no nav links) | HIGH |
| e2d3fed0 | Fix demo API JSON handling and privacy app section | Demo API JSON parsing fix, privacy disclosure for SIP/VoIP | ✓ Wired (forms POST to it) | — |
| 355180bb | Fix staging QA search and claim blockers | Claim page fixes, search matching improvements | ✓ Functional | — |
| d60a0a05 | Keep zero-data category pages logical | Category page fallback logic | ✓ Functional | — |
| e9d3c833 | Add doctor fallback for empty specialty hubs | Fallback when specialty has no doctors | ✓ Functional | — |
| 07774b35 | Fix directory search navigation and doctor route stability | Search controls expansion (insurance, language, condition, city, specialty), RouteLoadingOverlay, professionals search library | ✓ Fully functional (all filters visible and working) | — |
| 8334a9be | Fix staging tunnel binary detection | Infra fix | N/A | — |
| 8857a5bf | Harden inactive slot staging cleanup | Infra fix | N/A | — |
| db0c6440 | Limit DB pool during staging builds | Infra fix | N/A | — |

---

## Ghost Feature Catalog

### 1. Consumer Account System (HIGH SEVERITY)

**What it is:** Full user authentication, account dashboard, saved providers list, activity log, settings management.

**Where it lives:**
- Routes: `/account/`, `/account/activity`, `/account/saved`, `/account/settings`
- Auth: `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/dashboard-auth`
- API: `/api/account/*`, `/api/auth/*`
- Components: `src/components/account/` (SaveProviderButton, ConsumerAccountPrompt, LogoutButton, AccountSettingsForm, UnsaveProviderButton)
- DB tables: `consumer_users`, `consumer_password_reset_tokens`, `consumer_saved_providers`, `consumer_provider_events`

**What's missing:**
- ✗ No navigation link in `ZavisHeader.tsx` (the actual header on directory pages)
- ✗ No navigation link in `Footer.tsx` (directory footer)
- ✗ No navigation link in landing page Navbar/Footer
- ✗ No landing page CTA promoting account signup
- ✓ Link exists ONLY in `Header.tsx`, which is **NOT rendered anywhere on the live site**
- ✓ `ConsumerAccountPrompt` works programmatically (when user tries to save without auth)

**Fix recommendation:**
- Add account/login links to `ZavisHeader.tsx` top-right, near "Claim your listing"
- Add account/login conditional links to mobile drawer in ZavisHeader
- Consider landing page CTA: "Create account to save providers"

---

### 2. Provider Portal (HIGH SEVERITY)

**What it is:** Clinic management system with multi-user access, provider listing editing, invitations, edit requests.

**Where it lives:**
- Routes: `/provider-portal/`, `/provider-portal/login`, `/provider-portal/activate`, `/provider-portal/listings`, `/provider-portal/embed`
- API: `/api/provider-portal/*`, `/api/admin/provider-portal/*`
- Components: `src/components/provider-portal/*` (ProviderPortalLoginForm, ProviderListingEditForm, ProviderPortalActivateForm, etc.)
- DB tables: `clinic_organizations`, `clinic_users`, `clinic_memberships`, `provider_ownerships`, `clinic_invites`, `provider_edit_requests`, `provider_portal_sessions`, `provider_portal_audit_logs`

**What's missing:**
- ✗ No public entry point (no "Get started" or "For Clinics" link in nav)
- ✗ Only discoverable via direct URL or admin invite emails
- ✗ Landing pages don't mention the portal exists
- ✓ `OwnerWhatsappCta` button exists ("Get listed or edit") but routes to WhatsApp, not the portal

**Fix recommendation:**
- Add "Provider Portal" or "For Clinics" link in footer
- Create a `/provider-portal/signup` or `/provider-portal/request-access` landing page
- Update WhatsApp CTA flow: after a successful claim via WhatsApp, redirect/email the user to portal activation

---

### 3. SaveProviderButton Component Mismatch (MEDIUM SEVERITY)

**What it is:** Component that lets users save/unsave providers to their account.

**Where it lives:**
- Component: `src/components/account/SaveProviderButton.tsx`
- Imported by: `src/components/provider/ProviderCard.tsx` (legacy, used only on Arabic pages)
- **NOT imported by:** `src/components/directory-v2/cards/ProviderCardV2.tsx` (the main card on English/primary directory)

**What's missing:**
- ✗ SaveProviderButton absent from ProviderCardV2 (main search results / listing pages)
- ✗ Users cannot save providers from search results on the primary directory
- ✓ Save functionality available via ConsumerAccountPrompt (sidebar/sticky CTAs)

**Fix recommendation:**
- Add SaveProviderButton to ProviderCardV2 (or new V2 version)
- Verify it triggers ConsumerAccountPrompt for unauthenticated users

---

## Verified-Good Features

| Feature | Location | Wiring Status |
|---------|----------|---------------|
| Verified Clinic Badge | ProviderCardV2, ProviderDetailTemplate, claim page | ✓ Renders when `isVerified=true` |
| Demo API | `/api/notify-demo` | ✓ DemoForm.tsx and ContactPageClient.tsx POST correctly |
| Privacy SIP/VoIP Disclosure | PrivacyPolicyPageClient.tsx (lines 314–395) | ✓ Live in privacy policy |
| Search Controls Expansion | SearchControls.tsx | ✓ Insurance/language/condition/city/specialty/emergency toggle all work |
| Route Loading Overlay | RouteLoadingOverlay.tsx | ✓ Integrated into ZavisHeader navigation |
| Doctor Fallback Logic | Directory search pages | ✓ Shows doctors when specialty has no results |
| Claim Page Integration | `/claim`, `/claim/[listingId]` | ✓ Verified-badge display wired |

---

## Database Migration Status

All migrations created in past 4 days match schema.ts definitions:

| Migration | Tables | Status |
|-----------|--------|--------|
| `2026-04-30-provider-verification-badges.sql` | Updates `providers.is_verified` | ✓ Applied during promote-staged.sh |
| `2026-04-30-consumer-accounts.sql` | 4 tables | ✓ Matches schema |
| `2026-04-30-provider-portal.sql` | 8 tables | ✓ Matches schema |
| `2026-05-01-professionals-index-education-columns.sql` | Education columns | ✓ Additive, safe |

**No mismatches found.** All schema.ts definitions align with SQL migrations.

---

## Where Account/Portal Links DO Exist

- ✓ `Header.tsx` (lines 129, 236) — BUT this component is **NOT rendered on the live site**
- ✓ `ConsumerAccountPrompt.tsx` (lines 51, 57) — Only triggered programmatically
- ✓ Inside provider-portal forms (for internal redirects)

## Where They SHOULD Exist (But Don't)

- ✗ `ZavisHeader.tsx` — the actual header on all directory pages
- ✗ `Footer.tsx` — directory footer
- ✗ `landing/layout/Navbar.tsx` — landing page navbar
- ✗ `landing/layout/Footer.tsx` — landing footer

## What Users See

1. **Directory Pages:** Only "Claim your listing" and navigation; no account/login
2. **Landing Pages:** No account/auth options visible except WhatsApp "Get listed" CTA
3. **Save provider CTA:** Shows ConsumerAccountPrompt dialog, but no nav-bar Account link to direct users there afterward

---

## Open Questions

1. **Did the migrations actually run on production DB?**
   Verify with:
   ```sql
   SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='consumer_users');
   SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='clinic_organizations');
   ```

2. **Are the provider-portal invite emails set up?**
   The invite generation logic exists (`clinic_invites` table, invite routes), but email sending integration not verified. Check `/api/admin/provider-portal/invites/route.ts`.

3. **Is the verified clinic badge actually set for those 2 clinics in production?**
   ```sql
   SELECT id, slug, is_verified FROM providers WHERE id IN ('dha_01117', 'dha_03002');
   ```

4. **Why does `Header.tsx` exist if not rendered?**
   May be a legacy component or built for a future layout. Recommend clarifying or removing if unused.

5. **Are the SaveProviderButton omissions intentional?**
   Plausible if save is being phased in, but verify vs. missed integration.

---

## Severity Summary

| Severity | Count | Features |
|----------|-------|----------|
| HIGH | 2 | Consumer accounts (no nav), Provider portal (no entry point) |
| MEDIUM | 1 | SaveProviderButton missing from V2 cards |
| LOW | 1 | /dashboard-auth (internal, not an issue) |
| RESOLVED | 6 | Badge, demo API, privacy disclosure, search expansion, doctor fallback, claim flow |

---

## Recommendations (Priority Order)

1. **Add account/login links to `ZavisHeader.tsx`** (top right, conditional on session state — same pattern as `Header.tsx` already has)
2. **Add provider-portal entry point** (landing page section or footer "For Clinics" link)
3. **Verify migrations actually ran on production DB** (consumer_users and clinic_* tables exist and queryable)
4. **Test ConsumerAccountPrompt flow end-to-end** (save provider → prompt → signup → account works)
5. **Add SaveProviderButton to ProviderCardV2** (or document why intentionally absent)
6. **Clarify status of `Header.tsx`** (legacy vs future use; remove if truly unused)
7. **Verify email integration for provider-portal invites** (test invite creation and sending)
