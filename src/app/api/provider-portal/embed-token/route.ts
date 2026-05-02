import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicOrganizations,
  clinicMemberships,
  clinicUsers,
  providerOwnerships,
} from "@/lib/db/schema";
import { readJsonObject } from "@/lib/http/read-json";
import {
  isProviderPortalRole,
  normalizePortalEmail,
  signProviderPortalEmbedToken,
} from "@/lib/provider-portal/auth";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const supplied =
    request.headers.get("x-provider-portal-secret") ||
    request.headers.get("x-dashboard-key") ||
    request.headers.get("x-api-key");
  const portalSecret = process.env.PROVIDER_PORTAL_EMBED_SECRET;
  const dashboardKey = process.env.DASHBOARD_KEY;
  return Boolean(
    supplied &&
      ((portalSecret && supplied === portalSecret) ||
        (dashboardKey && supplied === dashboardKey))
  );
}

export async function POST(request: NextRequest) {
  if (!process.env.PROVIDER_PORTAL_EMBED_SECRET) {
    return NextResponse.json(
      { error: "PROVIDER_PORTAL_EMBED_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const email = normalizePortalEmail(String(body.email || ""));
    const providerId = body.providerId ? String(body.providerId) : null;
    const organizationId = body.organizationId ? String(body.organizationId) : null;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const user = (
      await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.email, email))
        .limit(1)
    )[0];
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "No active clinic user found for this email." }, { status: 404 });
    }

    let membership = null as null | { organizationId: string; role: string };
    if (organizationId) {
      membership = (
        await db
          .select({
            organizationId: clinicMemberships.organizationId,
            role: clinicMemberships.role,
          })
          .from(clinicMemberships)
          .innerJoin(
            clinicOrganizations,
            eq(clinicMemberships.organizationId, clinicOrganizations.id)
          )
          .where(
            and(
              eq(clinicMemberships.userId, user.id),
              eq(clinicMemberships.organizationId, organizationId),
              eq(clinicMemberships.status, "active"),
              eq(clinicOrganizations.status, "active")
            )
          )
          .limit(1)
      )[0] ?? null;
    } else if (providerId) {
      membership = (
        await db
          .select({
            organizationId: clinicMemberships.organizationId,
            role: clinicMemberships.role,
          })
          .from(providerOwnerships)
          .innerJoin(
            clinicMemberships,
            eq(providerOwnerships.organizationId, clinicMemberships.organizationId)
          )
          .innerJoin(
            clinicOrganizations,
            eq(clinicMemberships.organizationId, clinicOrganizations.id)
          )
          .where(
            and(
              eq(providerOwnerships.providerId, providerId),
              eq(providerOwnerships.status, "active"),
              eq(clinicMemberships.userId, user.id),
              eq(clinicMemberships.status, "active"),
              eq(clinicOrganizations.status, "active")
            )
          )
          .limit(1)
      )[0] ?? null;
    } else {
      membership = (
        await db
          .select({
            organizationId: clinicMemberships.organizationId,
            role: clinicMemberships.role,
          })
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
      )[0] ?? null;
    }

    if (!membership) {
      return NextResponse.json({ error: "No active membership found for this scope." }, { status: 403 });
    }

    const token = signProviderPortalEmbedToken({
      userId: user.id,
      organizationId: membership.organizationId,
      email: user.email,
      role: isProviderPortalRole(membership.role) ? membership.role : "viewer",
      source: "b2b_embed",
      ttlSeconds: 5 * 60,
    });
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.zavis.ai").replace(/\/$/, "");

    return NextResponse.json({
      ok: true,
      token,
      expiresInSeconds: 5 * 60,
      embedUrl: `${baseUrl}/provider-portal/embed#token=${encodeURIComponent(token)}`,
    });
  } catch (err) {
    console.error("[provider-portal] embed token failed:", err);
    return NextResponse.json({ error: "Could not generate embed token." }, { status: 500 });
  }
}
