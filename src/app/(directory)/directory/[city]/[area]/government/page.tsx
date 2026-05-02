import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCityBySlug,
  getCategories,
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
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { city: string; area: string };
}

/** Only generate pages for city x area combos with 3+ government providers */
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const params: { city: string; area: string }[] = [];

  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const providers = await safe(
        getGovernmentProviders(city.slug, undefined, area.slug),
        [],
        "gov-area:params",
      );
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

  const providers = await safe(
    getGovernmentProviders(city.slug, undefined, area.slug),
    [],
    "gov-area:page",
  );
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const operator = getGovernmentOperator(city.slug);
  const count = providers.length;
  const categories = getCategories();

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

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Government", url: `${base}/directory/${city.slug}/${area.slug}/government` },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "Government" },
      ]}
      eyebrow={`Government · ${area.name}, ${city.name}`}
      title={`Government healthcare in ${area.name}, ${city.name}.`}
      subtitle={
        <span>
          {count} government and public facilities in {area.name}, operated by {operator}. Free for UAE nationals, subsidized for insured residents.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} government and public healthcare facilities in {area.name}, {city.name}. These facilities are operated by {operator} and offer services that are often free for UAE nationals or subsidized for insured residents.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated government facility in {area.name} is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers.
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
              `Government Healthcare in ${area.name}, ${city.name}`,
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
              Related
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`Government healthcare in ${city.name}`}
                href={`/directory/${city.slug}/government`}
              />
              <ListingsCrossLink
                label={`All healthcare in ${area.name}`}
                href={`/directory/${city.slug}/${area.slug}`}
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Government healthcare in {area.name} — FAQ
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
