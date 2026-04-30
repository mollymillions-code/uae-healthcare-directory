import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claimRequests, providers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createProviderPortalInvite } from "@/lib/provider-portal/invites";
import { validateAdminAuth } from "@/lib/admin-auth";
import { readJsonObject } from "@/lib/http/read-json";

/** GET — list all claims with provider name */
export async function GET(request: NextRequest) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  const claims = await db
    .select({
      id: claimRequests.id,
      providerId: claimRequests.providerId,
      providerName: providers.name,
      contactName: claimRequests.contactName,
      contactEmail: claimRequests.contactEmail,
      contactPhone: claimRequests.contactPhone,
      jobTitle: claimRequests.jobTitle,
      proofType: claimRequests.proofType,
      proofDocumentUrl: claimRequests.proofDocumentUrl,
      requestedChanges: claimRequests.requestedChanges,
      notes: claimRequests.notes,
      status: claimRequests.status,
      reviewedBy: claimRequests.reviewedBy,
      reviewedAt: claimRequests.reviewedAt,
      rejectionReason: claimRequests.rejectionReason,
      createdAt: claimRequests.createdAt,
    })
    .from(claimRequests)
    .leftJoin(providers, eq(claimRequests.providerId, providers.id))
    .orderBy(desc(claimRequests.createdAt));

  return NextResponse.json({ claims });
}

/** PATCH — approve or reject a claim */
export async function PATCH(request: NextRequest) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data;
  const { claimId, action, rejectionReason, reviewerName } = body as {
    claimId: string;
    action: "approve" | "reject";
    rejectionReason?: string;
    reviewerName?: string;
  };

  if (!claimId || !action) {
    return NextResponse.json(
      { error: "claimId and action are required" },
      { status: 400 }
    );
  }

  // Fetch claim
  const [claim] = await db
    .select()
    .from(claimRequests)
    .where(eq(claimRequests.id, claimId))
    .limit(1);

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return NextResponse.json({ error: "Claim has already been reviewed" }, { status: 409 });
  }

  const now = new Date();
  const reviewer = reviewerName || "Admin";

  if (action === "approve") {
    const portalInvite = await createProviderPortalInvite({
      providerId: claim.providerId,
      email: claim.contactEmail,
      contactName: claim.contactName,
      contactPhone: claim.contactPhone,
      role: "manager",
      claimRequestId: claim.id,
      createdBy: reviewer,
      source: "claim_approved",
    });

    // Update claim status
    await db
      .update(claimRequests)
      .set({
        status: "approved",
        reviewedBy: reviewer,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(claimRequests.id, claimId));

    // Mark provider as claimed
    await db
      .update(providers)
      .set({ isClaimed: true })
      .where(eq(providers.id, claim.providerId));

    // Apply requested changes if any
    if (claim.requestedChanges) {
      const changes: Record<string, unknown> = {};
      if (claim.requestedChanges.phone) changes.phone = claim.requestedChanges.phone;
      if (claim.requestedChanges.website) changes.website = claim.requestedChanges.website;
      if (claim.requestedChanges.description) changes.shortDescription = claim.requestedChanges.description;
      if (Object.keys(changes).length > 0) {
        await db.update(providers).set(changes).where(eq(providers.id, claim.providerId));
      }
    }

    return NextResponse.json({ success: true, status: "approved", portalInvite });
  }

  if (action === "reject") {
    await db
      .update(claimRequests)
      .set({
        status: "rejected",
        reviewedBy: reviewer,
        reviewedAt: now,
        rejectionReason: rejectionReason || null,
        updatedAt: now,
      })
      .where(eq(claimRequests.id, claimId));

    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
