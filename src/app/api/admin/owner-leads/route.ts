import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ownerLeadRequests, providers } from "@/lib/db/schema";

const VALID_STATUSES = new Set([
  "pending",
  "contacted",
  "verified",
  "portal_invited",
  "completed",
  "rejected",
]);

export async function GET(request: NextRequest) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  const leads = await db
    .select({
      id: ownerLeadRequests.id,
      consumerEventId: ownerLeadRequests.consumerEventId,
      providerId: ownerLeadRequests.providerId,
      providerName: providers.name,
      action: ownerLeadRequests.action,
      surface: ownerLeadRequests.surface,
      entityType: ownerLeadRequests.entityType,
      entitySlug: ownerLeadRequests.entitySlug,
      entityName: ownerLeadRequests.entityName,
      pageUrl: ownerLeadRequests.pageUrl,
      ctaLabel: ownerLeadRequests.ctaLabel,
      ownerRole: ownerLeadRequests.ownerRole,
      anonymousId: ownerLeadRequests.anonymousId,
      contactName: ownerLeadRequests.contactName,
      contactEmail: ownerLeadRequests.contactEmail,
      contactPhone: ownerLeadRequests.contactPhone,
      metadata: ownerLeadRequests.metadata,
      status: ownerLeadRequests.status,
      createdAt: ownerLeadRequests.createdAt,
    })
    .from(ownerLeadRequests)
    .leftJoin(providers, eq(ownerLeadRequests.providerId, providers.id))
    .orderBy(desc(ownerLeadRequests.createdAt))
    .limit(500);

  return NextResponse.json({ leads });
}

export async function PATCH(request: NextRequest) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!leadId || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid leadId or status" }, { status: 400 });
    }

    const [updated] = await db
      .update(ownerLeadRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(ownerLeadRequests.id, leadId))
      .returning({ id: ownerLeadRequests.id, status: ownerLeadRequests.status });

    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, lead: updated });
  } catch (error) {
    console.error("[admin-owner-leads] update failed:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
