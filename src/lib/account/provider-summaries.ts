import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";

export type AccountProviderSummary = {
  providerId: string;
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  address: string;
  phone: string | null;
  website: string | null;
  googleRating: string | null;
  googleReviewCount: number | null;
  coverImageUrl: string | null;
};

export async function getAccountProviderSummaries(
  providerIds: string[]
): Promise<Map<string, AccountProviderSummary>> {
  const ids = Array.from(new Set(providerIds.filter(Boolean)));
  if (ids.length === 0) return new Map();

  try {
    const rows = await db
      .select({
        providerId: providers.id,
        name: providers.name,
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        address: providers.address,
        phone: providers.phone,
        website: providers.website,
        googleRating: providers.googleRating,
        googleReviewCount: providers.googleReviewCount,
        coverImageUrl: providers.coverImageUrl,
      })
      .from(providers)
      .where(inArray(providers.id, ids));

    return new Map(rows.map((row) => [row.providerId, row]));
  } catch (err) {
    console.warn(
      "[account] provider summaries unavailable:",
      err instanceof Error ? err.message : err
    );
    return new Map();
  }
}

export async function providerTableHasProvider(providerId: string): Promise<boolean | null> {
  try {
    const row = (
      await db
        .select({ id: providers.id })
        .from(providers)
        .where(inArray(providers.id, [providerId]))
        .limit(1)
    )[0];
    return Boolean(row);
  } catch {
    return null;
  }
}
