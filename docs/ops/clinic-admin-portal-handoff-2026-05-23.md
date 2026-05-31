# Clinic Claim + Provider Portal Handoff

Date: 2026-05-23  
Repo: `/Users/kankanaray/Zavis UAE Healthcare Directory and Journal`  
Purpose: handoff for Claude Code / Cloud Core to understand the clinic claim, portal access, staff admin, and listing-edit system already built in this repo.

## Product Goal

Clinics should be able to claim their public Zavis directory listing, get approved by Zavis, receive secure access to a clinic portal, and maintain their listing details.

The desired operating model from the discussions:

1. Clinic finds or requests its Zavis listing.
2. Clinic submits a claim / ownership request.
3. Zavis explicitly approves the clinic or grants access.
4. Only after Zavis approval, the clinic representative receives portal access.
5. Clinic representative signs in by email magic link, not by a shared password.
6. Clinic can edit and maintain its own listing.
7. Zavis staff with `@zavis.ai` emails can log in to QA any granted portal.
8. Clinics should not be able to self-generate portal links or self-activate without Zavis granting access.

## Important Current-State Summary

The active portal login flow is now magic-link based.

The old password activation route still exists:

- `/provider-portal/activate`
- `src/app/api/provider-portal/activate/route.ts`
- `src/components/provider-portal/ProviderPortalActivateForm.tsx`

But the currently wired invite/login path uses magic links:

- `/provider-portal/login`
- `/api/provider-portal/magic-link/request`
- `/api/provider-portal/magic-link/consume`
- `src/lib/provider-portal/magic.ts`
- `src/lib/provider-portal/invites.ts`

Do not assume clinics need a preset password. The expected flow is: invite/grant access -> magic-link email -> session cookie -> portal.

## Current User-Facing Routes

### Claim Pages

- `/claim`
  - Public indexed claim landing page.
  - Tells providers how to claim via WhatsApp.
  - File: `src/app/(directory)/claim/page.tsx`

- `/claim/[listingId]`
  - Listing-specific claim/edit page.
  - Opens WhatsApp claim/edit flow for a specific provider.
  - Robots: noindex.
  - File: `src/app/(directory)/claim/[listingId]/page.tsx`

### Provider Portal

- `/provider-portal`
  - Main clinic portal dashboard.
  - Requires `zavis_provider_portal_session`.
  - Shows owned listings, edit/history counts, verified counts.
  - File: `src/app/(provider-portal)/provider-portal/page.tsx`

- `/provider-portal/login`
  - Magic-link login UI.
  - Clinic teams can sign in only after Zavis grants access.
  - `@zavis.ai` staff can use this for provider QA and admin access.
  - File: `src/app/(provider-portal)/provider-portal/login/page.tsx`
  - Component: `src/components/provider-portal/ProviderPortalLoginForm.tsx`

- `/provider-portal/listings/[providerId]`
  - Listing edit screen for one provider.
  - Requires ownership/session or staff scoped access.
  - File: `src/app/(provider-portal)/provider-portal/listings/[providerId]/page.tsx`
  - Form: `src/components/provider-portal/ProviderListingEditForm.tsx`

- `/provider-portal/profile/[providerId]`
  - Profile/preview route for portal context.
  - Intended for iframe/embed review.

- `/provider-portal/embed`
  - Embed-token bootstrap route.
  - Validates HMAC token and starts a provider portal session.
  - File: `src/app/(provider-portal)/provider-portal/embed/page.tsx`
  - Component: `src/components/provider-portal/ProviderPortalEmbedBootstrap.tsx`

### Admin Routes

- `/admin/claims`
  - Legacy/admin claim review dashboard.
  - Uses dashboard key stored client-side in sessionStorage.
  - File: `src/app/(directory)/admin/claims/ClientPage.tsx`
  - API: `src/app/api/admin/claims/route.ts`
  - This is older and less secure than the magic-link staff portal model.

- `/admin/provider-portal`
  - Provider portal admin dashboard.
  - Requires a valid provider-portal session where `context.staff.isZavisStaff === true`.
  - Best entry: `/provider-portal/login?redirect=/admin/provider-portal`
  - Use a `@zavis.ai` email to receive a magic link.
  - File: `src/app/(directory)/admin/provider-portal/page.tsx`
  - Client: `src/app/(directory)/admin/provider-portal/ClientPage.tsx`

