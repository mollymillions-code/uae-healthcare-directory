import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories, getCategoryBySlug,
  getProviders, getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "DHA";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "DOH";
  return "MOHAP";
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Sort providers by Google rating (desc), then by review count (desc) as tiebreaker */
function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
}

/** Compute average rating */
function avgRating(providers: LocalProvider[]): string {
  const rated = providers.filter((p) => Number(p.googleRating) > 0);
  if (rated.length === 0) return "N/A";
  const sum = rated.reduce((acc, p) => acc + Number(p.googleRating), 0);
  return (sum / rated.length).toFixed(1);
}

/** Get top N most-common insurance names across providers */
function topInsurers(providers: LocalProvider[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    for (const ins of p.insurance) {
      counts.set(ins, (counts.get(ins) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name]) => name);
}

/** Get top N most-common area slugs */
function topAreas(providers: LocalProvider[], n: number): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    if (p.areaSlug) {
      counts.set(p.areaSlug, (counts.get(p.areaSlug) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([slug, count]) => ({ slug, count }));
}

// ─── Interfaces ─────────────────────────────────────────────────────────────────

interface Props {
  params: { city: string; category: string };
}

export const dynamicParams = true;

// ─── generateMetadata ───────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const count = await getProviderCountByCategoryAndCity(category.slug, city.slug);
  const base = getBaseUrl();
  const url = `${base}/best/${city.slug}/${category.slug}`;

  // Get top provider for meta description
  const { providers } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    sort: "rating",
    limit: 1,
  });
  const topProvider = providers.find((p) => Number(p.googleRating) > 0);

  const title = `Best ${category.name} in ${city.name} — Top 10 Highest Rated [2026]`;
  const description = topProvider
    ? `Compare ${count} ${category.name.toLowerCase()} in ${city.name}. The highest-rated is ${topProvider.name} (${topProvider.googleRating} stars, ${topProvider.googleReviewCount?.toLocaleString()} reviews). Ranked by Google rating. Updated March 2026.`
    : `Compare ${count} ${category.name.toLowerCase()} in ${city.name}, UAE. Ranked by Google rating and review count. Updated March 2026.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function BestCategoryInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const regulatorShort = getRegulatorShort(city.slug);
  const totalCount = await getProviderCountByCategoryAndCity(category.slug, city.slug);

  // Get ALL providers for this combo (no limit), then rank
  const { providers: allProviders } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    limit: 99999,
  });
  const ranked = rankProviders(allProviders);

  if (ranked.length === 0) notFound();

  const top15 = ranked.slice(0, 15);
  const top20ForSchema = ranked.slice(0, 20);
  const topProvider = ranked[0];
  const mostReviewed = [...ranked].sort(
    (a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0)
  )[0];

  // Stats
  const average = avgRating(allProviders);
  const commonInsurers = topInsurers(allProviders, 5);
  const topNeighborhoods = topAreas(allProviders, 5);

  // Cross-links: other cities for same category
  const otherCitiesRaw = await Promise.all(getCities()
    .filter((c) => c.slug !== city.slug)
    .map(async (c) => ({
      ...c,
      count: await getProviderCountByCategoryAndCity(category.slug, c.slug),
    })));
  const otherCities = otherCitiesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Cross-links: other categories in same city
  const otherCategoriesRaw = await Promise.all(getCategories()
    .filter((c) => c.slug !== category.slug)
    .map(async (c) => ({
      ...c,
      count: await getProviderCountByCategoryAndCity(c.slug, city.slug),
    })));
  const otherCategories = otherCategoriesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ─── FAQs ─────────────────────────────────────────────────────────────────────
  const catLower = category.name.toLowerCase();
  const catSingular = catLower.replace(/s$/, "");

  const faqs = [
    {
      question: `What is the best ${catSingular} in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated ${catSingular} in ${city.name} is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating based on ${topProvider.googleReviewCount?.toLocaleString()} patient reviews. All rankings are based on verified Google ratings and review volume. Data sourced from official ${regulatorShort} registers, last verified March 2026.`,
    },
    {
      question: `How many ${catLower} are there in ${city.name}?`,
      answer: `There are ${totalCount} ${catLower} listed in ${city.name} on the UAE Open Healthcare Directory. Of these, ${ranked.length} have Google ratings above 0 stars. The average rating across all rated providers is ${average} stars. Browse all providers at /directory/${city.slug}/${category.slug}.`,
    },
    {
      question: `Which ${catSingular} in ${city.name} has the most reviews?`,
      answer: mostReviewed
        ? `${mostReviewed.name} has the most Google reviews among ${catLower} in ${city.name}, with ${mostReviewed.googleReviewCount?.toLocaleString()} reviews and a ${mostReviewed.googleRating}-star rating. A high review count indicates consistent patient traffic and broad feedback.`
        : `Review counts vary among ${catLower} in ${city.name}. Browse the ranked list above to compare providers by review volume.`,
    },
    {
      question: `Do ${catLower} in ${city.name} accept insurance?`,
      answer: commonInsurers.length > 0
        ? `Yes, most ${catLower} in ${city.name} accept major UAE insurance plans. The most commonly accepted insurers include ${commonInsurers.join(", ")}. Healthcare in ${city.name} is regulated by the ${regulator}. Check individual provider listings for specific insurance acceptance.`
        : `Many ${catLower} in ${city.name} accept major UAE insurance plans. Healthcare in ${city.name} is regulated by the ${regulator}. Check individual listings for specific insurance acceptance.`,
    },
    {
      question: `What are the operating hours for ${catLower} in ${city.name}?`,
      answer: `Most ${catLower} in ${city.name} operate from 8:00 AM to 10:00 PM on weekdays and Saturdays. Some facilities, particularly hospitals and emergency care centers, are open 24/7. Friday hours may be reduced (typically afternoon only). Individual operating hours are listed on each provider's profile page in the UAE Open Healthcare Directory.`,
    },
    {
      question: `How are these ${catLower} in ${city.name} ranked?`,
      answer: `Providers are ranked by Google rating (highest first), with review count used as a tiebreaker for providers with the same rating. Only providers with a Google rating above 0 are included. All provider data is sourced from official ${regulatorShort} registers and cross-referenced with the UAE Open Healthcare Directory. Rankings are updated regularly; last verified March 2026.`,
    },
  ];

  // ─── JSON-LD schemas ──────────────────────────────────────────────────────────

  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: "Best", url: `${base}/best` },
    { name: city.name, url: `${base}/best/${city.slug}` },
    { name: category.name },
  ]);

  const itemList = itemListSchema(
    `Best ${category.name} in ${city.name}`,
    top20ForSchema,
    city.name,
    base,
  );

  const faqSchema = faqPageSchema(faqs);

  const speakable = speakableSchema([".answer-block"]);

  // ─── Answer block text ────────────────────────────────────────────────────────

  const answerText = `According to the UAE Open Healthcare Directory, ${city.name} has ${totalCount} ${catLower}. The highest-rated is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating based on ${topProvider.googleReviewCount?.toLocaleString()} reviews.${mostReviewed && mostReviewed.id !== topProvider.id ? ` The most-reviewed is ${mostReviewed.name} with ${mostReviewed.googleReviewCount?.toLocaleString()} patient reviews.` : ""} ${city.name} healthcare is regulated by the ${regulator}. All listings are sourced from official government registers and verified against ${regulatorShort} data, last updated March 2026.`;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemList} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakable} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Best", href: "/best" },
        { label: city.name, href: `/best/${city.slug}` },
        { label: category.name },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best {category.name} in {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Top {Math.min(ranked.length, 15)} highest-rated out of {totalCount} providers
          {" "}&middot; Ranked by Google rating &middot; {regulator}
          {" "}&middot; Updated March 2026
        </p>
      </div>

      {/* Answer Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{answerText}</p>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/directory/${city.slug}/${category.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All {catLower} in {city.name}
        </Link>
        <Link
          href={`/best/${city.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All categories in {city.name}
        </Link>
        <Link
          href="/best"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All cities
        </Link>
      </div>

      {/* Ranked Provider List */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top {Math.min(ranked.length, 15)} {category.name} in {city.name}</h2>
        </div>
        <div className="space-y-0">
          {top15.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-start gap-3 py-4 border-b border-black/[0.06] last:border-b-0"
            >
              {/* Rank */}
              <span className="text-lg font-bold text-[#006828] w-8 flex-shrink-0 text-center mt-0.5">
                #{idx + 1}
              </span>

              {/* Provider info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                    className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.isVerified && (
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">Verified</span>
                  )}
                </div>
                <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-1.5">{p.address}</p>

                {/* Insurance badges */}
                {p.insurance.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {p.insurance.slice(0, 4).map((ins) => (
                      <span
                        key={ins}
                        className="text-[10px] border border-black/[0.06] px-1.5 py-0.5 text-black/40"
                      >
                        {ins}
                      </span>
                    ))}
                    {p.insurance.length > 4 && (
                      <span className="text-[10px] text-black/40">
                        +{p.insurance.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* View profile link */}
                <Link
                  href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                  className="text-xs text-[#006828] font-bold hover:underline"
                >
                  View full profile &rarr;
                </Link>
              </div>

              {/* Rating + Reviews */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1">
                  {p.googleRating} ★
                </span>
                {p.googleReviewCount > 0 && (
                  <span className="text-[11px] text-black/40">
                    {p.googleReviewCount.toLocaleString()} reviews
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {ranked.length > 15 && (
          <div className="mt-4 text-center">
            <Link
              href={`/directory/${city.slug}/${category.slug}`}
              className="text-xs text-[#006828] font-bold hover:underline"
            >
              View all {totalCount} {catLower} in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Why These Rankings */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Why These Rankings</h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            Providers are ranked by <strong>Google rating</strong> (highest first), with{" "}
            <strong>review count</strong> used as a tiebreaker when ratings are equal. Only
            providers with a rating above 0 are included. A higher review count generally
            indicates more patient feedback and greater confidence in the rating.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            All provider data is sourced from official <strong>{regulator}</strong> licensed
            facilities registers and cross-referenced with the UAE Open Healthcare Directory.
            Rankings are updated regularly.
          </p>
          <p className="text-[11px] text-black/40">
            <strong>Note:</strong> These rankings reflect publicly available Google ratings and
            do not constitute a medical recommendation. Always verify credentials, check
            insurance coverage, and consult with your healthcare provider before making
            decisions.
          </p>
        </div>
      </section>

      {/* Category Stats */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{category.name} in {city.name} — Quick Stats</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{totalCount}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Total Providers</p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{average}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Avg. Rating</p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{ranked.length}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Rated Providers</p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{commonInsurers.length > 0 ? commonInsurers.length + "+" : "—"}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Insurers Accepted</p>
          </div>
        </div>

        {/* Most common insurers */}
        {commonInsurers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">Most Commonly Accepted Insurance</p>
            <div className="flex flex-wrap gap-2">
              {commonInsurers.map((ins) => (
                <span
                  key={ins}
                  className="text-xs border border-black/[0.06] px-2 py-1 text-black/40"
                >
                  {ins}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top neighborhoods */}
        {topNeighborhoods.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">Top Neighborhoods</p>
            <div className="flex flex-wrap gap-2">
              {topNeighborhoods.map((area) => (
                <span
                  key={area.slug}
                  className="text-xs border border-black/[0.06] px-2 py-1 text-black/40"
                >
                  {titleCase(area.slug.replace(/-/g, " "))} ({area.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`Best ${category.name} in ${city.name} — FAQ`}
      />

      {/* Cross-links: same category in other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Best {category.name} in Other Cities</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/best/${c.slug}/${category.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count} {c.count === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cross-links: other categories in same city */}
      {otherCategories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Top-Rated Categories in {city.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/best/${city.slug}/${c.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count} {c.count === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Full directory CTA */}
      <div className="bg-[#1c1c1c] text-white p-6 flex items-center justify-between mb-8">
        <div>
          <p className="font-bold text-sm">Browse all {catLower} in {city.name}</p>
          <p className="text-xs text-white/70 mt-1">
            Full directory with contact details, operating hours, insurance acceptance, and more
          </p>
        </div>
        <Link
          href={`/directory/${city.slug}/${category.slug}`}
          className="bg-[#006828] text-white px-4 py-2 text-xs font-bold hover:bg-green-600 transition-colors flex-shrink-0"
        >
          View all {totalCount}
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available Google ratings
          and review counts. They do not constitute a medical recommendation. Provider data is
          sourced from official {regulator} registers and the UAE Open Healthcare Directory,
          last verified March 2026. Insurance acceptance, operating hours, and services may
          change — always confirm directly with the provider before your visit.
        </p>
      </div>
    </div>
  );
}
