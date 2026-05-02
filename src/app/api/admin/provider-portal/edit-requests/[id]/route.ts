import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminChanges,
  providerEditRequests,
  providerPortalAuditLogs,
  providers,
} from "@/lib/db/schema";
import { validateAdminAuth } from "@/lib/admin-auth";
import { createId } from "@/lib/id";
import {
  buildProviderUpdateFromPortalPayload,
  PROVIDER_PORTAL_FIELD_LABELS,
} from "@/lib/provider-portal/edits";
import { readJsonObject } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateAdminAuth(request);
  if (authError) return authError;

  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const action = String(body.action || "");
    const reviewerName = String(body.reviewerName || "admin");
    const rejectionReason = body.rejectionReason ? String(body.rejectionReason) : null;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    const editRequest = (
      await db
        .select()
        .from(providerEditRequests)
        .where(eq(providerEditRequests.id, params.id))
        .limit(1)
    )[0];

    if (!editRequest) {
      return NextResponse.json({ error: "Edit request not found" }, { status: 404 });
    }
    if (editRequest.status !== "pending") {
      return NextResponse.json({ error: "Edit request has already been reviewed" }, { status: 409 });
    }

    const now = new Date();

    if (action === "reject") {
      await db
        .update(providerEditRequests)
        .set({
          status: "rejected",
          reviewedBy: reviewerName,
          reviewedAt: now,
          rejectionReason,
          updatedAt: now,
        })
        .where(eq(providerEditRequests.id, params.id));

      await db.insert(providerPortalAuditLogs).values({
        id: createId("pal"),
        organizationId: editRequest.organizationId,
        providerId: editRequest.providerId,
        actorType: "admin",
        action: "provider_edit_request_rejected",
        metadata: { requestId: editRequest.id, rejectionReason },
      });

      return NextResponse.json({ ok: true, status: "rejected" });
    }

    const current = (
      await db
        .select()
        .from(providers)
        .where(eq(providers.id, editRequest.providerId))
        .limit(1)
    )[0];
    if (!current) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const updates = buildProviderUpdateFromPortalPayload(editRequest.payload);
    const changedFields = Object.keys(updates).filter((field) => {
      const currentValue = (current as Record<string, unknown>)[field];
      return JSON.stringify(currentValue ?? null) !== JSON.stringify(updates[field] ?? null);
    });

    if (changedFields.length > 0) {
      await db
        .update(providers)
        .set({ ...updates, updatedAt: now })
        .where(eq(providers.id, editRequest.providerId));

      for (const field of changedFields) {
        await db.insert(adminChanges).values({
          entityType: "provider",
          entityId: current.id,
          entityName: current.name,
          fieldName: PROVIDER_PORTAL_FIELD_LABELS[field] || field,
          oldValue: ((current as Record<string, unknown>)[field] ?? null) as Record<string, unknown>,
          newValue: (updates[field] ?? null) as Record<string, unknown>,
          changedBy: reviewerName,
          reason: `Approved clinic portal edit request ${editRequest.id}`,
        });
      }
    }

    await db
      .update(providerEditRequests)
      .set({
        status: "approved",
        reviewedBy: reviewerName,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(providerEditRequests.id, params.id));

    await db.insert(providerPortalAuditLogs).values({
      id: createId("pal"),
      organizationId: editRequest.organizationId,
      providerId: editRequest.providerId,
      actorType: "admin",
      action: "provider_edit_request_approved",
      metadata: { requestId: editRequest.id, fields: changedFields },
    });

    return NextResponse.json({ ok: true, status: "approved", changedFields });
  } catch (err) {
    console.error("[admin] provider portal edit review failed:", err);
    return NextResponse.json({ error: "Could not review edit request" }, { status: 500 });
  }
}
