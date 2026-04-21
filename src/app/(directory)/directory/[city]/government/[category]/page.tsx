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
  getGovernmentProviders,
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
  params: { city: string; category: string };
}

/** Only generate pages for city x category combos with 3+ government providers */
export async function generateStaticParams() {
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; category: string }[] = [];

  for (const city of cities) {
    for (const cat of categories) {
      const providers = await safe(getGovernmentProviders(city.slug, cat.slug), [], "gov-cat:params");
      if (providers.length >= 3) {
        params.push({ city: city.slug, category: cat.slug });
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

function getGovernmentOperator(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "SEHA (Abu Dhabi Health Services Company) under DOH oversight";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const cat = getCategoryBySlug(params.category);
  if (!city || !cat) return {};

  const base = getBaseUrl();
  const catLower = cat.name.toLowerCase();
  const title = `Government ${cat.name} in ${city.name}, UAE | Public Healthcare`;
  const description = `Find government and public ${catLower} in ${city.name}, UAE. Free or subsidized services for Emiratis and insured residents. Verified against official health authority registers. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/government/${cat.slug}`;

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

export default async function GovernmentCategoryCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const cat = getCategoryBySlug(params.category);
  if (!city || !cat) notFound();

  const providers = await safe(getGovernmentProviders(city.slug, cat.slug), [], "gov-cat:city");
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const operator = getGovernmentOperator(city.slug);
  const catLower = cat.name.toLowerCase();
  const count = providers.length;

  // Sort by rating descending
  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const faqs = [
    {
      question: `How many government ${catLower} are in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} government and public ${catLower} in ${city.name}. These facilities are operated by ${operator}. ${sorted[0] ? `The highest-rated is ${sorted[0].name}${Number(sorted[0].googleRating) > 0 ? ` with a ${sorted[0].googleRating}-star Google rating` : ""}.` : ""} All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `Are government ${catLower} in ${city.name} free?`,
      answer: `Many government ${catLower} in ${city.name} offer free or subsidized services for UAE nationals with Thiqa or DHA insurance coverage. Expatriates with valid health insurance typically pay reduced co-payments. Emergency services cannot be refused regardless of insurance status. Uninsured patients pay out-of-pocket at government-regulated rates, which are substantially lower than private facility fees. Contact the facility directly to confirm costs for your specific situation.`,
    },
    {
      question: `What are the wait times at government ${catLower} in ${city.name}?`,
      answer: `Wait times at government ${catLower} in ${city.name} vary by service type and demand. General consultations: 30 minutes to 2 hours for walk-ins. Specialist referrals: 1 to 4 weeks. Diagnostic tests: results typically available within 1 to 3 days. Emergency departments provide immediate triage for critical cases. Booking appointments through the DHA app (Dubai), SEHA app (Abu Dhabi), or MOHAP portal (Northern Emirates) can reduce wait times significantly.`,
    },
    {
      question: `Which insurance plans are accepted at government ${catLower} in ${city.name}?`,
      answer: `Government ${catLower} in ${city.name} accept Thiqa (UAE nationals, Abu Dhabi), Daman (expatriates, Abu Dhabi), DHA Essential Benefits Plan (Dubai), and most major private plans including AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Coverage levels and co-payments depend on your specific plan tier. Always carry your Emirates ID and insurance card. Check the insurance details on each provider listing on the UAE Open Healthcare Directory.`,
    },
    {
      question: `How do government ${catLower} in ${city.name} compare to private ones?`,
      answer: `Government ${catLower} in ${city.name} offer lower costs (often free for nationals, subsidized for insured residents) and are regulated by ${regulator}. Many hold international JCI accreditation. Private ${catLower} generally offer shorter wait times, more scheduling flexibility, and premium amenities. Both sectors employ licensed healthcare professionals. For routine care and cost savings, government facilities are an excellent choice; for faster access and specialized elective procedures, private options may be preferred.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Government", url: `${base}/directory/${city.slug}/government` },
    { name: cat.name },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Government", href: `/directory/${city.slug}/government` },
        { label: cat.name },
      ]}
      eyebrow={`Government · ${cat.name} · ${city.name}`}
      title={`Government ${catLower} in ${city.name}.`}
      subtitle={
        <span>
          {count} government and public {catLower} in {city.name}, operated by {operator}. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} government and public {catLower} in {city.name}. These facilities are operated by {operator} and offer services that are often free for UAE nationals or subsidized for insured residents.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers.
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
          <JsonLd
            data={itemListSchema(
              `Government ${cat.name} in ${city.name}`,
              sorted.slice(0, 20),
              city.name,
              base
            )}
          />
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
                label={`All government healthcare in ${city.name}`}
                href={`/directory/${city.slug}/government`}
              />
              <ListingsCrossLink
                label={`All ${catLower} in ${city.name}`}
                href={`/directory/${city.slug}/${cat.slug}`}
                sub="Private and public"
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Government {catLower} in {city.name} — FAQ
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
