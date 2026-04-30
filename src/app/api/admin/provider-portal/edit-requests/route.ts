import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicOrganizations,
  clinicUsers,
  providerEditRequests,
  providers,
} from "@/lib/db/schema";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  const status = request.nextUrl.searchParams.get("status");
  const where = status && status !== "all"
    ? eq(providerEditRequests.status, status)
    : undefined;

  const rows = await db
    .select({
      id: providerEditRequests.id,
      providerId: providerEditRequests.providerId,
      providerName: providers.name,
      organizationId: providerEditRequests.organizationId,
      organizationName: clinicOrganizations.name,
      requestedByUserId: providerEditRequests.requestedByUserId,
      requestedByName: clinicUsers.name,
      requestedByEmail: clinicUsers.email,
      status: providerEditRequests.status,
      payload: providerEditRequests.payload,
      reviewedBy: providerEditRequests.reviewedBy,
      reviewedAt: providerEditRequests.reviewedAt,
      rejectionReason: providerEditRequests.rejectionReason,
      createdAt: providerEditRequests.createdAt,
      updatedAt: providerEditRequests.updatedAt,
    })
    .from(providerEditRequests)
    .innerJoin(providers, eq(providerEditRequests.providerId, providers.id))
    .innerJoin(
      clinicOrganizations,
      eq(providerEditRequests.organizationId, clinicOrganizations.id)
    )
    .leftJoin(clinicUsers, eq(providerEditRequests.requestedByUserId, clinicUsers.id))
    .where(where)
    .orderBy(desc(providerEditRequests.createdAt))
    .limit(100);

  return NextResponse.json({ editRequests: rows });
}
