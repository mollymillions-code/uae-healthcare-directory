import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCityBySlug,
  getCategories,
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
  params: { city: string };
}

/** Only generate pages for cities with 3+ 24-hour providers */
export async function generateStaticParams() {
  const cities = getCities();
  const params: { city: string }[] = [];

  for (const city of cities) {
    const providers = await safe(get24HourProviders(city.slug), [], "24hour:params");
    if (providers.length >= 3) {
      params.push({ city: city.slug });
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
  if (!city) return {};

  const base = getBaseUrl();
  const title = `24-Hour Healthcare in ${city.name}, UAE | Open Now`;
  const description = `Find 24-hour hospitals, pharmacies, clinics and urgent care in ${city.name}, UAE. All facilities verified against official health authority registers. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/24-hour`;

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

export default async function TwentyFourHourCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const providers = await safe(get24HourProviders(city.slug), [], "24hour:city");
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const count = providers.length;

  // Sort by rating descending
  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  // Group by category for cross-links
  const categoryCounts = new Map<string, number>();
  for (const p of providers) {
    categoryCounts.set(
      p.categorySlug,
      (categoryCounts.get(p.categorySlug) || 0) + 1
    );
  }
  const categories = getCategories();
  const categoryLinks = categories.filter(
    (cat) => (categoryCounts.get(cat.slug) || 0) >= 3
  );

  const faqs = [
    {
      question: `Which healthcare facilities are open 24 hours in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} healthcare facilities in ${city.name} that operate 24 hours a day, 7 days a week. These include hospitals, pharmacies, clinics, and urgent care centers. All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `Where can I find a 24-hour pharmacy in ${city.name}?`,
      answer: `${city.name} has several 24-hour pharmacies listed in the UAE Open Healthcare Directory. Use the category filter above to find pharmacies specifically. Most major hospital pharmacies also operate 24/7. Prescription medications may require a valid UAE prescription from a licensed physician.`,
    },
    {
      question: `What are the wait times at 24-hour facilities in ${city.name}?`,
      answer: `Wait times at 24-hour healthcare facilities in ${city.name} vary by urgency. Emergency departments provide immediate triage for critical cases. Non-critical emergency visits are typically attended to within 30 to 120 minutes. 24-hour pharmacies usually have minimal wait times. Walk-in clinics operating overnight may have longer waits depending on patient volume.`,
    },
    {
      question: `Do 24-hour facilities in ${city.name} accept insurance?`,
      answer: `Most 24-hour healthcare facilities in ${city.name} accept major UAE insurance plans including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Emergency services are generally covered regardless of plan. Always carry your insurance card and Emirates ID. Contact the facility directly to confirm coverage before non-emergency visits.`,
    },
    {
      question: `How much does a visit to a 24-hour clinic cost in ${city.name}?`,
      answer: `Emergency department visits in ${city.name} typically cost AED 300 to 1,000 before treatment, depending on the facility. 24-hour GP consultations range from AED 200 to 500. Pharmacy costs vary by medication. With insurance, you typically pay only the co-payment amount (usually AED 0 to 100 for emergencies). Always confirm fees directly with the facility.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "24-Hour", url: `${base}/directory/${city.slug}/24-hour` },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "24-Hour" },
      ]}
      eyebrow={`24-hour · ${city.name}`}
      title={`24-hour healthcare in ${city.name}.`}
      subtitle={
        <span>
          {count} verified facilities operating 24/7 in {city.name}, UAE. Hospitals, pharmacies, clinics, and urgent care — all licensed by {regulator} and last verified March 2026.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} healthcare facilities in {city.name} that operate 24 hours a day, 7 days a week. These include hospitals, pharmacies, clinics, and urgent care centers.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers. Emergency departments provide immediate triage for critical cases; non-critical cases are typically seen within 30 to 120 minutes.
        </>
      }
      total={count}
      providers={sorted.map((p) => {
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
          <JsonLd
            data={itemListSchema(
              `24-Hour Healthcare in ${city.name}`,
              sorted.slice(0, 20),
              city.name,
              base
            )}
          />
        </>
      }
      belowGrid={
        <>
          {categoryLinks.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                24-hour {city.name.toLowerCase()} by category
              </h2>
              <ul className="flex flex-wrap gap-2">
                {categoryLinks.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/directory/${city.slug}/24-hour/${cat.slug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {cat.name} ({categoryCounts.get(cat.slug)})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All healthcare in ${city.name}`}
                href={`/directory/${city.slug}`}
                sub="Browse every provider"
              />
              <ListingsCrossLink
                label={`Emergency care in ${city.name}`}
                href={`/directory/${city.slug}/emergency`}
                sub="ER and urgent care"
              />
              <ListingsCrossLink
                label={`Walk-in clinics in ${city.name}`}
                href={`/directory/${city.slug}/walk-in`}
                sub="No appointment needed"
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Good to know about 24-hour care in {city.name}
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
