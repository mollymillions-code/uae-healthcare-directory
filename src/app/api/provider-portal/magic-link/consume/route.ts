import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicInvites,
  clinicMemberships,
  clinicUsers,
  providerPortalAuditLogs,
  providerPortalLoginTokens,
} from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { hashToken } from "@/lib/auth/tokens";
import {
  createProviderPortalSession,
  isZavisStaffEmail,
  normalizePortalEmail,
  setProviderPortalSessionCookie,
} from "@/lib/provider-portal/auth";
import { ensureStaffClinicUser } from "@/lib/provider-portal/staff";

export const dynamic = "force-dynamic";

async function ensureClinicUser(input: {
  email: string;
  name?: string | null;
  organizationId: string;
  role: string;
}) {
  const now = new Date();
  let user = (
    await db
      .select()
      .from(clinicUsers)
      .where(eq(clinicUsers.email, input.email))
      .limit(1)
  )[0];

  if (user) {
    await db
      .update(clinicUsers)
      .set({
        name: input.name || user.name,
        status: "active",
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(clinicUsers.id, user.id));
  } else {
    user = {
      id: createId("clu"),
      email: input.email,
      name: input.name || null,
      phone: null,
      passwordHash: null,
      status: "active",
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(clinicUsers).values(user);
  }

  const membership = (
    await db
      .select({ id: clinicMemberships.id })
      .from(clinicMemberships)
      .where(
        and(
          eq(clinicMemberships.organizationId, input.organizationId),
          eq(clinicMemberships.userId, user.id)
        )
      )
      .limit(1)
  )[0];

  if (membership) {
    await db
      .update(clinicMemberships)
      .set({ role: input.role, status: "active", updatedAt: now })
      .where(eq(clinicMemberships.id, membership.id));
  } else {
    await db.insert(clinicMemberships).values({
      id: createId("clm"),
      organizationId: input.organizationId,
      userId: user.id,
      role: input.role,
      status: "active",
    });
  }

  return user;
}

async function consumeMagicToken(request: NextRequest, token: string) {
  if (!token) {
    return NextResponse.redirect(new URL("/provider-portal/login?error=missing_token", request.url));
  }

  const now = new Date();
  const loginToken = (
    await db
      .select()
      .from(providerPortalLoginTokens)
      .where(
        and(
          eq(providerPortalLoginTokens.tokenHash, hashToken(token)),
          gt(providerPortalLoginTokens.expiresAt, now),
          isNull(providerPortalLoginTokens.usedAt)
        )
      )
      .limit(1)
  )[0];

  if (!loginToken || !loginToken.organizationId) {
    return NextResponse.redirect(new URL("/provider-portal/login?error=expired", request.url));
  }

  const email = normalizePortalEmail(loginToken.email);
  const role = loginToken.role || "manager";
  let userId: string;
  let source = "magic_link";
  let metadata: Record<string, unknown> = {
    providerId: loginToken.providerId,
    redirectTo: loginToken.redirectTo,
  };

  if (loginToken.source === "zavis_staff_magic" && isZavisStaffEmail(email)) {
    const staffUser = await ensureStaffClinicUser({
      email,
      name: email.split("@")[0] || null,
    });
    userId = staffUser.id;
    source = "zavis_staff";
    metadata = {
      ...metadata,
      isZavisStaff: true,
      consumerUserId: null,
    };
  } else {
    const clinicUser = await ensureClinicUser({
      email,
      organizationId: loginToken.organizationId,
      role,
    });
    userId = clinicUser.id;

    if (loginToken.inviteId) {
      await db
        .update(clinicInvites)
        .set({ acceptedAt: now })
        .where(eq(clinicInvites.id, loginToken.inviteId));

      await db.insert(providerPortalAuditLogs).values({
        id: createId("pal"),
        organizationId: loginToken.organizationId,
        providerId: loginToken.providerId,
        actorUserId: clinicUser.id,
        actorType: "clinic_user",
        action: "clinic_invite_accepted_magic_link",
        metadata: { inviteId: loginToken.inviteId },
      });
    }
  }

  await db
    .update(providerPortalLoginTokens)
    .set({ usedAt: now })
    .where(eq(providerPortalLoginTokens.id, loginToken.id));

  const session = await createProviderPortalSession({
    userId,
    organizationId: loginToken.organizationId,
    source,
    metadata,
  });

  const response = NextResponse.redirect(new URL(loginToken.redirectTo, request.url));
  setProviderPortalSessionCookie(response, session.token, session.expiresAt, request);
  return response;
}

export async function GET(request: NextRequest) {
  return consumeMagicToken(request, request.nextUrl.searchParams.get("token") || "");
}
