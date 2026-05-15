import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicOrganizations,
  clinicUsers,
  providerOwnerships,
} from "@/lib/db/schema";
import { createId } from "@/lib/id";

export const ZAVIS_STAFF_ORGANIZATION_ID = "org_zavis_staff";

export async function ensureStaffOrganization() {
  const existing = (
    await db
      .select({ id: clinicOrganizations.id })
      .from(clinicOrganizations)
      .where(eq(clinicOrganizations.id, ZAVIS_STAFF_ORGANIZATION_ID))
      .limit(1)
  )[0];

  if (existing) return existing.id;

  await db
    .insert(clinicOrganizations)
    .values({
      id: ZAVIS_STAFF_ORGANIZATION_ID,
      name: "Zavis Staff",
      slug: "zavis-staff",
      primaryEmail: "ops@zavis.ai",
      status: "active",
      source: "zavis_staff",
    })
    .onConflictDoNothing();

  return ZAVIS_STAFF_ORGANIZATION_ID;
}

export async function getStaffOrganizationId(providerId: string | null) {
  if (providerId) {
    const ownership = (
      await db
        .select({ organizationId: providerOwnerships.organizationId })
        .from(providerOwnerships)
        .innerJoin(
          clinicOrganizations,
          eq(providerOwnerships.organizationId, clinicOrganizations.id)
        )
        .where(
          and(
            eq(providerOwnerships.providerId, providerId),
            eq(providerOwnerships.status, "active"),
            eq(clinicOrganizations.status, "active")
          )
        )
        .limit(1)
    )[0];
    if (ownership) return ownership.organizationId;
  }

  return ensureStaffOrganization();
}

export async function ensureStaffClinicUser(input: {
  email: string;
  name: string | null;
}) {
  const now = new Date();
  const existing = (
    await db
      .select()
      .from(clinicUsers)
      .where(eq(clinicUsers.email, input.email))
      .limit(1)
  )[0];

  if (existing) {
    await db
      .update(clinicUsers)
      .set({
        name: input.name || existing.name,
        status: "active",
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(clinicUsers.id, existing.id));
    return { ...existing, name: input.name || existing.name, status: "active" };
  }

  const user = {
    id: createId("clu"),
    email: input.email,
    name: input.name,
    phone: null,
    passwordHash: null,
    status: "active",
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(clinicUsers).values(user);
  return user;
}
