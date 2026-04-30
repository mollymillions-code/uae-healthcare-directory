import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { validateAdminAuth } from "@/lib/admin-auth";
import { createProviderPortalInvite } from "@/lib/provider-portal/invites";
import { isProviderPortalRole } from "@/lib/provider-portal/auth";
import { readJsonObject } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const providerId = String(body.providerId || "");
    const email = String(body.email || "");
    const role = isProviderPortalRole(body.role) ? body.role : "manager";

    if (!providerId || !email) {
      return NextResponse.json({ error: "providerId and email are required" }, { status: 400 });
    }

    const provider = (
      await db
        .select({ id: providers.id })
        .from(providers)
        .where(eq(providers.id, providerId))
        .limit(1)
    )[0];

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const invite = await createProviderPortalInvite({
      providerId,
      email,
      contactName: body.contactName ? String(body.contactName) : null,
      contactPhone: body.contactPhone ? String(body.contactPhone) : null,
      role,
      createdBy: "admin",
      source: "admin_grant",
      organizationName: body.organizationName ? String(body.organizationName) : null,
    });

    await db
      .update(providers)
      .set({ isClaimed: true, updatedAt: new Date() })
      .where(eq(providers.id, providerId));

    return NextResponse.json({ ok: true, invite });
  } catch (err) {
    console.error("[admin] provider portal invite failed:", err);
    return NextResponse.json({ error: "Could not create invite" }, { status: 500 });
  }
}
