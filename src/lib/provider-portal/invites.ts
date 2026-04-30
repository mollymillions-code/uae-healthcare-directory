import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicInvites,
  clinicOrganizations,
  providerOwnerships,
  providerPortalAuditLogs,
  providers,
} from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { createPlainToken, hashToken } from "@/lib/auth/tokens";
import { normalizePortalEmail, type ProviderPortalRole } from "@/lib/provider-portal/auth";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://www.zavis.ai").replace(/\/$/, "");
}

export async function createProviderPortalInvite(input: {
  providerId: string;
  email: string;
  contactName?: string | null;
  contactPhone?: string | null;
  role?: ProviderPortalRole;
  claimRequestId?: string | null;
  createdBy?: string | null;
  source?: string;
  organizationName?: string | null;
}) {
  const email = normalizePortalEmail(input.email);
  const provider = (
    await db
      .select({
        id: providers.id,
        name: providers.name,
        website: providers.website,
        phone: providers.phone,
      })
      .from(providers)
      .where(eq(providers.id, input.providerId))
      .limit(1)
  )[0];

  if (!provider) {
    throw new Error("Provider not found");
  }

  const existingOwnership = (
    await db
      .select({
        id: providerOwnerships.id,
        organizationId: providerOwnerships.organizationId,
      })
      .from(providerOwnerships)
      .where(
        and(
          eq(providerOwnerships.providerId, provider.id),
          eq(providerOwnerships.status, "active")
        )
      )
      .limit(1)
  )[0];

  let organizationId = existingOwnership?.organizationId;
  if (!organizationId) {
    const orgName = input.organizationName || provider.name;
    organizationId = createId("org");
    await db.insert(clinicOrganizations).values({
      id: organizationId,
      name: orgName,
      slug: `${slugify(orgName)}-${organizationId.slice(-5)}`,
      primaryEmail: email,
      phone: input.contactPhone || provider.phone || null,
      website: provider.website || null,
      source: input.source || "claim",
    });
  }

  const ownership = existingOwnership
    ? existingOwnership
    : (
        await db
          .insert(providerOwnerships)
          .values({
            id: createId("own"),
            providerId: provider.id,
            organizationId,
            status: "active",
            source: input.source || "claim_approved",
            claimRequestId: input.claimRequestId || null,
            approvedBy: input.createdBy || null,
            approvedAt: new Date(),
          })
          .returning({ id: providerOwnerships.id, organizationId: providerOwnerships.organizationId })
      )[0];

  const plainToken = createPlainToken(32);
  const inviteId = createId("inv");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await db.insert(clinicInvites).values({
    id: inviteId,
    organizationId,
    providerId: provider.id,
    email,
    role: input.role || "manager",
    tokenHash: hashToken(plainToken),
    expiresAt,
    createdBy: input.createdBy || null,
  });

  await db.insert(providerPortalAuditLogs).values({
    id: createId("pal"),
    organizationId,
    providerId: provider.id,
    actorType: "admin",
    action: "clinic_invite_created",
    metadata: {
      inviteId,
      ownershipId: ownership.id,
      email,
      role: input.role || "manager",
      claimRequestId: input.claimRequestId || null,
    },
  });

  const activationUrl = `${getBaseUrl()}/provider-portal/activate?token=${encodeURIComponent(
    plainToken
  )}`;

  return {
    inviteId,
    organizationId,
    providerId: provider.id,
    activationUrl,
    expiresAt,
  };
}
