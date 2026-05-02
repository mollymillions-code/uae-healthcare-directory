import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/helpers";
import { searchHealthcare } from "@/lib/search/match";
import {
  buildSearchUrl,
  normalizeHealthcareSearchQuery,
  parseSearchLimit,
  SEARCH_PAGE_SIZE,
} from "@/lib/search/normalization";
import type { HealthcareSearchResult, HealthcareSearchResults } from "@/lib/search/types";

function withCanonicalUrl(result: HealthcareSearchResult, baseUrl: string): HealthcareSearchResult {
  return {
    ...result,
    canonicalUrl: new URL(result.url, baseUrl).toString(),
  };
}

function withCanonicalUrls(
  results: HealthcareSearchResults,
  baseUrl: string
): HealthcareSearchResults {
  return {
    ...results,
    facilities: results.facilities.map((result) => withCanonicalUrl(result, baseUrl)),
    doctors: results.doctors.map((result) => withCanonicalUrl(result, baseUrl)),
    conditions: results.conditions.map((result) => withCanonicalUrl(result, baseUrl)),
    insuranceHubs: results.insuranceHubs.map((result) => withCanonicalUrl(result, baseUrl)),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseSearchLimit(searchParams.get("limit"), SEARCH_PAGE_SIZE);
  const query = normalizeHealthcareSearchQuery({
    q: searchParams.get("q"),
    city: searchParams.get("city"),
    specialty: searchParams.get("specialty") ?? searchParams.get("category"),
    condition: searchParams.get("condition"),
    insurance: searchParams.get("insurance"),
    language: searchParams.get("language"),
    area: searchParams.get("area"),
    entityType: searchParams.get("entityType"),
    emergency: searchParams.get("emergency"),
    reason: searchParams.get("reason"),
    page: searchParams.get("page"),
  });

  let results = await searchHealthcare(query, { limit });
  const totalResults =
    results.totalFacilities +
    results.totalDoctors +
    results.conditions.length +
    results.insuranceHubs.length;
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(results.totalFacilities, results.totalDoctors, 1) / limit)
  );
  const page = Math.min(query.page ?? 1, totalPages);

  if (page !== query.page && totalResults > 0) {
    results = await searchHealthcare({ ...query, page }, { limit });
  }

  const baseUrl = getBaseUrl();
  const canonicalResults = withCanonicalUrls(results, baseUrl);

  return NextResponse.json(
    {
      ...canonicalResults,
      providers: canonicalResults.facilities,
      total: totalResults,
      page,
      totalPages,
      query: { ...query, page },
      pagination: {
        page,
        limit,
        totalResults,
        totalPages,
        searchUrl: buildSearchUrl({ ...query, page }),
      },
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
