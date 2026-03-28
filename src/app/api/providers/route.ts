import { NextRequest, NextResponse } from "next/server";
import { getProviders } from "@/lib/data";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const city = p.get("city") ?? "";
  const category = p.get("category") ?? "";
  const area = p.get("area") ?? "";
  const page = Math.max(1, Number(p.get("page")) || 1);

  if (!city || !category) {
    return NextResponse.json({ error: "city and category are required" }, { status: 400 });
  }

  const result = await getProviders({
    citySlug: city,
    categorySlug: category,
    areaSlug: area || undefined,
    page,
    limit: 20,
    sort: "rating",
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