## Main Database Tables

Defined in `src/lib/db/schema.ts`.

### Claim / Ownership

- `claim_requests`
  - Claim request submitted for a provider.
  - Fields include contact name/email/phone, job title, proof type/document, requested changes, notes, status, reviewer metadata.

- `clinic_organizations`
  - Organization/account shell for a clinic group.
  - Created from claim approval or admin grant.

- `provider_ownerships`
  - Connects a provider listing to a clinic organization.
  - Active ownership is the gate for clinic listing access.
  - Includes source and `claimRequestId`.

### Users / Access

- `clinic_users`
  - Portal users.
  - Email is unique.
  - Password hash exists for legacy compatibility but magic-link users can have `passwordHash = null`.

- `clinic_memberships`
  - Connects users to clinic organizations with role and status.
  - Roles: `owner`, `manager`, `doctor`, `editor`, `viewer`.

- `clinic_invites`
  - Records Zavis-granted access invitations.
  - Has organization, provider, email, role, expiry, accepted/revoked fields.
  - Current magic-link flow uses this as the authorization source for non-staff users.

- `provider_portal_login_tokens`
  - One-time magic-link tokens.
  - 15-minute expiry.
  - Stores redirect target, provider scope, org scope, invite, role, used timestamp.

- `provider_portal_sessions`
  - 14-day portal session cookie backing store.
  - Cookie name: `zavis_provider_portal_session`.
  - Stores source and metadata.

### Edits / Audit

- `provider_edit_requests`
  - Older/queued edit-review model.
  - Admin endpoints still exist to approve/reject queued requests.

- `provider_portal_audit_logs`
  - Audit trail for invite creation, invite acceptance, listing updates, edit approvals/rejections.

## Auth and Access Model

### Clinic Access

Clinic users are authorized only if one of these is true:

1. They already have an active `clinic_users` row, active `clinic_memberships` row, and active `clinic_organizations` row.
2. They have a valid unaccepted, unrevoked, unexpired `clinic_invites` row.

Magic-link request endpoint:

- `POST /api/provider-portal/magic-link/request`
- File: `src/app/api/provider-portal/magic-link/request/route.ts`
- Calls `createAuthorizedProviderPortalMagicLink()`.
- Deliberately returns generic `{ ok: true }` even when the email is not authorized, so it does not reveal which emails have access.

Magic-link consume endpoint:

- `GET /api/provider-portal/magic-link/consume?token=...`
- File: `src/app/api/provider-portal/magic-link/consume/route.ts`
- Validates unused token.
- Creates/updates clinic user and membership if token came from invite.
- Marks invite accepted.
- Creates provider portal session.
- Sets `zavis_provider_portal_session` cookie.
- Redirects to stored `redirectTo`.

### Zavis Staff Access

Any normalized email ending in `@zavis.ai` is treated as Zavis staff for the provider portal magic-link flow.

Relevant functions:

- `isZavisStaffEmail()` in `src/lib/provider-portal/auth.ts`
- `ensureStaffClinicUser()` in `src/lib/provider-portal/staff.ts`
- `getStaffOrganizationId()` in `src/lib/provider-portal/staff.ts`

Staff behavior:

- Staff magic-link source is `zavis_staff_magic`.
- Consumed session source is `zavis_staff`.
- Staff sessions include metadata:
  - `isZavisStaff: true`
  - `providerId` if the redirect is scoped to `/provider-portal/listings/[providerId]` or `/provider-portal/profile/[providerId]`
  - `consumerUserId` currently null in magic-link flow.
- `/admin/provider-portal` requires staff session, not dashboard key.

Practical staff login:

```text
/provider-portal/login?redirect=/admin/provider-portal
```

For QA of one clinic listing:

```text
/provider-portal/login?redirect=/provider-portal/listings/<providerId>
```

Important: this uses provider ID, not provider slug.

### Legacy Password Paths

These still exist:

- `/api/provider-portal/login`
- `/api/provider-portal/activate`
- `/provider-portal/activate`

However:

- The current visible `/provider-portal/login` form sends magic links, not passwords.
- `createProviderPortalInvite()` currently returns `/provider-portal/login?...`, not `/provider-portal/activate?...`.
- Password activation should be considered legacy unless the product decision changes.

