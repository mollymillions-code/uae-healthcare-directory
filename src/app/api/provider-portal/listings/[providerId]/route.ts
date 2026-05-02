import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { providerEditRequests, providerPortalAuditLogs } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import {
  canManageProviderListing,
  getProviderPortalContextFromRequest,
} from "@/lib/provider-portal/auth";
import { getOwnedProvider, listProviderEditRequests } from "@/lib/provider-portal/access";
import { sanitizeProviderPortalEditPayload } from "@/lib/provider-portal/edits";
import { readJsonObject } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  const context = await getProviderPortalContextFromRequest(request);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await getOwnedProvider(context, params.providerId);
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const editRequests = await listProviderEditRequests(context, params.providerId);
  return NextResponse.json({ provider, editRequests });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  const context = await getProviderPortalContextFromRequest(request);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageProviderListing(context.user.role)) {
    return NextResponse.json({ error: "Viewer access cannot submit listing edits." }, { status: 403 });
  }

  const provider = await getOwnedProvider(context, params.providerId);
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data;
  const payload = sanitizeProviderPortalEditPayload(body);
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No editable fields submitted." }, { status: 400 });
  }

  const requestId = createId("per");
  await db.insert(providerEditRequests).values({
    id: requestId,
    providerId: provider.id,
    organizationId: context.organization.id,
    requestedByUserId: context.user.id,
    status: "pending",
    payload,
  });

  await db.insert(providerPortalAuditLogs).values({
    id: createId("pal"),
    organizationId: context.organization.id,
    providerId: provider.id,
    actorUserId: context.user.id,
    actorType: "clinic_user",
    action: "provider_edit_request_submitted",
    metadata: { requestId, fields: Object.keys(payload) },
  });

  return NextResponse.json({
    ok: true,
    requestId,
    message: "Your listing edits were submitted for Zavis review.",
  });
}
