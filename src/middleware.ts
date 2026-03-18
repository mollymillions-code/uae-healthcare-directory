import { NextRequest, NextResponse } from "next/server";

/**
 * 301 redirects for legacy URL paths.
 * /uae/...     → /directory/...
 * /journal/... → /intelligence/...
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/uae/:path*", "/journal/:path*"],
};
