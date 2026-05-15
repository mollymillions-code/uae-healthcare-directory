/**
 * Admin auth helper — validates the DASHBOARD_KEY from request headers or query params.
 * Used by all /api/admin/* routes.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  PROVIDER_PORTAL_SESSION_COOKIE,
  isZavisStaffEmail,
  validateProviderPortalSessionToken,
} from "@/lib/provider-portal/auth";

export function validateAdminAuth(req: NextRequest): NextResponse | null {
  const key =
    req.headers.get("x-dashboard-key") ||
    req.headers.get("x-api-key") ||
    req.nextUrl.searchParams.get("key") ||
    req.cookies.get("zavis_dashboard_auth")?.value;

  if (!key || key !== process.env.DASHBOARD_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // Auth passed
}

export async function validateProviderPortalAdminAuth(
  req: NextRequest
): Promise<NextResponse | null> {
  const context = await validateProviderPortalSessionToken(
    req.cookies.get(PROVIDER_PORTAL_SESSION_COOKIE)?.value
  );

  if (!context?.staff?.isZavisStaff || !isZavisStaffEmail(context.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
