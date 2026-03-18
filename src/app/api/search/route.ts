import { NextRequest, NextResponse } from "next/server";
import { getProviders } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q") || undefined;
  const city = searchParams.get("city") || undefined;
  const category = searchParams.get("category") || undefined;
  const subcategory = searchParams.get("subcategory") || undefined;
  const area = searchParams.get("area") || undefined;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const sort = (searchParams.get("sort") as "rating" | "name" | "relevance") || "rating";

  const result = getProviders({
    query: q,
    citySlug: city,
    categorySlug: category,
    subcategorySlug: subcategory,
    areaSlug: area,
    page,
    limit,
    sort,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}
