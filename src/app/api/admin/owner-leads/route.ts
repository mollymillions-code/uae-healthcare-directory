import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ownerLeadRequests, providers } from "@/lib/db/schema";

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
