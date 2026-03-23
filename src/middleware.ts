import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for:
 * 1. Legacy URL redirects (/uae → /directory, /journal → /intelligence)
 * 2. Dashboard auth protection
 * 3. Research pipeline API key enforcement
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  // Skip auth in local development
  const isLocal = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';

  if (pathname.startsWith('/dashboard') && !isLocal) {
    const authCookie = request.cookies.get('zavis_dashboard_auth');
    const dashboardKey = process.env.DASHBOARD_KEY || 'zavis_research_2026';

    if (authCookie?.value !== dashboardKey) {
      const loginUrl = new URL('/login', request.url);
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
        const dashboardKey = process.env.DASHBOARD_KEY || 'zavis_research_2026';
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
    "/uae", "/uae/:path*",
    "/journal", "/journal/:path*",
    "/dashboard/:path*",
    "/api/research/pipeline/:path*",
    "/api/research/posts/:path*",
    "/api/research/emails/:path*",
  ],
};
