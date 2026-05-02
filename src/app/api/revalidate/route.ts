import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// GET /api/revalidate?secret=xxx&path=/journal
// Triggers ISR revalidation for a specific path and, when configured,
// purges the matching Cloudflare cache key. The Cloudflare prefix purge is
// important for directory URLs because query-string variants can otherwise
// keep a stale 404 HTML object alive at the edge.

type RevalidateType = "page" | "layout";

function getBaseUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    "https://www.zavis.ai";
  return new URL(raw);
}

function normalizePath(rawPath: string): {
  pathname: string;
  queryPath?: string;
} | null {
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed.includes("..") || /[\r\n\\]/.test(trimmed)) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(trimmed, getBaseUrl());
  } catch {
    return null;
  }

  if (!parsed.pathname.startsWith("/") || parsed.pathname.includes("..")) {
    return null;
  }

  return {
    pathname: parsed.pathname,
    queryPath: parsed.search ? `${parsed.pathname}${parsed.search}` : undefined,
  };
}

function getRevalidateType(raw: string | null): RevalidateType | undefined {
  if (raw === "page" || raw === "layout") return raw;
  return undefined;
}

function getPurgeHosts(): string[] {
  const baseHost = getBaseUrl().host;
  const configured = (process.env.CLOUDFLARE_PURGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  return Array.from(new Set([baseHost, ...configured]));
}

async function purgeCloudflare(pathname: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!token || !zoneId) {
    return { skipped: true, reason: "cloudflare_not_configured" };
  }

  const hosts = getPurgeHosts();
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const prefixes = hosts.map((host) =>
    normalizedPath === "/" ? host : `${host}${normalizedPath}`
  );

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
    return {
      skipped: false,
      success: false,
      status: response.status,
      errors: result?.errors || [{ message: "Unknown Cloudflare purge error" }],
    };
  }

  return {
    skipped: false,
    success: true,
    prefixes: prefixes.length,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const rawPath = searchParams.get("path");
  const type = getRevalidateType(searchParams.get("type"));

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!rawPath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const normalized = normalizePath(rawPath);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (type) {
    revalidatePath(normalized.pathname, type);
  } else {
    revalidatePath(normalized.pathname);
  }

  if (normalized.queryPath && normalized.queryPath !== normalized.pathname) {
    revalidatePath(normalized.queryPath);
  } else if (normalized.pathname.startsWith("/directory/")) {
    revalidatePath(`${normalized.pathname}?page=1`);
  }

  const cloudflare = await purgeCloudflare(normalized.pathname);
  if ("success" in cloudflare && cloudflare.success === false) {
    return NextResponse.json(
      { revalidated: true, path: normalized.pathname, cloudflare },
      { status: 502 }
    );
  }

  return NextResponse.json({
    revalidated: true,
    path: normalized.pathname,
    type: type || null,
    cloudflare,
  });
}
