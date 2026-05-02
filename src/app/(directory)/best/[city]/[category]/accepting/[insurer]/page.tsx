import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCityBySlug,
  getCategoryBySlug,
  getProviders,
  getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import {
  getInsurancePlan,
  isTriFacetEligible,
} from "@/lib/insurance-facets/data";
import {
  TRI_FACET_INSURER_ALLOW,
  TRI_FACET_CATEGORY_ALLOW,
} from "@/lib/seo/facet-rules";

/**
 * /best/[city]/[category]/accepting/[insurer] — "Top {N} {category} in {city}
 * accepting {insurer}" editorial Top-N route.
 *
 * Sibling intent to /directory/[city]/insurance/[insurer]/[category] (the
 * tri-facet aggregator) — same data, different framing. The aggregator is a
 * filter view ("show me everything"); this route is decision support
 * ("recommend the top 20"). Both share the `isTriFacetEligible` gate so they
 * either both render with content or both fall through to noindex.
 *
 * Indexability uses the existing FACET_RULES rule for combo
 * [city, specialty, insurance] — see src/lib/seo/facet-rules.ts.
 *
 * Phase 2 of insurance-seo-strategy-plan.md.
 */

export const revalidate = 21600; // 6h
export const dynamicParams = true;

const TOP_N = 20;

interface Props {
  params: { city: string; category: string; insurer: string };
}

function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      const reviewDiff =
        (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
      if (reviewDiff !== 0) return reviewDiff;
      const verifiedDiff = Number(b.isVerified) - Number(a.isVerified);
      if (verifiedDiff !== 0) return verifiedDiff;
      return a.name.localeCompare(b.name);
    });
}

function avgRating(providers: LocalProvider[]): string {
  const rated = providers.filter((p) => Number(p.googleRating) > 0);
  if (rated.length === 0) return "N/A";
  const sum = rated.reduce((acc, p) => acc + Number(p.googleRating), 0);
  return (sum / rated.length).toFixed(1);
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "the UAE healthcare regulator";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the UAE healthcare regulator";
  return "the UAE healthcare regulator";
}

/**
 * Insurer-aware FAQ. Returns 6-8 question/answer pairs targeted at the
 * "Top N {category} in {city} accepting {insurer}" search intent. Distinct
 * from generateFacetFaqs (which is city × specialty only — no insurer).
 */
function generateBestAcceptingFaqs(opts: {
  cityName: string;
  categoryName: string;
  categorySingular: string;
  insurerName: string;
  rankedCount: number;
  totalAccepting: number;
  topProvider?: LocalProvider;
  regulatorShort: string;
}): { question: string; answer: string }[] {
  const {
    cityName,
    categoryName,
    categorySingular,
    insurerName,
    rankedCount,
    totalAccepting,
    topProvider,
    regulatorShort,
  } = opts;
  const catLower = categoryName.toLowerCase();

  const faqs: { question: string; answer: string }[] = [
    {
      question: `Which ${categorySingular} in ${cityName} accept ${insurerName} insurance?`,
      answer:
        topProvider
          ? `${totalAccepting} ${catLower} in ${cityName} list ${insurerName} as an accepted insurance plan. The highest-rated is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating from ${topProvider.googleReviewCount?.toLocaleString() || "0"} reviews. Always confirm direct-billing arrangements with the clinic before your visit — published acceptance and active billing networks can differ.`
          : `Several ${catLower} in ${cityName} list ${insurerName} as an accepted insurance plan. Confirm direct-billing arrangements with the clinic before your visit.`,
    },
    {
      question: `How many ${catLower} in ${cityName} accept ${insurerName}?`,
      answer: `According to the UAE Open Healthcare Directory, ${totalAccepting} ${catLower} in ${cityName} accept ${insurerName}. ${rankedCount} of these have Google ratings above 0 stars and are included in this Top ${TOP_N} ranking. Insurance acceptance can change — verify directly with the clinic before booking.`,
    },
    {
      question: `What is the best ${categorySingular} in ${cityName} that accepts ${insurerName}?`,
      answer: topProvider
        ? `Based on Google rating and review volume, the highest-rated ${categorySingular} in ${cityName} accepting ${insurerName} is ${topProvider.name} (${topProvider.googleRating} stars, ${topProvider.googleReviewCount?.toLocaleString() || "0"} reviews). Rankings are sourced from public Google reviews and ${regulatorShort} register data — last verified May 2026.`
        : `Browse the ranked list above. Providers are ordered by Google rating, with review count as a tiebreaker.`,
    },
    {
      question: `Does ${insurerName} cover ${catLower} visits in ${cityName}?`,
      answer: `${insurerName} typically covers consultations and standard procedures at network ${catLower} in ${cityName}, subject to your plan's tier, copay, and pre-authorization rules. Coverage details vary — review your policy schedule of benefits or contact ${insurerName} directly. Most clinics in this list offer direct-billing for ${insurerName}, which avoids out-of-pocket payment at the time of visit.`,
    },
    {
      question: `How are these ${catLower} ranked?`,
      answer: `Providers in this list are filtered to those that accept ${insurerName} and located in ${cityName}, then ranked by Google rating (highest first). Review count is the tiebreaker, followed by verified-clinic status and alphabetical order. All provider data is sourced from official ${regulatorShort} registers and public Google reviews.`,
    },
    {
      question: `Do I need a referral to visit a ${categorySingular} in ${cityName} with ${insurerName}?`,
      answer: `Whether you need a referral depends on your ${insurerName} plan tier. Many plans allow direct access to general practitioners and emergency care without referral, while specialist visits often require a referral or pre-authorization. Check your policy or contact ${insurerName} customer service before booking.`,
    },
    {
      question: `What documents do I need to bring with my ${insurerName} card?`,
      answer: `Bring (1) your ${insurerName} insurance card or policy number, (2) Emirates ID or passport, (3) any previous medical records or referral letters relevant to your visit, and (4) the prior authorization code if your plan requires one for the procedure. Most clinics on this list also accept walk-ins, but appointment booking is recommended for specialist consultations.`,
    },
  ];

  return faqs;
}

