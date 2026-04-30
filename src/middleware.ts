import { NextRequest, NextResponse } from "next/server";
import { isRemovedProviderPath } from "@/lib/provider-removals";

const MAX_FACILITY_ROUTE_SEGMENT_LENGTH = 200;
const FACILITY_ROUTE_PREFIXES = [
  "/professionals/facility/",
  "/ar/professionals/facility/",
] as const;
const ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function hasInvalidFacilityRouteSegment(pathname: string): boolean {
  const prefix = FACILITY_ROUTE_PREFIXES.find((value) =>
    pathname.startsWith(value)
  );
  if (!prefix) return false;

  const [facilitySlug, specialtySlug] = pathname.slice(prefix.length).split("/");
  if (!facilitySlug) return false;

  return [facilitySlug, specialtySlug].some((segment) => {
    if (!segment) return false;
    return (
      segment.length > MAX_FACILITY_ROUTE_SEGMENT_LENGTH ||
      !ROUTE_SLUG_PATTERN.test(segment)
    );
  });
}

/**
 * Middleware for:
 * 1. Legacy URL redirects (/uae → /directory, /journal → /intelligence)
 * 2. Dashboard auth protection
 * 3. Research pipeline API key enforcement
 * 4. Professional facility route hardening
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  // Redirect non-www to www (Nginx also does this — must match to avoid redirect loops)
  if (host === 'zavis.ai') {
    return NextResponse.redirect(`https://www.zavis.ai${request.nextUrl.pathname}${request.nextUrl.search}`, 301);
  }

  const { pathname } = request.nextUrl;

  if (isRemovedProviderPath(pathname)) {
    return new NextResponse(null, {
      status: 410,
      headers: {
        "X-Robots-Tag": "noindex, noarchive",
      },
    });
  }

  if (hasInvalidFacilityRouteSegment(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Strip trailing slashes (Google treats /dubai/ and /dubai as separate URLs)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // ── Legacy redirects ──────────────────────────────────────────────
  // /uae → /directory
  if (pathname === "/uae" || pathname.startsWith("/uae/")) {
    const newPath = pathname.replace(/^\/uae/, "/directory");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  // /journal → /intelligence
  if (pathname === "/journal" || pathname.startsWith("/journal/")) {
    const newPath = pathname.replace(/^\/journal/, "/intelligence");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  // ── Dashboard auth ────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('zavis_dashboard_auth');
    const dashboardKey = process.env.DASHBOARD_KEY || '';

    if (authCookie?.value !== dashboardKey) {
      const loginUrl = new URL('/dashboard-auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Research pipeline API protection ──────────────────────────────
  if (
    pathname.startsWith('/api/research/pipeline') ||
    pathname.startsWith('/api/research/posts') ||
    pathname.startsWith('/api/research/emails')
  ) {
    const method = request.method;
    // GET is public (dashboard reads), writes need API key
    if (method !== 'GET') {
      const apiKey = request.headers.get('x-api-key');
      const expectedKey = process.env.REPORTS_API_KEY;
      if (!expectedKey || apiKey !== expectedKey) {
        // Also allow dashboard cookie for browser-based actions
        const authCookie = request.cookies.get('zavis_dashboard_auth');
        const dashboardKey = process.env.DASHBOARD_KEY || '';
        if (authCookie?.value !== dashboardKey) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.png|favicon\\.svg|images/).*)",
  ],
};
