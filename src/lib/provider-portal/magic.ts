import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicInvites,
  clinicMemberships,
  clinicOrganizations,
  clinicUsers,
  providerPortalLoginTokens,
  providers,
} from "@/lib/db/schema";
import { createPlainToken, hashToken } from "@/lib/auth/tokens";
import { createId } from "@/lib/id";
import {
  isProviderPortalRole,
  isZavisStaffEmail,
  normalizePortalEmail,
} from "@/lib/provider-portal/auth";
import { getStaffOrganizationId } from "@/lib/provider-portal/staff";
import { sendProviderPortalMagicLinkEmail } from "@/lib/auth/email";

export function normalizeProviderPortalRedirect(value: unknown): string {
  const redirect = typeof value === "string" ? value.trim() : "";
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/provider-portal";
  }
  return redirect;
}

export function extractProviderIdFromPortalRedirect(redirect: string): string | null {
  try {
    const url = new URL(redirect, "https://www.zavis.ai");
    const match = url.pathname.match(/^\/provider-portal\/(?:listings|profile)\/([^/]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function getBaseUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || "https://www.zavis.ai";
  if (configured) return configured.replace(/\/$/, "");
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  }
  return "https://www.zavis.ai";
}

async function getProviderName(providerId: string | null) {
  if (!providerId) return null;
  const provider = (
    await db
      .select({ name: providers.name })
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1)
  )[0];
  return provider?.name || null;
}

export async function createAuthorizedProviderPortalMagicLink(input: {
  email: string;
  redirect: unknown;
  requestUrl?: string;
}) {
  const email = normalizePortalEmail(input.email);
  const redirectTo = normalizeProviderPortalRedirect(input.redirect);
  const redirectProviderId = extractProviderIdFromPortalRedirect(redirectTo);
  const now = new Date();

  if (!email) {
    return { sent: false as const, reason: "missing_email" as const };
  }

  let organizationId: string | null = null;
  let providerId: string | null = redirectProviderId;
  let inviteId: string | null = null;
  let role = "manager";
  let source = "magic_link";

  if (isZavisStaffEmail(email)) {
    source = "zavis_staff_magic";
    organizationId = await getStaffOrganizationId(providerId);
    role = "owner";
  } else {
    const activeMembership = (
      await db
        .select({
          organizationId: clinicMemberships.organizationId,
          role: clinicMemberships.role,
          providerId: clinicInvites.providerId,
        })
        .from(clinicUsers)
        .innerJoin(clinicMemberships, eq(clinicMemberships.userId, clinicUsers.id))
        .innerJoin(
          clinicOrganizations,
          eq(clinicMemberships.organizationId, clinicOrganizations.id)
        )
        .leftJoin(
          clinicInvites,
          and(
            eq(clinicInvites.email, clinicUsers.email),
            eq(clinicInvites.organizationId, clinicMemberships.organizationId)
          )
        )
        .where(
          and(
            eq(clinicUsers.email, email),
            eq(clinicUsers.status, "active"),
            eq(clinicMemberships.status, "active"),
            eq(clinicOrganizations.status, "active")
          )
        )
        .limit(1)
    )[0];

    if (activeMembership) {
      organizationId = activeMembership.organizationId;
      role = isProviderPortalRole(activeMembership.role) ? activeMembership.role : "manager";
      providerId = providerId || activeMembership.providerId || null;
    } else {
      const invite = (
        await db
          .select()
          .from(clinicInvites)
          .where(
            and(
              eq(clinicInvites.email, email),
              gt(clinicInvites.expiresAt, now),
              isNull(clinicInvites.acceptedAt),
              isNull(clinicInvites.revokedAt)
            )
          )
          .limit(1)
      )[0];

      if (!invite) {
        return { sent: false as const, reason: "not_authorized" as const };
      }

      organizationId = invite.organizationId;
      providerId = providerId || invite.providerId || null;
      inviteId = invite.id;
      role = isProviderPortalRole(invite.role) ? invite.role : "manager";
      source = "invite_magic_link";
    }
  }

  if (!organizationId) {
    return { sent: false as const, reason: "not_authorized" as const };
  }

  const token = createPlainToken(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

  await db.insert(providerPortalLoginTokens).values({
    id: createId("plt"),
    email,
    tokenHash: hashToken(token),
    source,
    redirectTo,
    providerId,
    organizationId,
    inviteId,
    role,
    expiresAt,
    metadata: {},
  });

  const magicLinkUrl = `${getBaseUrl(input.requestUrl)}/api/provider-portal/magic-link/consume?token=${encodeURIComponent(
    token
  )}`;

  await sendProviderPortalMagicLinkEmail({
    to: email,
    magicLinkUrl,
    expiresAt,
    providerName: await getProviderName(providerId),
  });

  return { sent: true as const, expiresAt };
}
