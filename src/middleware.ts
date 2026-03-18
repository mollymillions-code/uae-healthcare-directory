import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware handles:
 * 1. 301 redirects for legacy URL paths (/uae → /directory, /journal → /intelligence)
 * 2. Sets x-locale header so the root layout can render the correct html lang attribute
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

  // Set locale header for root layout to read
  const response = NextResponse.next();
  response.headers.set("x-locale", pathname.startsWith("/ar") ? "ar" : "en");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
