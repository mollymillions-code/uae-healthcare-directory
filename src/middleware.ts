import { NextRequest, NextResponse } from "next/server";
import { isRemovedProviderPath } from "@/lib/provider-removals";

const MAX_FACILITY_ROUTE_SEGMENT_LENGTH = 200;
const FACILITY_ROUTE_PREFIXES = [
  "/professionals/facility/",
  "/ar/professionals/facility/",
] as const;
const ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANDING_SPECIALTY_SLUGS = new Set([
  "dermatology",
  "optometry",
  "orthopedics",
  "ent",
  "urgent-care",
  "mental-health",
  "veterinary",
  "homecare",
  "aesthetic",
  "longevity-wellness",
]);
const PUBLIC_TOP_LEVEL_ROUTES = new Set([
  "accessibility",
  "account",
  "add-listing",
  "about",
  "ai-agents",
  "analytics",
  "ar",
  "automations",
  "best",
  "book-a-demo",
  "bookings",
  "campaigns",
  "captain",
  "chat",
  "claim",
  "conditions",
  "contact",
  "crm",
  "dashboard",
  "dashboard-auth",
  "data-sources",
  "dental",
  "directory",
  "editorial-policy",
  "emr",
  "find-a-doctor",
  "forgot-password",
  "get-started",
  "guides",
  "insurance",
  "integrations",
  "intelligence",
  "jobs",
  "labs",
  "list-your-practice",
  "listing-request",
  "login",
  "medications",
  "methodology",
  "mobile",
  "payments",
  "pharmacy",
  "pricing",
  "privacy-policy",
  "professionals",
  "request-listing",
  "research",
  "reset-password",
  "search",
  "signup",
  "specialties",
  "terms",
  "terms-of-service",
  "tools",
  "tr",
  "verified-reviews",
  "voice",
  "widgets",
  "workforce",
]);
const CRAWLER_USER_AGENT_PATTERN =
  /\b(?:ahrefs|applebot|baiduspider|bingbot|bot|chatgpt-user|crawler|duckduckbot|facebookexternalhit|gptbot|googlebot|googleother|linkedinbot|oai-searchbot|petalbot|semrush|slurp|spider|yandex)\b/i;
const INSURANCE_SLUG_ALIASES: Record<string, string> = {
  "aetna-international": "aetna",
  "allianz-care": "allianz",
  "al-sagr-national-insurance": "al-sagr",
  "bupa-global": "bupa",
  "dar-al-takaful": "watania",
  "dubai-insurance-company": "dic",
  "dubai-national-insurance": "dnir",
  "dubai-national-insurance-and-reinsurance": "dnir",
  "emirates-insurance-company": "emirates-insurance",
  "fidelity-united-insurance": "fidelity-united",
  "nas-(nextcare)": "nas",
  "nas-nextcare": "nas",
  "national-general-insurance": "ngi",
  "now-health-international": "now-health",
  "orient-insurance": "orient",
  "salama-islamic-insurance": "salama",
  "sukoon": "oman-insurance",
  "sukoon-oman-insurance": "oman-insurance",
};

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

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isUnknownPublicTopLevelPath(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/api/")) return false;
  if (pathname.slice(1).includes("/") || pathname.includes(".")) return false;

  const slug = decodePathSegment(pathname.slice(1)).toLowerCase();
  if (!ROUTE_SLUG_PATTERN.test(slug)) return false;

  return !PUBLIC_TOP_LEVEL_ROUTES.has(slug) && !LANDING_SPECIALTY_SLUGS.has(slug);
}

