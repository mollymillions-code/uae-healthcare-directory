import { createHmac, timingSafeEqual } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clinicMemberships,
  clinicOrganizations,
  clinicUsers,
  providerPortalSessions,
} from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { createPlainToken, hashToken, normalizeEmail } from "@/lib/auth/tokens";

export const PROVIDER_PORTAL_SESSION_COOKIE = "zavis_provider_portal_session";

export const PROVIDER_PORTAL_ROLES = ["owner", "manager", "doctor", "editor", "viewer"] as const;
export type ProviderPortalRole = "owner" | "manager" | "doctor" | "editor" | "viewer";

export type ProviderPortalContext = {
  sessionId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: ProviderPortalRole;
  };
  organization: {
    id: string;
    name: string;
    status: string;
  };
};

export type ProviderPortalEmbedTokenPayload = {
  userId: string;
  organizationId: string;
  email: string;
  role?: ProviderPortalRole;
  source?: string;
  iat: number;
  exp: number;
  nonce: string;
};

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function parseBase64UrlJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function getEmbedSecret(): string | null {
  return process.env.PROVIDER_PORTAL_EMBED_SECRET || null;
}

export function isProviderPortalRole(value: unknown): value is ProviderPortalRole {
  return PROVIDER_PORTAL_ROLES.includes(value as ProviderPortalRole);
}

export function canManageProviderListing(role: ProviderPortalRole): boolean {
  return role !== "viewer";
}

export function normalizePortalEmail(email: string): string {
  return normalizeEmail(email);
}

export function signProviderPortalEmbedToken(
  payload: Omit<ProviderPortalEmbedTokenPayload, "iat" | "exp" | "nonce"> & {
    ttlSeconds?: number;
  }
): string {
  const secret = getEmbedSecret();
  if (!secret) {
    throw new Error("PROVIDER_PORTAL_EMBED_SECRET is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const body: ProviderPortalEmbedTokenPayload = {
    userId: payload.userId,
    organizationId: payload.organizationId,
    email: normalizePortalEmail(payload.email),
    role: payload.role,
    source: payload.source || "b2b_embed",
    iat: now,
    exp: now + (payload.ttlSeconds || 5 * 60),
    nonce: createPlainToken(12),
  };

  const encoded = base64UrlJson(body);
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyProviderPortalEmbedToken(
  token: string
): ProviderPortalEmbedTokenPayload | null {
  const secret = getEmbedSecret();
  if (!secret) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null;
  }

  const payload = parseBase64UrlJson<ProviderPortalEmbedTokenPayload>(encoded);
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function isSecureCookieRequest(request?: NextRequest): boolean {
  const explicit = process.env.PROVIDER_PORTAL_COOKIE_SECURE;
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  if (request) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedProto) return forwardedProto.split(",")[0].trim() === "https";
    return request.nextUrl.protocol === "https:";
  }

  return process.env.NODE_ENV === "production";
}

function sessionCookieOptions(expiresAt: Date, request?: NextRequest) {
  const secure = isSecureCookieRequest(request);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    expires: expiresAt,
  };
}

export async function createProviderPortalSession(input: {
  userId: string;
  organizationId: string;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  const token = createPlainToken(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  await db.insert(providerPortalSessions).values({
    id: createId("pps"),
    userId: input.userId,
    organizationId: input.organizationId,
    tokenHash: hashToken(token),
    source: input.source || "portal",
    expiresAt,
    metadata: input.metadata || {},
  });

  return { token, expiresAt };
}

export function setProviderPortalSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
  request?: NextRequest
) {
  response.cookies.set(
    PROVIDER_PORTAL_SESSION_COOKIE,
    token,
    sessionCookieOptions(expiresAt, request)
  );
}

export function clearProviderPortalSessionCookie(response: NextResponse, request?: NextRequest) {
  const secure = isSecureCookieRequest(request);
  response.cookies.set(PROVIDER_PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function validateProviderPortalSessionToken(
  token: string | undefined | null
): Promise<ProviderPortalContext | null> {
  if (!token) return null;

  const session = (
    await db
      .select()
      .from(providerPortalSessions)
      .where(
        and(
          eq(providerPortalSessions.tokenHash, hashToken(token)),
          gt(providerPortalSessions.expiresAt, new Date()),
          isNull(providerPortalSessions.revokedAt)
        )
      )
      .limit(1)
  )[0];

  if (!session) return null;

  const row = (
    await db
      .select({
        sessionId: providerPortalSessions.id,
        userId: clinicUsers.id,
        userEmail: clinicUsers.email,
        userName: clinicUsers.name,
        userStatus: clinicUsers.status,
        organizationId: clinicOrganizations.id,
        organizationName: clinicOrganizations.name,
        organizationStatus: clinicOrganizations.status,
        membershipRole: clinicMemberships.role,
        membershipStatus: clinicMemberships.status,
      })
      .from(providerPortalSessions)
      .innerJoin(clinicUsers, eq(providerPortalSessions.userId, clinicUsers.id))
      .innerJoin(
        clinicOrganizations,
        eq(providerPortalSessions.organizationId, clinicOrganizations.id)
      )
      .innerJoin(
        clinicMemberships,
        and(
          eq(clinicMemberships.userId, clinicUsers.id),
          eq(clinicMemberships.organizationId, clinicOrganizations.id)
        )
      )
      .where(eq(providerPortalSessions.id, session.id))
      .limit(1)
  )[0];

  if (
    !row ||
    row.userStatus !== "active" ||
    row.organizationStatus !== "active" ||
    row.membershipStatus !== "active"
  ) {
    return null;
  }

  await db
    .update(providerPortalSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(providerPortalSessions.id, session.id));

  return {
    sessionId: row.sessionId,
    user: {
      id: row.userId,
      email: row.userEmail,
      name: row.userName,
      role: row.membershipRole as ProviderPortalRole,
    },
    organization: {
      id: row.organizationId,
      name: row.organizationName,
      status: row.organizationStatus,
    },
  };
}

export async function getProviderPortalContextFromRequest(
  request: NextRequest
): Promise<ProviderPortalContext | null> {
  return validateProviderPortalSessionToken(
    request.cookies.get(PROVIDER_PORTAL_SESSION_COOKIE)?.value
  );
}
