import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories, getProviders,
  LocalProvider,
} from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

/** Return cities that have 5+ qualified providers */
export async function generateStaticParams() {
  const cities = getCities();
  const params: { city: string }[] = [];

  for (const city of cities) {
    const { providers } = await safe(
      getProviders({ citySlug: city.slug, limit: 99999 }),
      { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
      "top:params",
    );
    const qualified = providers.filter(
      (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
    );
    if (qualified.length >= 5) {
      params.push({ city: city.slug });
    }
  }

  return params;
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const base = getBaseUrl();
  const title = `Top 10 Healthcare Providers in ${city.name}, UAE | Ranked by Patient Reviews`;
  const description = `The 10 highest-rated healthcare providers in ${city.name}, UAE, ranked by verified Google patient reviews. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/top`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url,
    },
  };
}

export default async function TopCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const { providers: allProviders } = await safe(
    getProviders({ citySlug: city.slug, limit: 99999 }),
    { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
    "top:page",
  );

  const top10 = allProviders
    .filter((p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 10);

  if (top10.length < 5) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const categories = getCategories();

  const faqs = [
    {
      question: `What are the top-rated healthcare providers in ${city.name}, UAE?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated healthcare providers in ${city.name} as of March 2026 are: ${top10.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.googleRating}★, ${p.googleReviewCount.toLocaleString()} reviews)`).join("; ")}. Rankings are based on verified Google patient reviews.`,
    },
    {
      question: `How are the top healthcare providers in ${city.name} ranked?`,
      answer:
        "Rankings on the UAE Open Healthcare Directory are determined by Google patient review ratings, with tie-breaking by total review count. Only providers with a rating above 0 and more than 10 verified reviews are eligible. Data is sourced from official government licensed facility registers and last verified March 2026.",
    },
    {
      question: `Are these healthcare providers in ${city.name} licensed?`,
      answer: `Yes. All providers listed in the UAE Open Healthcare Directory are sourced from official government registers. Healthcare in ${city.name} is regulated by ${regulator}. All listed facilities hold valid health authority licenses.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Top 10", url: `${base}/directory/${city.slug}/top` },
  ];

  const topRated = top10[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Top 10" },
      ]}
      eyebrow={`Top-rated · ${city.name}`}
      title={`Top 10 healthcare providers in ${city.name}.`}
      subtitle={
        <span>
          The highest-rated providers in {city.name}, ranked by verified Google patient reviews. Only providers with a rating above 0 and more than 10 verified reviews are eligible. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, these are the 10 highest-rated healthcare providers in {city.name}, UAE, ranked by Google patient reviews as of March 2026.
          {topRated && (
            <>
              {" "}The top-ranked provider is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star rating based on {topRated.googleReviewCount.toLocaleString()} verified patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers.
        </>
      }
      total={top10.length}
      providers={top10.map((p) => {
        const cat = categories.find((c) => c.slug === p.categorySlug);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: cat?.name ?? null,
          address: p.address,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          photos: p.photos ?? null,
          coverImageUrl: p.coverImageUrl ?? null,
        };
      })}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema(breadcrumbSchemaItems)} />
          <JsonLd data={speakableSchema([".answer-block"])} />
          <JsonLd data={faqPageSchema(faqs)} />
          <JsonLd data={itemListSchema(`Top 10 Healthcare Providers in ${city.name}`, top10, city.name, base)} />
        </>
      }
      belowGrid={
        <>
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All healthcare in ${city.name}`}
                href={`/directory/${city.slug}`}
                sub="Full directory"
              />
              <ListingsCrossLink
                label="Top-rated across UAE"
                href="/directory/top"
                sub="Nationwide rankings"
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Top healthcare providers in {city.name} — FAQ
              </h2>
              <div className="max-w-3xl">
                <FaqSection faqs={faqs} />
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
