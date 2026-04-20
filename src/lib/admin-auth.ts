/**
 * Admin auth helper — validates the DASHBOARD_KEY from request headers or query params.
 * Used by all /api/admin/* routes.
 */

import { NextRequest, NextResponse } from "next/server";

export function validateAdminAuth(req: NextRequest): NextResponse | null {
  const key =
    req.headers.get("x-dashboard-key") ||
    req.nextUrl.searchParams.get("key");

  if (!key || key !== process.env.DASHBOARD_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // Auth passed
}