## Claim Approval Flow

Admin claim approval API:

- `PATCH /api/admin/claims`
- File: `src/app/api/admin/claims/route.ts`

When approving a claim:

1. Fetches `claim_requests`.
2. Calls `createProviderPortalInvite()`.
3. Creates or reuses `clinic_organizations`.
4. Creates active `provider_ownerships`.
5. Creates `clinic_invites`.
6. Creates a one-time `provider_portal_login_tokens` magic-link token.
7. Sends magic-link email best-effort.
8. Marks claim approved.
9. Marks provider as claimed.
10. Applies basic requested changes from claim if present.

Email dispatch:

- File: `src/lib/auth/email.ts`
- Function: `sendProviderPortalMagicLinkEmail()`
- Uses Plunk if `PLUNK_SECRET_KEY` exists.
- Falls back to Resend if `RESEND_API_KEY` exists.
- Logs warning if no provider is configured.

## Manual Access Grant Flow

Admin route:

- `POST /api/admin/provider-portal/invites`
- File: `src/app/api/admin/provider-portal/invites/route.ts`
- Requires `validateProviderPortalAdminAuth()`, which means active staff provider-portal session.

Dashboard:

- `/admin/provider-portal`
- UI section: "Grant clinic portal access"
- Fields:
  - `providerId`
  - `email`
  - `contactName`
  - `organizationName`
  - `role`

When submitted:

1. Verifies provider exists.
2. Calls `createProviderPortalInvite()`.
3. Marks provider `isClaimed = true`.
4. Returns `invite.accessUrl`.
5. UI displays/copies access URL.
6. Email is also sent best-effort through the same magic-link flow.

This satisfies the requirement that only Zavis can generate/grant portal access.

## Listing Edit Behavior

Editable fields are defined in `src/lib/provider-portal/edits.ts`:

- `phone`
- `phoneSecondary`
- `whatsapp`
- `email`
- `website`
- `address`
- `shortDescription`
- `description`
- `services`
- `insurance`
- `languages`
- `operatingHours`
- `logoUrl`
- `coverImageUrl`
- `photos`

UI form:

- `src/components/provider-portal/ProviderListingEditForm.tsx`

API:

- `PATCH /api/provider-portal/listings/[providerId]`
- File: `src/app/api/provider-portal/listings/[providerId]/route.ts`

Current behavior:

- Checks valid portal session.
- Rejects viewer role.
- Confirms provider is owned by the user org or staff-scoped.
- Sanitizes submitted payload.
- Directly updates the `providers` row.
- Revalidates provider/category/city paths.
- Purges Cloudflare path if Cloudflare env vars are configured.
- Writes `provider_portal_audit_logs` with `provider_listing_updated`.
- Returns public path and success message.

This matches the later user directive: do not keep an approval process for normal clinic edits; let approved clinics directly push updates.

Important inconsistency:

- The older `provider_edit_requests` queue and `/admin/provider-portal/edit-requests` approval UI still exist.
- But the current listing edit API does not create `provider_edit_requests`; it writes directly to `providers`.
- The admin edit-request screen is therefore legacy/unused unless another code path creates edit requests.

If the product decision is "direct edits only", keep direct-write behavior and either hide/archive the queued edit-request UI or label it legacy.

If the product decision changes back to "approval required", modify `PATCH /api/provider-portal/listings/[providerId]` to create `provider_edit_requests` instead of updating `providers` directly.

## Embedded Portal Flow

Intended for embedding the listing manager into another Zavis/platform surface or clinic-owned surface.

Token endpoint:

- `POST /api/provider-portal/embed-token`
- File: `src/app/api/provider-portal/embed-token/route.ts`
- Requires `x-provider-portal-secret`, `x-dashboard-key`, or `x-api-key`.
- Requires `PROVIDER_PORTAL_EMBED_SECRET`.
- Verifies active user/membership scope.
- Returns:
  - `token`
  - `expiresInSeconds`
  - `embedUrl`

Embed bootstrap:

- `/provider-portal/embed#token=<token>`
- Component reads token from hash fragment.
- Posts token to `/api/provider-portal/embed-session`.
- Starts session and redirects to `/provider-portal?embed=1`.

