import { NextRequest, NextResponse } from "next/server";
import { getProviderPortalContextFromRequest } from "@/lib/provider-portal/auth";
import { listOwnedProviders, listProviderEditRequests } from "@/lib/provider-portal/access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getProviderPortalContextFromRequest(request);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [listings, editRequests] = await Promise.all([
    listOwnedProviders(context),
    listProviderEditRequests(context),
  ]);

  return NextResponse.json({
    organization: context.organization,
    user: context.user,
    listings,
    editRequests,
  });
}
