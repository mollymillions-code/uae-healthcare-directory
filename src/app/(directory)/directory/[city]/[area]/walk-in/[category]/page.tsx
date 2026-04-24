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
  getWalkInProviders,
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

const WALK_IN_CATS = [
  "clinics", "dental", "dermatology", "ophthalmology", "pediatrics",
  "ent", "pharmacy", "labs-diagnostics", "emergency-care",
];

/** Only generate for city x area x category combos with 3+ providers */
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; area: string; category: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        if (!WALK_IN_CATS.includes(cat.slug)) continue;
        const providers = await safe(
          getWalkInProviders(city.slug, cat.slug, area.slug),
          [],
          "walkin-area-cat:params",
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

  const providers = await safe(
    getWalkInProviders(city.slug, cat.slug, area.slug),
    [],
    "walkin-area-cat:page",
  );
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

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Walk-In", url: `${base}/directory/${city.slug}/${area.slug}/walk-in` },
    { name: cat.name },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "Walk-In", href: `/directory/${city.slug}/${area.slug}/walk-in` },
        { label: cat.name },
      ]}
      eyebrow={`Walk-in · ${cat.name} · ${area.name}`}
      title={`Walk-in ${catLower} in ${area.name}, ${city.name}.`}
      subtitle={
        <span>
          {count} verified {catLower} accepting walk-ins in {area.name}. No appointment needed. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} {catLower} in {area.name}, {city.name} that accept walk-in patients.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          {waitTimeText} All listings are sourced from official {regulator} licensed facility registers.
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
          <JsonLd data={itemListSchema(`Walk-In ${cat.name} in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />
        </>
      }
      belowGrid={
        <>
          <div className="rounded-z-md border border-ink-line bg-white p-5 sm:p-6">
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-3">
              Typical wait times — {cat.name} in {area.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-z-body-sm">
              <div>
                <p className="font-semibold text-ink">GP Walk-In</p>
                <p className="text-ink-muted">15-45 minutes</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Specialist Appointment</p>
                <p className="text-ink-muted">1-7 days</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Lab Results (basic)</p>
                <p className="text-ink-muted">Same day</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Consultation Fee (GP)</p>
                <p className="text-ink-muted">{gpFee}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All walk-in clinics in ${area.name}`}
                href={`/directory/${city.slug}/${area.slug}/walk-in`}
              />
              <ListingsCrossLink
                label={`Walk-in ${catLower} across ${city.name}`}
                href={`/directory/${city.slug}/walk-in/${cat.slug}`}
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
                Walk-in {catLower} in {area.name} — FAQ
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