Security behavior:

- HMAC-SHA256 signed token.
- 5-minute TTL.
- One-time nonce checked via `provider_portal_sessions.metadata.embedNonce`.
- Session cookies use `SameSite=None` when secure.

## Required Environment Variables

Provider portal:

- `PROVIDER_PORTAL_EMBED_SECRET`
  - Required for embed-token generation and verification.

- `PROVIDER_PORTAL_COOKIE_SECURE`
  - Optional override for cookie secure detection.

Email:

- `PLUNK_SECRET_KEY`
  - Preferred current magic-link email provider.

- `RESEND_API_KEY`
  - Fallback email provider.

Base URL:

- `NEXT_PUBLIC_BASE_URL`
  - Used in invite/magic links.
  - Should be `https://www.zavis.ai` in production.

Admin:

- `DASHBOARD_KEY`
  - Still used by legacy `/admin/claims` and embed-token endpoint fallback.

Cloudflare purge from direct edits:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `CLOUDFLARE_PURGE_HOSTS`

Do not paste secret values into code or docs.

## Server / Deployment Protocol

For any public website code deploy, use the Zavis deployment skill and blue/green flow.

Mandatory references:

- `/Users/kankanaray/.codex/skills/zavis-website-deployment/SKILL.md`
- `/Users/kankanaray/.codex/skills/zavis-server-routing/SKILL.md`
- `~/Downloads/Zavis Servers.md`
- `~/Downloads/zavis-landing-2026-04-28-migration-and-ops.md`
- `docs/ops/deployment-mess-issue.md`
- `scripts/ec2-deploy-infra/stage.sh`
- `scripts/ec2-deploy-infra/promote-staged.sh`

