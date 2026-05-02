import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerPortalSessions } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";
import {
  PROVIDER_PORTAL_SESSION_COOKIE,
  clearProviderPortalSessionCookie,
} from "@/lib/provider-portal/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PROVIDER_PORTAL_SESSION_COOKIE)?.value;
  if (token) {
    await db
      .update(providerPortalSessions)
      .set({ revokedAt: new Date() })
      .where(eq(providerPortalSessions.tokenHash, hashToken(token)));
  }

  const response = NextResponse.json({ ok: true });
  clearProviderPortalSessionCookie(response, request);
  return response;
}
