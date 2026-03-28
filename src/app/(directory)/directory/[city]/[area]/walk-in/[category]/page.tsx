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
  getWalkInProviders,
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

const WALK_IN_CATS = [
  "clinics", "dental", "dermatology", "ophthalmology", "pediatrics",
  "ent", "pharmacy", "labs-diagnostics", "emergency-care",
];

/** Only generate for city x area x category combos with 3+ providers */
export async function generateStaticParams() {
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; area: string; category: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        if (!WALK_IN_CATS.includes(cat.slug)) continue;
        const providers = await getWalkInProviders(city.slug, cat.slug, area.slug);
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
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

function getGPFeeRange(citySlug: string): string {
  if (citySlug === "dubai") return "AED 150-300";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "AED 100-250";
  if (citySlug === "sharjah") return "AED 100-200";
  return "AED 80-200";
}

function getWaitTimeText(categorySlug: string): string {
  switch (categorySlug) {
    case "clinics":
      return "GP walk-in wait times are typically 15 to 45 minutes.";
    case "dental":
      return "Walk-in dental appointments are typically available within 30 to 60 minutes. Emergency dental care may be seen faster.";
    case "dermatology":
      return "Walk-in dermatology consultations may have wait times of 30 to 90 minutes. Same-day appointments are often available.";
    case "ophthalmology":
      return "Walk-in eye care consultations typically take 30 to 60 minutes. Routine eye exams can often be scheduled same-day.";
    case "pediatrics":
      return "Walk-in pediatric consultations are typically available within 15 to 45 minutes. Urgent cases are prioritized.";
    case "ent":
      return "Walk-in ENT consultations typically have wait times of 30 to 60 minutes depending on clinic capacity.";
    case "pharmacy":
      return "Pharmacies typically serve walk-in customers within 5 to 15 minutes for prescriptions and over-the-counter medications.";
    case "labs-diagnostics":
      return "Walk-in lab tests are typically processed within 15 to 30 minutes for sample collection. Basic results (CBC, glucose) are usually available same day; specialized tests take 1 to 3 days.";
    case "emergency-care":
      return "Emergency departments provide immediate triage for critical cases. Non-critical cases are typically seen within 30 to 120 minutes.";
    default:
      return "Walk-in wait times are typically 15 to 45 minutes for GP consultations and 1 to 7 days for specialist appointments.";
  }
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const cat = getCategoryBySlug(params.category);
  if (!city || !area || !cat) return {};

  const base = getBaseUrl();
  const catLower = cat.name.toLowerCase();
  const title = `Walk-In ${cat.name} in ${area.name}, ${city.name}, UAE | No Appointment`;
  const description = `Find walk-in ${catLower} in ${area.name}, ${city.name}, UAE. No appointment needed. All facilities verified against official health authority registers. Includes ratings, wait times, and contact details. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/walk-in/${cat.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description,
      type: "website", locale: "en_AE",
      siteName: "UAE Open Healthcare Directory", url,
    },
  };
}

export default async function AreaWalkInCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const cat = getCategoryBySlug(params.category);
  if (!city || !area || !cat) notFound();
  if (!WALK_IN_CATS.includes(cat.slug)) notFound();

  const providers = await getWalkInProviders(city.slug, cat.slug, area.slug);
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const gpFee = getGPFeeRange(city.slug);
  const catLower = cat.name.toLowerCase();
  const count = providers.length;
  const waitTimeText = getWaitTimeText(cat.slug);

  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const faqs = [
    {
      question: `Which ${catLower} in ${area.name}, ${city.name} accept walk-ins?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} ${catLower} in ${area.name}, ${city.name} that accept walk-in patients. ${sorted[0] ? `The highest-rated is ${sorted[0].name}${Number(sorted[0].googleRating) > 0 ? ` with a ${sorted[0].googleRating}-star Google rating` : ""}.` : ""} All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `What are the wait times at walk-in ${catLower} in ${area.name}, ${city.name}?`,
      answer: `${waitTimeText} Wait times at walk-in ${catLower} in ${area.name} vary by time of day and patient volume. Early mornings and late afternoons tend to be busiest. Call ahead or check the clinic's app for current wait times.`,
    },
    {
      question: `How much does a walk-in visit to ${catLower.replace(/s$/, "")} cost in ${area.name}, ${city.name}?`,
      answer: `Walk-in consultation fees at ${catLower} in ${area.name}, ${city.name} typically start from ${gpFee} for a GP visit. Specialist consultations range from AED 300 to 800 depending on the specialty and clinic tier. With insurance, you typically pay only the co-payment amount. Always confirm fees directly with the facility.`,
    },
    {
      question: `Do walk-in ${catLower} in ${area.name}, ${city.name} accept insurance?`,
      answer: `Most walk-in ${catLower} in ${area.name}, ${city.name} accept major UAE insurance plans including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Walk-in consultations are generally covered under standard insurance plans. Always carry your insurance card and Emirates ID. Contact the facility directly to confirm coverage.`,
    },
    {
      question: `Are walk-in ${catLower} in ${area.name}, ${city.name} licensed?`,
      answer: `Yes. All ${catLower} listed in the UAE Open Healthcare Directory are sourced from official government registers. Healthcare in ${city.name} is regulated by ${regulator}. All listed facilities in ${area.name} hold valid health authority licenses. Data was last verified in March 2026.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Walk-In", url: `${base}/directory/${city.slug}/${area.slug}/walk-in` },
    { name: cat.name },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={itemListSchema(`Walk-In ${cat.name} in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "Walk-In", href: `/directory/${city.slug}/${area.slug}/walk-in` },
        { label: cat.name },
      ]} />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          Walk-In {cat.name} in {area.name}, {city.name}, UAE
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          {count} verified facilities · No appointment needed · Last updated March 2026
        </p>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count}{" "}
            {catLower} in {area.name}, {city.name} that accept walk-in patients.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <>{" "}The highest-rated is <strong>{sorted[0].name}</strong> with a{" "}
              {sorted[0].googleRating}-star Google rating based on{" "}
              {sorted[0].googleReviewCount.toLocaleString()} patient reviews.</>
            )}{" "}
            {waitTimeText} All listings are sourced from official {regulator} licensed facility registers.
          </p>
        </div>
      </div>

      <div className="border border-black/[0.06] bg-[#f8f8f6] p-5 mb-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight mb-3">Typical Wait Times — {cat.name} in {area.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">GP Walk-In</p><p className="text-black/40">15-45 minutes</p></div>
          <div><p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">Specialist Appointment</p><p className="text-black/40">1-7 days</p></div>
          <div><p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">Lab Results (basic)</p><p className="text-black/40">Same day</p></div>
          <div><p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">Consultation Fee (GP)</p><p className="text-black/40">{gpFee}</p></div>
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Walk-In {cat.name} in {area.name}, {city.name}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <ProviderCard key={provider.id} name={provider.name} slug={provider.slug}
              citySlug={provider.citySlug} categorySlug={provider.categorySlug}
              address={provider.address} phone={provider.phone} website={provider.website}
              shortDescription={provider.shortDescription} googleRating={provider.googleRating}
              googleReviewCount={provider.googleReviewCount} isClaimed={provider.isClaimed}
              isVerified={provider.isVerified} />
          ))}
        </div>
      </section>

      <section className="mb-10 space-y-2">
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          See all walk-in facilities in {area.name}?{" "}
          <Link href={`/directory/${city.slug}/${area.slug}/walk-in`} className="text-[#006828] hover:underline font-medium">
            All walk-in clinics in {area.name} &rarr;
          </Link>
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          See city-wide walk-in {catLower}?{" "}
          <Link href={`/directory/${city.slug}/walk-in/${cat.slug}`} className="text-[#006828] hover:underline font-medium">
            Walk-in {catLower} across {city.name} &rarr;
          </Link>
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Browse all {catLower} in {area.name}?{" "}
          <Link href={`/directory/${city.slug}/${area.slug}/${cat.slug}`} className="text-[#006828] hover:underline font-medium">
            All {catLower} in {area.name} &rarr;
          </Link>
        </p>
      </section>

      <FaqSection faqs={faqs} title={`Walk-In ${cat.name} in ${area.name}, ${city.name} — FAQ`} />
    </div>
  );
}
