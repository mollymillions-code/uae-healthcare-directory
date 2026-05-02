# Clinic Portal (`/provider-portal`) Intended Use Case

## Executive Summary

The provider portal is a **clinic self-service tool for managing their own healthcare provider listings** on Zavis. Clinics embed the portal on their own website as an iframe; their staff login with signed embed tokens and edit key information (phone, email, WhatsApp, hours, services, insurance, languages, logo, photos, etc.). Changes go through admin approval workflows.

## Stated Intent (from Codex sessions & codebase)

From the April 30 memory summaries and code review, the user planned:

> "Planned routes included `/provider-portal/listings/[providerId]`, edits/media/verification subroutes, `/provider-portal/settings/team`, and compact-shell embed routes. Notes said there should be no public website navbar or consumer directory nav in the iframe version; it should feel like an embedded admin tool."

The portal is **not** a public-facing directory view. It is a **staff/admin workspace** that clinics embed on their own infrastructure.

## Portal Onboarding Flow

```
1. Clinic claims provider(s) via WhatsApp claim flow
   ↓
2. Zavis admin approves the claim
   ↓
3. claim_request → clinic_organization (created)
                 → provider_ownerships (approved)
   ↓
4. Clinic staff invited via email to join portal
   ↓
5. Staff accepts invite (clinic_invites.accepted_at)
   ↓
6. Staff activates account or uses /provider-portal/login
   ↓
7. Staff gets signed embed token (PROVIDER_PORTAL_EMBED_SECRET HMAC)
   ↓
8. Clinic embeds portal on own website via iframe + token in URL fragment
   #token=<base64url-payload>.<hmac-signature>
   ↓
9. /provider-portal/embed bootstrap validates token and creates session
   ↓
10. Staff lands on /provider-portal/listings or /provider-portal
```

## The Embed Flow (`/provider-portal/embed`)

**Mechanism**: Signed HMAC-SHA256 embed tokens passed as URL fragments.

**Token payload**:
- `userId`, `organizationId`, `email`, `role` (owner/manager/doctor/editor/viewer)
- `source`, `iat`, `exp`, `nonce` (one-time use)
- TTL: 5 minutes by default; short-lived for security

**Entry point**: 
- Clinic's website includes iframe pointing to `https://zavis.ai/provider-portal/embed#token=<token>`
- Client-side `ProviderPortalEmbedBootstrap` reads token from fragment
- Validates token and creates `provider_portal_sessions` record
- One-time nonce prevents token replay
- Redirects to `/provider-portal?embed=1` (scoped to parent frame origin via postMessage)

**No separate password required** for embed flow; token is credential.

## Portal Features & Editable Fields

**Clinic staff can edit (subject to admin approval)**:
- Provider listing: phone, email, WhatsApp, website, address
- Hours of operation
- Services & specialties
- Insurance & languages accepted
- Description / bio
- Logo, cover image, gallery photos
- Proof documents / verification assets

**Workflows**:
- Changes → `provider_edit_requests` (pending admin review)
- Admin approves/rejects in `/admin/provider-portal`
- Audit logged in `provider_portal_audit_logs`

## Relationship to WhatsApp Claim Flow

**Sequence** (inferred from schema):

1. Patient claims provider via WhatsApp (creates `claim_requests`)
2. Zavis admin approves claim
3. Upon approval, creates/links:
   - `clinic_organizations` (if new) with `source = 'claim'`
   - `provider_ownerships` with `source = 'claim_approved'`
4. Clinic staff invited to manage portal
5. Portal is Phase 2: after WhatsApp claims are verified

**Not a replacement**: Portal is for clinic-initiated updates; claims are patient-initiated. Both feed the same provider record.

## Not in Chats

- **Pricing tiers / paywall**: not mentioned. Portal appears to be free for all clinics.
- **Public "Get Listed" entry point**: not in chats. Recommend checking if there's a `/for-clinics` or clinic signup page.
- **Relationship to main Zavis SaaS product**: not clarified in chats. Portal may be separate from a clinic ops platform.
- **Email templates**: invite flow exists but exact template not reviewed.
- **Which roles can approve edits**: inferred as "admin" but role structure not fully detailed.

## Key Decisions Made

1. **Embed-first, not standalone login**: Clinic website owns the framing; Zavis portal is a component.
2. **No public navbar in iframe**: Portal feels like an internal admin tool, not a consumer directory view.
3. **Admin approval for all changes**: Changes don't auto-publish; audit trail required.
4. **One-time tokens**: Nonce-based security; tokens can't be replayed.
5. **Session cookies with SameSite adaptation**: Secure token handling for cross-origin embeds.

## Open Questions

1. How are clinic staff invited? (Email templates not reviewed)
2. What is the "Get Listed" entry point for clinic discovery? (Not in provider portal code)
3. Is there a separate clinic ops/SaaS product that this portal complements?
4. Do paid tiers exist, or is portal free?
5. Role-based access control: which roles can approve `provider_edit_requests`?
6. Is there a bulk clinic onboarding flow beyond individual claims?

## Staging & Rollout Notes

From April 30 session:

- Fresh staging deployment needed with SQL migration applied
- `PROVIDER_PORTAL_EMBED_SECRET` must be set in `/home/ubuntu/zavis-landing/.env.local`
- Verify `X-Frame-Options` headers don't block cross-origin iframe embedding
- End-to-end testing required: embed flow, edit requests, admin approval, audit logs
- After approval, swap green/live slot and purge cache

---

**Last updated**: May 1, 2026  
**Source**: Codex session memory summaries (April 30, 2026), codebase inspection  
**Confidence**: High for embed flow mechanics; medium for full onboarding story (WhatsApp integration details inferred from schema only)
