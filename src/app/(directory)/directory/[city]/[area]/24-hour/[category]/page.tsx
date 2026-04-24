import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCityBySlug,
  getCategories,
  getCategoryBySlug,
  getAreasByCity,
  getAreaBySlug,
  get24HourProviders,
} from "@/lib/data";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { city: string; area: string; category: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; area: string; category: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        const providers = await safe(
          get24HourProviders(city.slug, cat.slug, area.slug),
          [],
          "24hour-area-cat:params",
        );
        if (providers.length >= 3) {
          params.push({ city: city.slug, area: area.slug, category: cat.slug });
        }
      }
    }
  }
  return params;
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const cat = getCategoryBySlug(params.category);
  if (!city || !area || !cat) return {};

  const base = getBaseUrl();
  const catLower = cat.name.toLowerCase();
  const title = `24-Hour ${cat.name} in ${area.name}, ${city.name}, UAE | Open Now`;
  const description = `Find 24-hour ${catLower} in ${area.name}, ${city.name}, UAE. All facilities verified against official health authority registers. Includes ratings, contact details, and directions. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/24-hour/${cat.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

export default async function TwentyFourHourAreaCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const cat = getCategoryBySlug(params.category);
  if (!city || !area || !cat) notFound();

  const providers = await safe(
    get24HourProviders(city.slug, cat.slug, area.slug),
    [],
    "24hour-area-cat:page",
  );
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const catLower = cat.name.toLowerCase();
  const count = providers.length;

  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const faqs = [
    {
      question: `Which ${catLower} are open 24 hours in ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} ${catLower} in ${area.name}, ${city.name} that operate 24 hours a day, 7 days a week. ${sorted[0] ? `The highest-rated is ${sorted[0].name}${Number(sorted[0].googleRating) > 0 ? ` with a ${sorted[0].googleRating}-star Google rating` : ""}.` : ""} All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `What are the wait times at 24-hour ${catLower} in ${area.name}, ${city.name}?`,
      answer: `Wait times at 24-hour ${catLower} in ${area.name}, ${city.name} vary by facility type and urgency. Emergency departments provide immediate triage for critical cases. Non-critical emergency visits are typically attended to within 30 to 120 minutes. 24-hour pharmacies usually have minimal wait times. Walk-in clinics operating overnight may have longer waits depending on patient volume. Call ahead to check current wait times.`,
    },
    {
      question: `Do 24-hour ${catLower} in ${area.name}, ${city.name} accept insurance?`,
      answer: `Most 24-hour ${catLower} in ${area.name}, ${city.name} accept major UAE insurance plans including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Emergency services are generally covered regardless of plan. Always carry your insurance card and Emirates ID. Contact the facility directly to confirm coverage before non-emergency visits.`,
    },
    {
      question: `How much does a visit to a 24-hour ${catLower.replace(/s$/, "")} cost in ${area.name}, ${city.name}?`,
      answer: `Costs at 24-hour ${catLower} in ${area.name}, ${city.name} depend on the type of service required. Emergency visits typically cost AED 300 to 1,000 before treatment. Standard consultations at 24-hour clinics range from AED 200 to 500. With insurance, you typically pay only the co-payment amount. Always confirm fees directly with the facility before non-emergency treatment.`,
    },
    {
      question: `Are 24-hour ${catLower} in ${area.name}, ${city.name} licensed?`,
      answer: `Yes. All ${catLower} listed in the UAE Open Healthcare Directory are sourced from official government registers. Healthcare in ${city.name} is regulated by ${regulator}. All listed facilities hold valid health authority licenses. Data was last verified in March 2026.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "24-Hour", url: `${base}/directory/${city.slug}/${area.slug}/24-hour` },
    { name: cat.name },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "24-Hour", href: `/directory/${city.slug}/${area.slug}/24-hour` },
        { label: cat.name },
      ]}
      eyebrow={`24-hour · ${cat.name} · ${area.name}`}
      title={`24-hour ${catLower} in ${area.name}, ${city.name}.`}
      subtitle={
        <span>
          {count} verified {catLower} open 24/7 in {area.name}, {city.name} — licensed by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} {catLower} in {area.name}, {city.name} that operate 24 hours a day, 7 days a week.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers. Data last verified March 2026.
        </>
      }
      total={count}
      providers={sorted.map((p) => ({
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
          <JsonLd data={itemListSchema(`24-Hour ${cat.name} in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />
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
                label={`All 24-hour healthcare in ${area.name}`}
                href={`/directory/${city.slug}/${area.slug}/24-hour`}
              />
              <ListingsCrossLink
                label={`24-hour ${catLower} in ${city.name}`}
                href={`/directory/${city.slug}/24-hour/${cat.slug}`}
              />
              <ListingsCrossLink
                label={`All ${catLower} in ${area.name}`}
                href={`/directory/${city.slug}/${area.slug}/${cat.slug}`}
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                24-hour {catLower} in {area.name} — FAQ
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
