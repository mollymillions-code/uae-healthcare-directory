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
  params: { city: string; area: string; category: string };
}

export async function generateStaticParams() {
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; area: string; category: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        const providers = await get24HourProviders(city.slug, cat.slug, area.slug);
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

  const providers = await get24HourProviders(city.slug, cat.slug, area.slug);
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

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "24-Hour", url: `${base}/directory/${city.slug}/${area.slug}/24-hour` },
    { name: cat.name },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={itemListSchema(`24-Hour ${cat.name} in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "24-Hour", href: `/directory/${city.slug}/${area.slug}/24-hour` },
        { label: cat.name },
      ]} />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">24-Hour {cat.name} in {area.name}, {city.name}, UAE</h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">{count} verified facilities open 24/7 · Last updated March 2026</p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count} {catLower} in {area.name}, {city.name} that operate 24 hours a day, 7 days a week.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <> The highest-rated is <strong>{sorted[0].name}</strong> with a {sorted[0].googleRating}-star Google rating based on {sorted[0].googleReviewCount.toLocaleString()} patient reviews.</>
            )}{" "}
            All listings are sourced from official {regulator} licensed facility registers. Data last verified March 2026.
          </p>
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">24-Hour {cat.name} in {area.name}, {city.name}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <ProviderCard key={provider.id} name={provider.name} slug={provider.slug} citySlug={provider.citySlug} categorySlug={provider.categorySlug} address={provider.address} phone={provider.phone} website={provider.website} shortDescription={provider.shortDescription} googleRating={provider.googleRating} googleReviewCount={provider.googleReviewCount} isClaimed={provider.isClaimed} isVerified={provider.isVerified} coverImageUrl={provider.coverImageUrl} />
          ))}
        </div>
      </section>

      <section className="mb-10 space-y-2">
        <p className="font-['Geist',sans-serif] text-sm text-black/40">See all 24-hour facilities in {area.name}?{" "}<Link href={`/directory/${city.slug}/${area.slug}/24-hour`} className="text-[#006828] hover:underline font-medium">All 24-hour healthcare in {area.name} &rarr;</Link></p>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">See all 24-hour {catLower} in {city.name}?{" "}<Link href={`/directory/${city.slug}/24-hour/${cat.slug}`} className="text-[#006828] hover:underline font-medium">24-hour {catLower} in {city.name} &rarr;</Link></p>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">Looking for daytime options?{" "}<Link href={`/directory/${city.slug}/${area.slug}/${cat.slug}`} className="text-[#006828] hover:underline font-medium">Browse all {catLower} in {area.name} &rarr;</Link></p>
      </section>

      <FaqSection faqs={faqs} title={`24-Hour ${cat.name} in ${area.name}, ${city.name} — FAQ`} />
    </div>
  );
}
