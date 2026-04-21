import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCategories,
  getAreasByCity,
  getAreaBySlug,
  getCityBySlug,
  getCategoryBySlug,
  getProviders,
  LocalProvider,
} from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props { params: { city: string; area: string; category: string } }

/** Return all city × area × category combos that have 5+ rated providers */
export async function generateStaticParams() {
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; area: string; category: string }[] = [];

  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        const { providers } = await safe(
          getProviders({
            citySlug: city.slug,
            areaSlug: area.slug,
            categorySlug: cat.slug,
            limit: 99999,
          }),
          { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
          "top-area-cat:params",
        );
        const qualified = providers.filter(
          (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
        );
        if (qualified.length >= 5) {
          params.push({ city: city.slug, area: area.slug, category: cat.slug });
        }
      }
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const cat = getCategoryBySlug(params.category);
  if (!city || !area || !cat) return {};

  const base = getBaseUrl();
  const title = `Top 10 ${cat.name} in ${area.name}, ${city.name}, UAE | Ranked by Patient Reviews`;
  const description = `The 10 highest-rated ${cat.name.toLowerCase()} in ${area.name}, ${city.name}, UAE, ranked by verified Google patient reviews. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/top/${cat.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
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

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export default async function TopAreaCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const cat = getCategoryBySlug(params.category);
  if (!city || !area || !cat) notFound();

  const { providers: allProviders } = await safe(
    getProviders({
      citySlug: city.slug,
      areaSlug: area.slug,
      categorySlug: cat.slug,
      limit: 99999,
    }),
    { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
    "top-area-cat:page",
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
  const catLower = cat.name.toLowerCase();

  const faqs = [
    {
      question: `What are the top-rated ${catLower} in ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated ${catLower} in ${area.name}, ${city.name} as of March 2026 are: ${top10.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.googleRating}\u2605, ${p.googleReviewCount.toLocaleString()} reviews)`).join("; ")}. Rankings are based on verified Google patient reviews.`,
    },
    {
      question: `How are the top ${catLower} in ${area.name}, ${city.name} ranked?`,
      answer: `Rankings on the UAE Open Healthcare Directory are determined by Google patient review ratings, with tie-breaking by total review count. Only providers in ${area.name} with a rating above 0 and more than 10 verified reviews are eligible. Data is sourced from official government licensed facility registers and last verified March 2026.`,
    },
    {
      question: `Are these ${catLower} in ${area.name}, ${city.name} licensed?`,
      answer: `Yes. All providers listed in the UAE Open Healthcare Directory are sourced from official government registers. Healthcare in ${city.name} is regulated by ${regulator}. All listed facilities in ${area.name} hold valid health authority licenses.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: cat.name, url: `${base}/directory/${city.slug}/${area.slug}/${cat.slug}` },
    { name: `Top 10`, url: `${base}/directory/${city.slug}/${area.slug}/top/${cat.slug}` },
  ];

  const topRated = top10[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: cat.name, href: `/directory/${city.slug}/${area.slug}/${cat.slug}` },
        { label: "Top 10" },
      ]}
      eyebrow={`Top-rated · ${cat.name} · ${area.name}`}
      title={`Top 10 ${catLower} in ${area.name}, ${city.name}.`}
      subtitle={
        <span>
          The highest-rated {catLower} in {area.name}, {city.name} by verified Google patient reviews. Only providers with a rating above 0 and more than 10 verified reviews are included. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, these are the {top10.length} highest-rated {catLower} in {area.name}, {city.name}, UAE, ranked by Google patient reviews as of March 2026.
          {topRated && (
            <>
              {" "}The top-ranked provider is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star rating based on {topRated.googleReviewCount.toLocaleString()} verified patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers.
        </>
      }
      total={top10.length}
      providers={top10.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        citySlug: p.citySlug,
        categorySlug: p.categorySlug,
        categoryName: cat.name,
        address: p.address,
        googleRating: p.googleRating,
        googleReviewCount: p.googleReviewCount,
        isClaimed: p.isClaimed,
        isVerified: p.isVerified,
        photos: p.photos ?? null,
        coverImageUrl: p.coverImageUrl ?? null,
      }))}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema(breadcrumbSchemaItems)} />
          <JsonLd data={speakableSchema([".answer-block"])} />
          <JsonLd data={faqPageSchema(faqs)} />
          <JsonLd data={itemListSchema(`Top 10 ${cat.name} in ${area.name}, ${city.name}`, top10, city.name, base)} />
        </>
      }
      belowGrid={
        <>
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All ${catLower} in ${area.name}`}
                href={`/directory/${city.slug}/${area.slug}/${cat.slug}`}
              />
              <ListingsCrossLink
                label={`Top 10 ${catLower} in ${city.name}`}
                href={`/directory/${city.slug}/top/${cat.slug}`}
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Top {catLower} in {area.name} — FAQ
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