Public website server:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47
```

Do not deploy the public website on `13.205.197.148`; that is the internal tools/MCP server.

Current known topology from the latest Codex staging work:

- Production active slot: `green`
- Active PM2 app: `zavis-green`
- Active port: `3201`
- Staged/inactive slot: `blue`
- Staged PM2 app: `zavis-blue`
- Staged port: `3200`
- Stage script: `/home/ubuntu/zavis-deploy/stage.sh`
- Promote script: `/home/ubuntu/zavis-deploy/promote-staged.sh`

Never patch/build the active production slot directly.

## QA Checklist For Claude Code / Cloud Core

### Admin Access

1. Open:

```text
/provider-portal/login?redirect=/admin/provider-portal
```

2. Enter a `@zavis.ai` email.
3. Confirm magic-link email is sent.
4. Click magic link.
5. Confirm `/admin/provider-portal` loads.

### Grant Access

1. In `/admin/provider-portal`, enter:
   - valid provider ID
   - clinic owner email
   - role, usually `manager` or `owner`
2. Submit grant.
3. Confirm provider becomes `isClaimed = true`.
4. Confirm `clinic_organizations`, `provider_ownerships`, `clinic_invites`, and `provider_portal_login_tokens` rows are created.
5. Confirm email dispatch logs show success or fallback.

### Clinic Login

1. Open `/provider-portal/login`.
2. Enter the invited clinic email.
3. Confirm generic success message.
4. Click magic link.
5. Confirm redirect to `/provider-portal` or scoped listing URL.
6. Confirm the clinic sees only owned listings.

### Staff QA For One Listing

1. Find provider ID.
2. Open:

```text
/provider-portal/login?redirect=/provider-portal/listings/<providerId>
```

3. Use `@zavis.ai` email.
4. Confirm staff can view/edit that specific listing.

### Edit Flow

1. Change one low-risk field, such as `phoneSecondary` or `shortDescription`, on staging only.
2. Save.
3. Confirm API returns success and public path.
4. Confirm provider public page reflects update on staged slot.
5. Confirm `provider_portal_audit_logs` has `provider_listing_updated`.
6. Confirm route revalidation and Cloudflare purge are called when configured.

### Security/Negative Cases

- Unknown non-staff email requesting magic link should still get generic `{ ok: true }` but receive no email.
- Viewer role should not be able to PATCH listing.
- Clinic user should not access provider outside its active ownership.
- Used magic-link token should not work again.
- Expired token should redirect to login error.
- Embed token should fail if reused due nonce check.

## Known Gaps / Cleanup Needed

1. Logo issue is unrelated but currently open in a separate handoff:
   - `docs/ops/claude-handoff-2026-05-23-logo-and-staging.md`

2. Two auth/admin models still coexist:
   - `/admin/provider-portal` uses staff magic-link session.
   - `/admin/claims` still uses `DASHBOARD_KEY` in sessionStorage.
   - Recommended: migrate claims admin to the same `@zavis.ai` magic-link staff model.

3. Password activation is legacy:
   - `/provider-portal/activate` still exists.
   - Current invites route users to magic-link login, not activation.
   - Recommended: either remove/hide legacy activation or keep it explicitly marked as fallback only.

4. Direct edits vs queued approvals:
   - Current desired behavior is direct edits.
   - Legacy queued edit-request schema/admin UI remains.
   - Recommended: remove from active admin UI or reframe as audit/history to avoid confusion.

5. Upload UX is basic:
   - Current edit form accepts URL strings for logo/cover/photos.
   - There is no first-class upload-to-R2 flow in the portal UI.
   - Recommended future work: image uploader with validation, compression/WebP, and moderation/audit.

6. Claim flow is still WhatsApp-first:
   - `/claim` routes to WhatsApp CTA.
   - Claim rows exist and admin API approves them, but the public claim form itself is not a full web form in the current route.
   - Recommended: decide whether claims stay WhatsApp-first or move to an in-app form.

7. Provider IDs are required in admin grant UI:
   - `/admin/provider-portal` currently asks for raw provider ID.
   - Recommended: add provider search/autocomplete by clinic name/slug.

8. Email deliverability must be verified in production:
   - Plunk credentials are expected to be available.
   - If missing, dispatch falls back to console warning and admin must copy access URL manually.

9. Staff direct access is broad by domain:
   - Any `@zavis.ai` email can get staff portal session.
   - This is convenient for internal QA, but for production hygiene consider allow-listing specific staff emails or checking a staff role table.

10. Revalidation/purge is path-based:
    - Direct edit API revalidates provider/category/city paths and purges Cloudflare path.
    - Verify this on staging/prod after any portal edit changes.

## Files Most Likely To Touch Next

Auth/session:

- `src/lib/provider-portal/auth.ts`
- `src/lib/provider-portal/magic.ts`
- `src/lib/provider-portal/staff.ts`
- `src/lib/provider-portal/current-user.ts`

Invites/access:

- `src/lib/provider-portal/invites.ts`
- `src/app/api/admin/provider-portal/invites/route.ts`
- `src/app/api/provider-portal/magic-link/request/route.ts`
- `src/app/api/provider-portal/magic-link/consume/route.ts`

Portal UI:

- `src/app/(provider-portal)/provider-portal/page.tsx`
- `src/app/(provider-portal)/provider-portal/login/page.tsx`
- `src/app/(provider-portal)/provider-portal/listings/[providerId]/page.tsx`
- `src/components/provider-portal/ProviderPortalLoginForm.tsx`
- `src/components/provider-portal/ProviderListingEditForm.tsx`

Admin UI:

- `src/app/(directory)/admin/provider-portal/page.tsx`
- `src/app/(directory)/admin/provider-portal/ClientPage.tsx`
- `src/app/(directory)/admin/claims/ClientPage.tsx`

Claim flow:

- `src/app/(directory)/claim/page.tsx`
- `src/app/(directory)/claim/[listingId]/page.tsx`
- `src/app/api/admin/claims/route.ts`
- `src/components/owner/OwnerWhatsappCta.tsx`

DB:

- `src/lib/db/schema.ts`
- `scripts/db/migrations/2026-04-30-provider-portal.sql`
- `scripts/db/migrations/2026-05-16-provider-portal-magic-links.sql`

Email:

- `src/lib/auth/email.ts`
- `src/lib/research/plunk.ts`

## Do Not Do

- Do not allow clinics to self-generate portal access without a Zavis-created invite/grant.
- Do not expose whether an arbitrary email is authorized in magic-link responses.
- Do not deploy directly to the active production slot.
- Do not use the internal tools server for public website changes.
- Do not touch indexed provider URL structure while working on the portal.
- Do not noindex or suppress Turkey pages.
- Do not reintroduce password-only clinic login as the primary flow.

