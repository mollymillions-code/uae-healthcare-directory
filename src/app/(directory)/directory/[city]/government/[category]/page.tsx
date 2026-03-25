import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
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
      const providers = await getGovernmentProviders(city.slug, cat.slug);
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

  const providers = await getGovernmentProviders(city.slug, cat.slug);
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

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    {
      name: "Government",
      url: `${base}/directory/${city.slug}/government`,
    },
    { name: cat.name },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
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

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          {
            label: "Government",
            href: `/directory/${city.slug}/government`,
          },
          { label: cat.name },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">
          Government {cat.name} in {city.name}, UAE
        </h1>
        <p className="text-sm text-muted mb-4">
          {count} government & public {catLower} · Last updated March 2026
        </p>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count}{" "}
            government and public {catLower} in {city.name}. These facilities
            are operated by {operator} and offer services that are often free
            for UAE nationals or subsidized for insured residents.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <>
                {" "}
                The highest-rated is{" "}
                <strong>{sorted[0].name}</strong> with a{" "}
                {sorted[0].googleRating}-star Google rating based on{" "}
                {sorted[0].googleReviewCount.toLocaleString()} patient reviews.
              </>
            )}{" "}
            All listings are sourced from official {regulator} licensed facility
            registers.
          </p>
        </div>
      </div>

      {/* Provider grid */}
      <section className="mb-10">
        <div className="section-header">
          <h2>
            Government {cat.name} in {city.name}
          </h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <ProviderCard
              key={provider.id}
              name={provider.name}
              slug={provider.slug}
              citySlug={provider.citySlug}
              categorySlug={provider.categorySlug}
              address={provider.address}
              phone={provider.phone}
              website={provider.website}
              shortDescription={provider.shortDescription}
              googleRating={provider.googleRating}
              googleReviewCount={provider.googleReviewCount}
              isClaimed={provider.isClaimed}
              isVerified={provider.isVerified}
            />
          ))}
        </div>
      </section>

      {/* Cross-links */}
      <section className="mb-10 space-y-2">
        <p className="text-sm text-muted">
          See all government facilities?{" "}
          <Link
            href={`/directory/${city.slug}/government`}
            className="text-accent hover:underline font-medium"
          >
            All government healthcare in {city.name} &rarr;
          </Link>
        </p>
        <p className="text-sm text-muted">
          Looking for private options?{" "}
          <Link
            href={`/directory/${city.slug}/${cat.slug}`}
            className="text-accent hover:underline font-medium"
          >
            Browse all {catLower} in {city.name} &rarr;
          </Link>
        </p>
      </section>

      <FaqSection
        faqs={faqs}
        title={`Government ${cat.name} in ${city.name} — FAQ`}
      />
    </div>
  );
}
