import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicMemberships,
  clinicOrganizations,
  clinicUsers,
  consumerUsers,
} from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { readJsonObject } from "@/lib/http/read-json";
import {
  createProviderPortalSession,
  isZavisStaffEmail,
  normalizePortalEmail,
  setProviderPortalSessionCookie,
} from "@/lib/provider-portal/auth";
import {
  ensureStaffClinicUser,
  getStaffOrganizationId,
} from "@/lib/provider-portal/staff";

export const dynamic = "force-dynamic";

function normalizeRedirect(value: unknown): string {
  const redirect = typeof value === "string" ? value.trim() : "";
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/provider-portal";
  }
  return redirect;
}

function extractProviderIdFromRedirect(redirect: string): string | null {
  try {
    const url = new URL(redirect, "https://www.zavis.ai");
    const match = url.pathname.match(/^\/provider-portal\/(?:listings|profile)\/([^/]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const email = normalizePortalEmail(String(body.email || ""));
    const password = String(body.password || "");
    const redirectTo = normalizeRedirect(body.redirect);
    const staffProviderId = extractProviderIdFromRedirect(redirectTo);

    const user = (
      await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.email, email))
        .limit(1)
    )[0];

    let clinicPasswordMatched = false;
    if (user?.passwordHash && user.status === "active") {
      clinicPasswordMatched = await verifyPassword(password, user.passwordHash);
      if (clinicPasswordMatched) {
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

        if (membership) {
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

          const response = NextResponse.json({ ok: true, redirectTo });
          setProviderPortalSessionCookie(response, session.token, session.expiresAt, request);
          return response;
        }
      }
    }

    if (!isZavisStaffEmail(email)) {
      return NextResponse.json(
        {
          error: clinicPasswordMatched
            ? "No active clinic access found."
            : "Email or password is incorrect.",
        },
        { status: clinicPasswordMatched ? 403 : 401 }
      );
    }

    const staffAccount = (
      await db
        .select()
        .from(consumerUsers)
        .where(eq(consumerUsers.email, email))
        .limit(1)
    )[0];

    if (!staffAccount) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const staffPasswordOk = await verifyPassword(password, staffAccount.passwordHash);
    if (!staffPasswordOk) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const staffClinicUser = await ensureStaffClinicUser({
      email,
      name: staffAccount.name,
    });
    const organizationId = await getStaffOrganizationId(staffProviderId);
    const now = new Date();

    await db
      .update(consumerUsers)
      .set({ lastLoginAt: now, updatedAt: now })
      .where(eq(consumerUsers.id, staffAccount.id));

    const session = await createProviderPortalSession({
      userId: staffClinicUser.id,
      organizationId,
      source: "zavis_staff",
      metadata: {
        isZavisStaff: true,
        consumerUserId: staffAccount.id,
        providerId: staffProviderId,
        redirectTo,
      },
    });

    const response = NextResponse.json({ ok: true, redirectTo });
    setProviderPortalSessionCookie(response, session.token, session.expiresAt, request);
    return response;
  } catch (err) {
    console.error("[provider-portal] login failed:", err);
    return NextResponse.json({ error: "Could not log in." }, { status: 500 });
  }
}
