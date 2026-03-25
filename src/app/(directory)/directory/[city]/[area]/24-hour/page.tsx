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

export const revalidate = 43200;

interface Props {
  params: { city: string; area: string };
}

export async function generateStaticParams() {
  const cities = getCities();
  const params: { city: string; area: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const providers = await get24HourProviders(city.slug, undefined, area.slug);
      if (providers.length >= 3) {
        params.push({ city: city.slug, area: area.slug });
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
  if (!city || !area) return {};

  const base = getBaseUrl();
  const title = `24-Hour Healthcare in ${area.name}, ${city.name}, UAE | Open Now`;
  const description = `Find 24-hour hospitals, pharmacies, clinics and urgent care in ${area.name}, ${city.name}, UAE. All facilities verified against official health authority registers. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/24-hour`;

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

export default async function TwentyFourHourAreaPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) notFound();

  const providers = await get24HourProviders(city.slug, undefined, area.slug);
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const pageUrl = `${base}/directory/${city.slug}/${area.slug}/24-hour`;
  const count = providers.length;

  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const categoryCounts = new Map<string, number>();
  for (const p of providers) {
    categoryCounts.set(p.categorySlug, (categoryCounts.get(p.categorySlug) || 0) + 1);
  }
  const categories = getCategories();
  const categoryLinks = categories.filter((cat) => (categoryCounts.get(cat.slug) || 0) >= 3);

  const faqs = [
    {
      question: `Which healthcare facilities are open 24 hours in ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} healthcare facilities in ${area.name}, ${city.name} that operate 24 hours a day, 7 days a week. These include hospitals, pharmacies, clinics, and urgent care centers. All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `Where can I find a 24-hour pharmacy in ${area.name}, ${city.name}?`,
      answer: `${area.name}, ${city.name} has 24-hour pharmacies listed in the UAE Open Healthcare Directory. Use the category filter above to find pharmacies specifically. Most major hospital pharmacies also operate 24/7. Prescription medications may require a valid UAE prescription from a licensed physician.`,
    },
    {
      question: `What are the wait times at 24-hour facilities in ${area.name}, ${city.name}?`,
      answer: `Wait times at 24-hour healthcare facilities in ${area.name}, ${city.name} vary by urgency. Emergency departments provide immediate triage for critical cases. Non-critical emergency visits are typically attended to within 30 to 120 minutes. 24-hour pharmacies usually have minimal wait times. Walk-in clinics operating overnight may have longer waits depending on patient volume.`,
    },
    {
      question: `Do 24-hour facilities in ${area.name}, ${city.name} accept insurance?`,
      answer: `Most 24-hour healthcare facilities in ${area.name}, ${city.name} accept major UAE insurance plans including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Emergency services are generally covered regardless of plan. Always carry your insurance card and Emirates ID. Contact the facility directly to confirm coverage before non-emergency visits.`,
    },
    {
      question: `How much does a visit to a 24-hour clinic cost in ${area.name}, ${city.name}?`,
      answer: `Emergency department visits in ${area.name}, ${city.name} typically cost AED 300 to 1,000 before treatment, depending on the facility. 24-hour GP consultations range from AED 200 to 500. Pharmacy costs vary by medication. With insurance, you typically pay only the co-payment amount (usually AED 0 to 100 for emergencies). Always confirm fees directly with the facility.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "24-Hour", url: pageUrl },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={itemListSchema(`24-Hour Healthcare in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "24-Hour" },
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">24-Hour Healthcare in {area.name}, {city.name}, UAE</h1>
        <p className="text-sm text-muted mb-4">{count} verified facilities open 24/7 · Last updated March 2026</p>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count} healthcare facilities in {area.name}, {city.name} that operate 24 hours a day, 7 days a week. These include hospitals, pharmacies, clinics, and urgent care centers.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <> The highest-rated is <strong>{sorted[0].name}</strong> with a {sorted[0].googleRating}-star Google rating based on {sorted[0].googleReviewCount.toLocaleString()} patient reviews.</>
            )}{" "}
            All listings are sourced from official {regulator} licensed facility registers. Emergency departments provide immediate triage for critical cases; non-critical cases are typically seen within 30 to 120 minutes.
          </p>
        </div>
      </div>

      {categoryLinks.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-dark mb-2">Filter by category:</p>
          <div className="flex flex-wrap gap-2">
            {categoryLinks.map((cat) => (
              <Link key={cat.slug} href={`/directory/${city.slug}/${area.slug}/24-hour/${cat.slug}`} className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted">
                {cat.name} ({categoryCounts.get(cat.slug)})
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="mb-10">
        <div className="section-header">
          <h2>All 24-Hour Facilities in {area.name}, {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <ProviderCard key={provider.id} name={provider.name} slug={provider.slug} citySlug={provider.citySlug} categorySlug={provider.categorySlug} address={provider.address} phone={provider.phone} website={provider.website} shortDescription={provider.shortDescription} googleRating={provider.googleRating} googleReviewCount={provider.googleReviewCount} isClaimed={provider.isClaimed} isVerified={provider.isVerified} />
          ))}
        </div>
      </section>

      <section className="mb-10 space-y-2">
        <p className="text-sm text-muted">See all 24-hour facilities in {city.name}?{" "}<Link href={`/directory/${city.slug}/24-hour`} className="text-accent hover:underline font-medium">24-hour healthcare in {city.name} &rarr;</Link></p>
        <p className="text-sm text-muted">Need non-24-hour options?{" "}<Link href={`/directory/${city.slug}/${area.slug}`} className="text-accent hover:underline font-medium">Browse all healthcare providers in {area.name} &rarr;</Link></p>
      </section>

      <FaqSection faqs={faqs} title={`24-Hour Healthcare in ${area.name}, ${city.name} — FAQ`} />
    </div>
  );
}
