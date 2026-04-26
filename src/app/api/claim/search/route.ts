import { NextRequest, NextResponse } from "next/server";
import { getProviders } from "@/lib/data";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least two characters." },
      { status: 400 }
    );
  }

  const { providers } = await getProviders({
    query,
    limit: 8,
    page: 1,
    sort: "name",
    country: "ae",
  });

  return NextResponse.json(
    {
      results: providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        address: provider.address,
        citySlug: provider.citySlug,
        categorySlug: provider.categorySlug,
        licenseNumber: provider.licenseNumber,
        isClaimed: provider.isClaimed,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
