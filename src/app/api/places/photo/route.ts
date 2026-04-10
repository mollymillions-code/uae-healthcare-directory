/**
 * Google Places Photo Proxy
 *
 * Takes a photo_reference (or a slug the DB column may still have) and streams
 * the actual image bytes from Google Places, injecting the API key server-side.
 *
 * This exists because storing the full Google URL (with ?key=) in the DB
 * leaked the API key into every provider page's HTML/JSON-LD. The fix is:
 *   - DB stores only the photo_reference
 *   - Frontend renders /api/places/photo?ref={photoReference}
 *   - This route proxies the image server-side
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 2592000; // 30 days — Google photo refs are stable for a while

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const maxwidth = request.nextUrl.searchParams.get("w") || "800";

  if (!ref) {
    return new NextResponse("Missing 'ref' parameter", { status: 400 });
  }

  // Validate: photo_reference should be a base64-like string, no special chars
  if (!/^[A-Za-z0-9_-]+$/.test(ref)) {
    return new NextResponse("Invalid photo reference", { status: 400 });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return new NextResponse("Server misconfigured: missing API key", { status: 500 });
  }

  const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${encodeURIComponent(maxwidth)}&photoreference=${encodeURIComponent(ref)}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const upstream = await fetch(googleUrl, { redirect: "follow" });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return new NextResponse(`Proxy error: ${err instanceof Error ? err.message : "unknown"}`, {
      status: 502,
    });
  }
}
