import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerPortalAuditLogs, providers } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import {
  canManageProviderListing,
  getProviderPortalContextFromRequest,
} from "@/lib/provider-portal/auth";
import { getOwnedProvider, listProviderEditRequests } from "@/lib/provider-portal/access";
import {
  buildProviderUpdateFromPortalPayload,
  sanitizeProviderPortalEditPayload,
} from "@/lib/provider-portal/edits";
import { readJsonObject } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

function getProviderPublicPath(provider: {
  citySlug: string | null;
  categorySlug: string | null;
  slug: string;
}) {
  return `/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`;
}

function getPurgeHosts(): string[] {
  const rawBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || "https://www.zavis.ai";
  const baseHost = new URL(rawBase).host;
  const configured = (process.env.CLOUDFLARE_PURGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  return Array.from(new Set([baseHost, ...configured]));
}

async function purgeCloudflarePath(pathname: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) return;

  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const prefixes = getPurgeHosts().map((host) =>
    normalizedPath === "/" ? host : `${host}${normalizedPath}`
  );

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes }),
      }
    );

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      console.warn("[provider-portal] Cloudflare purge failed", {
        path: pathname,
        status: response.status,
        errors: result?.errors,
      });
    }
  } catch (error) {
    console.warn("[provider-portal] Cloudflare purge threw", {
      path: pathname,
      error,
    });
  }
}

async function refreshProviderPaths(provider: {
  citySlug: string | null;
  categorySlug: string | null;
  slug: string;
}) {
  const publicPath = getProviderPublicPath(provider);
  revalidatePath(publicPath);

  if (provider.citySlug && provider.categorySlug) {
    revalidatePath(`/directory/${provider.citySlug}/${provider.categorySlug}`);
    revalidatePath(`/directory/${provider.citySlug}/${provider.categorySlug}?page=1`);
  }
  if (provider.citySlug) {
    revalidatePath(`/directory/${provider.citySlug}`);
  }

  await purgeCloudflarePath(publicPath);
  return publicPath;
}

export async function GET(request: NextRequest, props: { params: Promise<{ providerId: string }> }) {
  const params = await props.params;
  const context = await getProviderPortalContextFromRequest(request);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await getOwnedProvider(context, params.providerId);
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const editRequests = await listProviderEditRequests(context, params.providerId);
  return NextResponse.json({ provider, editRequests });
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ providerId: string }> }) {
  const params = await props.params;
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

  const updates = buildProviderUpdateFromPortalPayload(payload);
  await db
    .update(providers)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(providers.id, provider.id));

  const publicPath = await refreshProviderPaths(provider);

  await db.insert(providerPortalAuditLogs).values({
    id: createId("pal"),
    organizationId: context.organization.id,
    providerId: provider.id,
    actorUserId: context.user.id,
    actorType: context.staff?.isZavisStaff ? "zavis_staff" : "clinic_user",
    action: "provider_listing_updated",
    metadata: { fields: Object.keys(payload), publicPath },
  });

  return NextResponse.json({
    ok: true,
    publicPath,
    message: "Listing updated. Public profile cache has been refreshed.",
  });
}
