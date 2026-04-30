import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicMemberships, clinicOrganizations, clinicUsers } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
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
    const email = normalizePortalEmail(String(body.email || ""));
    const password = String(body.password || "");

    const user = (
      await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.email, email))
        .limit(1)
    )[0];

    if (!user || !user.passwordHash || user.status !== "active") {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const membership = (
      await db
        .select({ organizationId: clinicMemberships.organizationId })
        .from(clinicMemberships)
        .innerJoin(
          clinicOrganizations,
          eq(clinicMemberships.organizationId, clinicOrganizations.id)
        )
        .where(
          and(
            eq(clinicMemberships.userId, user.id),
            eq(clinicMemberships.status, "active"),
            eq(clinicOrganizations.status, "active")
          )
        )
        .limit(1)
    )[0];

    if (!membership) {
      return NextResponse.json({ error: "No active clinic access found." }, { status: 403 });
    }

    const now = new Date();
    await db
      .update(clinicUsers)
      .set({ lastLoginAt: now, updatedAt: now })
      .where(eq(clinicUsers.id, user.id));

    const session = await createProviderPortalSession({
      userId: user.id,
      organizationId: membership.organizationId,
      source: "login",
    });

    const response = NextResponse.json({ ok: true, redirectTo: "/provider-portal" });
    setProviderPortalSessionCookie(response, session.token, session.expiresAt, request);
    return response;
  } catch (err) {
    console.error("[provider-portal] login failed:", err);
    return NextResponse.json({ error: "Could not log in." }, { status: 500 });
  }
}
