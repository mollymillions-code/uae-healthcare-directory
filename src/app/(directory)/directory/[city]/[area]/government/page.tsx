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
  getAreasByCity,
  getAreaBySlug,
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
  params: { city: string; area: string };
}

/** Only generate pages for city x area combos with 3+ government providers */
export async function generateStaticParams() {
  const cities = getCities();
  const params: { city: string; area: string }[] = [];

  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const providers = await getGovernmentProviders(city.slug, undefined, area.slug);
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

function getGovernmentOperator(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "SEHA (Abu Dhabi Health Services Company) under DOH oversight";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) return {};

  const base = getBaseUrl();
  const title = `Government Healthcare in ${area.name}, ${city.name} | Public Facilities`;
  const description = `Find government hospitals, public health centers, and MOHAP/DHA/SEHA facilities in ${area.name}, ${city.name}, UAE. Free or subsidized services for Emiratis and insured residents. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/government`;

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

export default async function GovernmentAreaPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) notFound();

  const providers = await getGovernmentProviders(city.slug, undefined, area.slug);
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const operator = getGovernmentOperator(city.slug);
  const count = providers.length;

  // Sort by rating descending
  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const faqs = [
    {
      question: `How many government healthcare facilities are in ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} government and public healthcare facilities in ${area.name}, ${city.name}. These are operated by ${operator}. All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `Is government healthcare free in ${area.name}, ${city.name}?`,
      answer: `Many government healthcare services in ${area.name} are free or subsidized for UAE nationals with Thiqa or DHA insurance. Insured expatriates typically pay reduced co-payments at government facilities. Emergency services cannot be refused regardless of insurance status. Uninsured patients pay out-of-pocket at government-regulated rates, which are significantly lower than private facility fees.`,
    },
    {
      question: `What government healthcare services are available in ${area.name}?`,
      answer: `Government healthcare facilities in ${area.name}, ${city.name} may include primary healthcare centers (offering GP consultations, vaccinations, chronic disease management, and maternal care), government hospitals (offering emergency departments, specialist clinics, diagnostics, and inpatient care), and specialized government clinics. Services vary by facility size and type.`,
    },
    {
      question: `How do I book an appointment at a government facility in ${area.name}?`,
      answer: `${city.slug === "dubai" ? "In Dubai, appointments at DHA government facilities can be booked through the DHA app or by calling the DHA hotline at 800-342." : ""} ${city.slug === "abu-dhabi" || city.slug === "al-ain" ? "In Abu Dhabi, SEHA facility appointments can be booked through the SEHA app or website." : ""} ${city.slug !== "dubai" && city.slug !== "abu-dhabi" && city.slug !== "al-ain" ? "For MOHAP facilities, appointments can be booked through the MOHAP smart app or website." : ""} Walk-in services are available at most government primary healthcare centers, though wait times may be longer than booked appointments. Bring your Emirates ID and insurance card.`,
    },
    {
      question: `What are the typical operating hours for government facilities in ${area.name}?`,
      answer: `Government primary healthcare centers in ${area.name} typically operate Sunday through Thursday, 7:30 AM to 2:30 PM, with some offering extended evening hours until 8 PM or 10 PM. Government hospital outpatient departments usually run Sunday through Thursday, 8 AM to 3 PM. Emergency departments at government hospitals operate 24/7. Some facilities offer limited Saturday services. Check individual facility listings on the UAE Open Healthcare Directory for specific hours.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    {
      name: "Government",
      url: `${base}/directory/${city.slug}/${area.slug}/government`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={itemListSchema(
          `Government Healthcare in ${area.name}, ${city.name}`,
          sorted.slice(0, 20),
          city.name,
          base
        )}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
          { label: "Government" },
        ]}
      />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          Government Healthcare in {area.name}, {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          {count} government & public facilities · Last updated March 2026
        </p>

        {/* Government info callout */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 mb-6">
          <p className="text-sm font-bold text-emerald-800 mb-1">
            Public Healthcare in {area.name}
          </p>
          <p className="text-sm text-emerald-700">
            Government healthcare facilities in {area.name} are operated by{" "}
            {operator}. Many services are free for UAE nationals and subsidized
            for insured residents. Emergency services are available regardless
            of insurance status.
          </p>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count}{" "}
            government and public healthcare facilities in {area.name},{" "}
            {city.name}. These facilities are operated by {operator} and offer
            services that are often free for UAE nationals or subsidized for
            insured residents.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <>
                {" "}
                The highest-rated government facility in {area.name} is{" "}
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
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Government Facilities in {area.name}, {city.name}
          </h2>
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
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          See all government facilities in {city.name}?{" "}
          <Link
            href={`/directory/${city.slug}/government`}
            className="text-[#006828] hover:underline font-medium"
          >
            Government healthcare in {city.name} &rarr;
          </Link>
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Browse all providers in {area.name}?{" "}
          <Link
            href={`/directory/${city.slug}/${area.slug}`}
            className="text-[#006828] hover:underline font-medium"
          >
            All healthcare providers in {area.name} &rarr;
          </Link>
        </p>
      </section>

      <FaqSection
        faqs={faqs}
        title={`Government Healthcare in ${area.name}, ${city.name} — FAQ`}
      />
    </div>
  );
}