function maybeRedirectInsuranceSlugAlias(
  request: NextRequest,
  pathname: string,
) {
  const directoryMatch = pathname.match(
    /^\/(ar\/)?directory\/([^/]+)\/insurance\/([^/]+)(\/.*)?$/,
  );

  if (directoryMatch) {
    const [, locale = "", city, rawInsurer, rest = ""] = directoryMatch;
    const canonical = INSURANCE_SLUG_ALIASES[
      decodePathSegment(rawInsurer).toLowerCase()
    ];

    if (canonical) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}directory/${city}/insurance/${canonical}${rest}`;
      return NextResponse.redirect(url, 301);
    }
  }

  const hubMatch = pathname.match(/^\/(ar\/)?insurance\/([^/]+)(\/.*)?$/);
  if (hubMatch) {
    const [, locale = "", rawInsurer, rest = ""] = hubMatch;
    const canonical = INSURANCE_SLUG_ALIASES[
      decodePathSegment(rawInsurer).toLowerCase()
    ];

    if (canonical) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}insurance/${canonical}${rest}`;
      return NextResponse.redirect(url, 301);
    }
  }

  return null;
}

function isCrawlerUserAgent(userAgent: string | null): boolean {
  return Boolean(userAgent && CRAWLER_USER_AGENT_PATTERN.test(userAgent));
}

function isGenuineNextRscRequest(request: NextRequest): boolean {
  const hasRscHeader = request.headers.get("rsc") === "1";
  const hasRouterTree = request.headers.has("next-router-state-tree");

  // Next.js client-side navigations include both headers. Partial/forged RSC
  // requests can force expensive server Flight renders and have caused worker
  // stalls under crawler traffic, so treat them as canonical page requests.
  return hasRscHeader && hasRouterTree;
}

/**
 * Middleware for:
 * 1. Legacy URL redirects (/uae → /directory, /journal → /intelligence)
 * 2. Dashboard auth protection
 * 3. Research pipeline API key enforcement
 * 4. Professional facility route hardening
 * 5. 410 for explicitly removed providers
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Next.js App Router uses the `_rsc` query param for internal Flight data
  // requests during client navigation. Crawlers and social/browser preview
  // agents were discovering those URLs and requesting them as normal documents,
  // which bypassed canonical page caching and forced expensive server renders.
  // Let genuine RSC navigation through, but canonicalize direct/bot `_rsc`
  // requests back to the clean URL.
  const hasRscQuery =
    request.nextUrl.searchParams.has("_rsc") || request.url.includes("_rsc=");

  if (hasRscQuery) {
    const isNextRscRequest = isGenuineNextRscRequest(request);

    if (!isNextRscRequest || isCrawlerUserAgent(request.headers.get("user-agent"))) {
      const url = new URL(request.url);
      url.searchParams.delete("_rsc");
      return NextResponse.redirect(url, 301);
    }
  }

  // Strip transient auth/login query markers from public pages. These are
  // navigation state, not distinct indexable documents, and GSC was surfacing
  // them as redirect/HTTPS examples.
  const isRedirectAwareAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/jobs/login") ||
    pathname.startsWith("/jobs/signup") ||
    pathname.startsWith("/provider-portal/login");
  const hasDisposableRedirectParam =
    request.nextUrl.searchParams.has("redirect") && !isRedirectAwareAuthPage;

  if (request.nextUrl.searchParams.get("auth") === "login" || hasDisposableRedirectParam) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("auth");
    if (hasDisposableRedirectParam) {
      url.searchParams.delete("redirect");
    }
    if (url.search !== request.nextUrl.search) {
      return NextResponse.redirect(url, 301);
    }
  }

  // Redirect non-www to www (Nginx also does this — must match to avoid redirect loops)
  if (host === 'zavis.ai') {
    return NextResponse.redirect(`https://www.zavis.ai${request.nextUrl.pathname}${request.nextUrl.search}`, 301);
  }

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

  const insuranceAliasRedirect = maybeRedirectInsuranceSlugAlias(request, pathname);
  if (insuranceAliasRedirect) return insuranceAliasRedirect;

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

  if (isUnknownPublicTopLevelPath(pathname)) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "X-Robots-Tag": "noindex, noarchive",
      },
    });
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

  // Propagate the resolved pathname as a request header so server-rendered
  // layouts can branch on it (e.g. set `<html lang="ar" dir="rtl">` for
  // /ar/* routes without a client-side flicker). Read in
  // `src/app/layout.tsx` via `headers().get('x-pathname')`.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.png|favicon\\.svg|images/).*)",
  ],
};
