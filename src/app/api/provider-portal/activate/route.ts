import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicInvites,
  clinicMemberships,
  clinicUsers,
  providerPortalAuditLogs,
} from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { readJsonObject } from "@/lib/http/read-json";
import {
  createProviderPortalSession,
  normalizePortalEmail,
  setProviderPortalSessionCookie,
} from "@/lib/provider-portal/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const token = String(body.token || "");
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || null;
    const phone = String(body.phone || "").trim() || null;

    if (!token) {
      return NextResponse.json({ error: "Activation token is required." }, { status: 400 });
    }
    if (!isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
    }

    const invite = (
      await db
        .select()
        .from(clinicInvites)
        .where(
          and(
            eq(clinicInvites.tokenHash, hashToken(token)),
            gt(clinicInvites.expiresAt, new Date()),
            isNull(clinicInvites.acceptedAt),
            isNull(clinicInvites.revokedAt)
          )
        )
        .limit(1)
    )[0];

    if (!invite) {
      return NextResponse.json({ error: "This activation link is invalid or expired." }, { status: 400 });
    }

    const email = normalizePortalEmail(invite.email);
    const passwordHash = await hashPassword(password);
    const now = new Date();

    let user = (
      await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.email, email))
        .limit(1)
    )[0];

    if (user) {
      await db
        .update(clinicUsers)
        .set({
          name: name || user.name,
          phone: phone || user.phone,
          passwordHash,
          status: "active",
          updatedAt: now,
        })
        .where(eq(clinicUsers.id, user.id));
    } else {
      user = {
        id: createId("clu"),
        email,
        name,
        phone,
        passwordHash,
        status: "active",
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(clinicUsers).values(user);
    }

    const existingMembership = (
      await db
        .select({ id: clinicMemberships.id })
        .from(clinicMemberships)
        .where(
          and(
            eq(clinicMemberships.organizationId, invite.organizationId),
            eq(clinicMemberships.userId, user.id)
          )
        )
        .limit(1)
    )[0];

    if (existingMembership) {
      await db
        .update(clinicMemberships)
        .set({ role: invite.role, status: "active", updatedAt: now })
        .where(eq(clinicMemberships.id, existingMembership.id));
    } else {
      await db.insert(clinicMemberships).values({
        id: createId("clm"),
        organizationId: invite.organizationId,
        userId: user.id,
        role: invite.role,
        status: "active",
      });
    }

    await db
      .update(clinicInvites)
      .set({ acceptedAt: now })
      .where(eq(clinicInvites.id, invite.id));

    await db
      .update(clinicUsers)
      .set({ lastLoginAt: now, updatedAt: now })
      .where(eq(clinicUsers.id, user.id));

    await db.insert(providerPortalAuditLogs).values({
      id: createId("pal"),
      organizationId: invite.organizationId,
      providerId: invite.providerId,
      actorUserId: user.id,
      actorType: "clinic_user",
      action: "clinic_invite_accepted",
      metadata: { inviteId: invite.id },
    });

    const session = await createProviderPortalSession({
      userId: user.id,
      organizationId: invite.organizationId,
      source: "activation",
    });

    const response = NextResponse.json({ ok: true, redirectTo: "/provider-portal" });
    setProviderPortalSessionCookie(response, session.token, session.expiresAt, request);
    return response;
  } catch (err) {
    console.error("[provider-portal] activation failed:", err);
    return NextResponse.json({ error: "Could not activate portal access." }, { status: 500 });
  }
}