// ─── generateMetadata ───────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};
  const insurer = getInsurancePlan(params.insurer);
  if (!insurer) return {};

  const eligible = await safe(
    isTriFacetEligible(insurer.slug, city.slug, category.slug),
    false,
    "best-accepting-meta-eligible",
  );

  const base = getBaseUrl();
  const url = `${base}/best/${city.slug}/${category.slug}/accepting/${insurer.slug}`;

  if (!eligible) {
    return {
      title: `Best ${category.name} in ${city.name} accepting ${insurer.nameEn}`,
      description: `Verified providers in ${city.name} accepting ${insurer.nameEn}.`,
      alternates: { canonical: `${base}/directory/${city.slug}/insurance/${insurer.slug}` },
      robots: { index: false, follow: true },
    };
  }

  const currentYear = new Date().getFullYear();
  const title = `Best ${category.name} in ${city.name} Accepting ${insurer.nameEn} — Top ${TOP_N} [${currentYear}]`;
  const description = `Compare top ${category.name.toLowerCase()} in ${city.name} that accept ${insurer.nameEn} insurance. Ranked by Google rating and patient reviews.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": url,
        "ar-AE": `${base}/ar/best/${city.slug}/${category.slug}/accepting/${insurer.slug}`,
      },
    },
    openGraph: { title, description, url, type: "website" },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function BestAcceptingPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const insurer = getInsurancePlan(params.insurer);
  if (!insurer) notFound();

  // Hard gate: combo must be in allow-lists AND clear the min-provider
  // threshold. Keeps the indexable surface bounded — same predicate the
  // sitemap uses, so emission and runtime agree.
  const inAllowList =
    TRI_FACET_INSURER_ALLOW.has(insurer.slug) &&
    TRI_FACET_CATEGORY_ALLOW.has(category.slug);
  const eligible = await isTriFacetEligible(insurer.slug, city.slug, category.slug);
  if (!inAllowList || !eligible) notFound();

  const base = getBaseUrl();
  const regulatorShort = getRegulatorShort(city.slug);
  const totalCityCount = await safe(
    getProviderCountByCategoryAndCity(category.slug, city.slug),
    0,
    "best-accepting-totalCount",
  );

  const { providers: allProviders } = await safe(
    getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      limit: 99999,
    }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<
      ReturnType<typeof getProviders>
    >,
    "best-accepting-providers",
  );

  // Filter to providers accepting this insurer. Substring match against
  // either the canonical Arabic+English insurer name or the slug — same
  // approach getProvidersByInsurance uses.
  const accepting = allProviders.filter((p) =>
    p.insurance.some((label) => {
      const norm = label.toLowerCase().replace(/\s+/g, "-");
      return (
        norm.includes(insurer.slug) ||
        label.toLowerCase().includes(insurer.nameEn.toLowerCase())
      );
    })
  );

  const ranked = rankProviders(accepting);
  if (ranked.length === 0) notFound();

  const topN = ranked.slice(0, TOP_N);
  const topProvider = ranked[0];
  const totalAccepting = accepting.length;

  const faqs = generateBestAcceptingFaqs({
    cityName: city.name,
    categoryName: category.name,
    categorySingular: category.name.toLowerCase().replace(/s$/, ""),
    insurerName: insurer.nameEn,
    rankedCount: ranked.length,
    totalAccepting,
    topProvider,
    regulatorShort,
  });

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: base },
    { name: "Directory", url: `${base}/directory` },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    {
      name: category.name,
      url: `${base}/directory/${city.slug}/${category.slug}`,
    },
    { name: `Accepting ${insurer.nameEn}` },
  ]);

  const itemList = itemListSchema(
    `Top ${Math.min(TOP_N, ranked.length)} ${category.name} in ${city.name} accepting ${insurer.nameEn}`,
    topN,
    city.name,
    base,
  );

  return (
    <>
      <ListingsTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          {
            label: category.name,
            href: `/directory/${city.slug}/${category.slug}`,
          },
          { label: `Accepting ${insurer.nameEn}` },
        ]}
        eyebrow={`Best of · ${city.name} · ${insurer.nameEn}`}
        title={`Best ${category.name} in ${city.name} Accepting ${insurer.nameEn}.`}
        subtitle={
          <>
            Top {Math.min(ranked.length, TOP_N)} highest-rated out of{" "}
            {totalAccepting} providers accepting {insurer.nameEn}. Ranked by
            patient ratings · {regulatorShort} · Updated May 2026.
          </>
        }
        aeoAnswer={
          <p>
            <strong>{topProvider.name}</strong> is the highest-rated{" "}
            {category.name.toLowerCase().replace(/s$/, "")} in {city.name} that
            accepts <strong>{insurer.nameEn}</strong> insurance, based on{" "}
            {topProvider.googleReviewCount?.toLocaleString() || "0"} Google
            reviews ({topProvider.googleRating} stars). This list ranks{" "}
            {ranked.length} {insurer.nameEn}-accepting{" "}
            {category.name.toLowerCase()} in {city.name} (out of{" "}
            {totalCityCount} total) by patient ratings and review volume.
            Direct-billing availability varies by provider — confirm with the
            clinic before your visit.
          </p>
        }
        providers={topN.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: category.name,
          address: p.address,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          coverImageUrl: p.coverImageUrl,
        }))}
        total={Math.min(TOP_N, ranked.length)}
        totalLabel={`top ${Math.min(TOP_N, ranked.length)} ${category.name.toLowerCase()} accepting ${insurer.nameEn}`}
        belowGrid={
          <div className="space-y-8 mt-8">
            <nav
              className="border-t border-ink-line pt-8"
              aria-label="Related views"
            >
              <h2 className="font-display font-semibold text-ink text-z-h2 mb-4">
                Related views for {city.name} {category.name.toLowerCase()}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/directory/${city.slug}/insurance/${insurer.slug}/${category.slug}`}
                  className="rounded-z-pill border border-ink-hairline bg-white px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink"
                >
                  All {insurer.nameEn}-accepting {category.name.toLowerCase()} in {city.name} →
                </Link>
                <Link
                  href={`/best/${city.slug}/${category.slug}`}
                  className="rounded-z-pill border border-ink-hairline bg-white px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink"
                >
                  All best {category.name.toLowerCase()} in {city.name} (any insurance) →
                </Link>
                <Link
                  href={`/insurance/${insurer.slug}`}
                  className="rounded-z-pill border border-ink-hairline bg-white px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink"
                >
                  About {insurer.nameEn} →
                </Link>
              </div>
            </nav>

            {INSURANCE_PROVIDERS.filter(
              (i) => i.slug !== insurer.slug && TRI_FACET_INSURER_ALLOW.has(i.slug),
            ).length > 0 && (
              <nav
                className="border-t border-ink-line pt-8"
                aria-label="Other accepted insurance plans"
              >
                <h2 className="font-display font-semibold text-ink text-z-h2 mb-4">
                  Other insurance plans accepted by {city.name} {category.name.toLowerCase()}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {INSURANCE_PROVIDERS.filter(
                    (i) => i.slug !== insurer.slug && TRI_FACET_INSURER_ALLOW.has(i.slug),
                  ).map((i) => (
                    <Link
                      key={i.slug}
                      href={`/best/${city.slug}/${category.slug}/accepting/${i.slug}`}
                      className="rounded-z-pill border border-ink-hairline bg-white px-3 py-1.5 font-sans text-z-caption text-ink hover:border-ink"
                    >
                      Accepting {i.name} →
                    </Link>
                  ))}
                </div>
              </nav>
            )}

            <section className="border-t border-ink-line pt-8">
              <h2 className="font-display font-semibold text-ink text-z-h2 mb-4">
                Frequently asked
              </h2>
              <FaqSection faqs={faqs} />
            </section>

            <p className="font-sans text-z-caption text-ink-muted">
              Average rating across {ranked.length} {insurer.nameEn}-accepting{" "}
              {category.name.toLowerCase()} in {city.name}: {avgRating(accepting)}.
              Last verified May 2026. Provider data sourced from {regulatorShort}{" "}
              registers and public Google reviews. Insurance acceptance is
              provider-self-reported and may change — confirm with the clinic
              before booking.
            </p>
          </div>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbs} />
            <JsonLd data={itemList} />
            <JsonLd data={faqPageSchema(faqs)} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        arabicHref={`/ar/best/${city.slug}/${category.slug}/accepting/${insurer.slug}`}
      />
    </>
  );
}

// Don't pre-render at build (PREBUILD_STATIC_ROUTES is unset in CI).
// Routes generate on first request and cache for 6h via `revalidate`.
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities().filter((c) => c.country === "ae");
  const params: { city: string; category: string; insurer: string }[] = [];
  const allowedCategories = Array.from(TRI_FACET_CATEGORY_ALLOW);
  const allowedInsurers = Array.from(TRI_FACET_INSURER_ALLOW);
  for (const city of cities) {
    for (const catSlug of allowedCategories) {
      for (const insurerSlug of allowedInsurers) {
        params.push({
          city: city.slug,
          category: catSlug,
          insurer: insurerSlug,
        });
      }
    }
  }
  return params;
}
