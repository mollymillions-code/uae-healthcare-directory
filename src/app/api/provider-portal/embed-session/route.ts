import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicMemberships,
  clinicOrganizations,
  clinicUsers,
  providerPortalSessions,
} from "@/lib/db/schema";
import { readJsonObject } from "@/lib/http/read-json";
import {
  createProviderPortalSession,
  setProviderPortalSessionCookie,
  verifyProviderPortalEmbedToken,
} from "@/lib/provider-portal/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const token = String(body.token || "");
    const payload = verifyProviderPortalEmbedToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired embed token." }, { status: 401 });
    }

    const user = (
      await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.id, payload.userId))
        .limit(1)
    )[0];
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Clinic user is not active." }, { status: 403 });
    }

    const membership = (
      await db
        .select({ id: clinicMemberships.id })
        .from(clinicMemberships)
        .innerJoin(
          clinicOrganizations,
          eq(clinicMemberships.organizationId, clinicOrganizations.id)
        )
        .where(
          and(
            eq(clinicMemberships.userId, payload.userId),
            eq(clinicMemberships.organizationId, payload.organizationId),
            eq(clinicMemberships.status, "active"),
            eq(clinicOrganizations.status, "active")
          )
        )
        .limit(1)
    )[0];
    if (!membership) {
      return NextResponse.json({ error: "No active organization membership found." }, { status: 403 });
    }

    const consumedNonce = (
      await db
        .select({ id: providerPortalSessions.id })
        .from(providerPortalSessions)
        .where(sql`${providerPortalSessions.metadata}->>'embedNonce' = ${payload.nonce}`)
        .limit(1)
    )[0];
    if (consumedNonce) {
      return NextResponse.json({ error: "Embed token has already been used." }, { status: 409 });
    }

    const session = await createProviderPortalSession({
      userId: payload.userId,
      organizationId: payload.organizationId,
      source: payload.source || "b2b_embed",
      metadata: { embedNonce: payload.nonce },
    });

    const response = NextResponse.json({ ok: true, redirectTo: "/provider-portal?embed=1" });
    setProviderPortalSessionCookie(response, session.token, session.expiresAt, request);
    return response;
  } catch (err) {
    console.error("[provider-portal] embed session failed:", err);
    return NextResponse.json({ error: "Could not start embedded session." }, { status: 500 });
  }
}
