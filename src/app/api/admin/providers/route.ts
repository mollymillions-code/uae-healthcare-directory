import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = validateAdminAuth(req);
  if (authError) return authError;

  const q = req.nextUrl.searchParams.get("q") || "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 100);

  try {
    const where = q.trim()
      ? or(
          ilike(providers.name, `%${q}%`),
          ilike(providers.slug, `%${q}%`),
          ilike(providers.phone, `%${q}%`)
        )
      : undefined;

    const rows = await db
      .select({
        id: providers.id,
        name: providers.name,
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        phone: providers.phone,
        email: providers.email,
        website: providers.website,
        address: providers.address,
        description: providers.description,
        shortDescription: providers.shortDescription,
        googleRating: providers.googleRating,
        googleReviewCount: providers.googleReviewCount,
        insurance: providers.insurance,
        services: providers.services,
        languages: providers.languages,
        operatingHours: providers.operatingHours,
        isClaimed: providers.isClaimed,
        isVerified: providers.isVerified,
        status: providers.status,
      })
      .from(providers)
      .where(where)
      .orderBy(providers.name)
      .limit(limit);

    return NextResponse.json({ providers: rows, total: rows.length });
  } catch (err) {
    console.error("[admin] GET /providers failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
