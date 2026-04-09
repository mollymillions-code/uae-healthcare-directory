import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claimRequests, providers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.DASHBOARD_KEY || "";
  // Accept cookie (browser) or x-api-key header (programmatic)
  const cookie = request.cookies.get("zavis_dashboard_auth")?.value;
  const header = request.headers.get("x-api-key");
  return (!!cookie && cookie === key) || (!!header && header === key);
}

/** GET — list all claims with provider name */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
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

  const now = new Date();
  const reviewer = reviewerName || "Admin";

  if (action === "approve") {
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

    return NextResponse.json({ success: true, status: "approved" });
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
