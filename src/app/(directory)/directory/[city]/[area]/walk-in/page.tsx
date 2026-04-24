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
  params: { city: string; area: string };
}

const WALK_IN_CATS = [
  "clinics", "dental", "dermatology", "ophthalmology", "pediatrics",
  "ent", "pharmacy", "labs-diagnostics", "emergency-care",
];

/** Only generate pages for city x area combos with 3+ walk-in providers */
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const params: { city: string; area: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const providers = await safe(
        getWalkInProviders(city.slug, undefined, area.slug),
        [],
        "walkin-area:params",
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
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

function getGPFeeRange(citySlug: string): string {
  if (citySlug === "dubai") return "AED 150-300";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "AED 100-250";
  if (citySlug === "sharjah") return "AED 100-200";
  return "AED 80-200";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) return {};

  const base = getBaseUrl();
  const title = `Walk-In Clinics in ${area.name}, ${city.name}, UAE | No Appointment Needed`;
  const description = `Find walk-in clinics and polyclinics in ${area.name}, ${city.name}, UAE. GP wait times 15-45 min. Specialist appointments within 1-7 days. All facilities verified against official health authority registers. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/walk-in`;

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

export default async function AreaWalkInPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) notFound();

  const providers = await safe(
    getWalkInProviders(city.slug, undefined, area.slug),
    [],
    "walkin-area:page",
  );
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const gpFee = getGPFeeRange(city.slug);
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
  const categoryLinks = categories.filter(
    (cat) => WALK_IN_CATS.includes(cat.slug) && (categoryCounts.get(cat.slug) || 0) >= 3
  );

  const faqs = [
    {
      question: `Which walk-in clinics are available in ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} walk-in clinics and polyclinics in ${area.name}, ${city.name}, UAE. These facilities accept patients without prior appointments for general practice consultations, minor illnesses, and routine check-ups. All listings are sourced from official ${regulator} licensed facility registers, last verified March 2026.`,
    },
    {
      question: `What are the typical wait times at walk-in clinics in ${area.name}, ${city.name}?`,
      answer: `GP walk-in wait times in ${area.name}, ${city.name} are typically 15 to 45 minutes depending on patient volume and time of day. Early mornings and late afternoons tend to be busiest. Specialist appointments can usually be booked within 1 to 7 days. Some clinics offer online queue management to reduce in-clinic waiting.`,
    },
    {
      question: `How much does a walk-in GP consultation cost in ${area.name}, ${city.name}?`,
      answer: `A standard GP walk-in consultation in ${area.name}, ${city.name} typically costs ${gpFee}, depending on the clinic tier and whether you pay out-of-pocket or through insurance. Specialist consultations range from AED 300 to 800 or more. With insurance, you typically pay only the co-payment amount (usually AED 0 to 50 for GP visits). Always confirm fees directly with the clinic.`,
    },
    {
      question: `Do walk-in clinics in ${area.name}, ${city.name} accept insurance?`,
      answer: `Most walk-in clinics in ${area.name}, ${city.name} accept major UAE insurance plans including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Walk-in GP consultations are generally covered under standard insurance plans. Always carry your insurance card and Emirates ID. Contact the clinic directly to confirm coverage before your visit.`,
    },
    {
      question: `What services do walk-in clinics in ${area.name}, ${city.name} offer?`,
      answer: `Walk-in clinics in ${area.name}, ${city.name} typically offer general practice consultations, vaccinations, minor wound care, prescription refills, basic lab tests (CBC, blood sugar), sick notes, and referrals to specialists. Multi-specialty polyclinics may also offer dental, dermatology, pediatrics, and ophthalmology services on a walk-in or same-day appointment basis.`,
    },
    {
      question: `Are walk-in clinics in ${area.name}, ${city.name} open on weekends?`,
      answer: `Many walk-in clinics in ${area.name}, ${city.name} operate on weekends, though hours may be reduced. Saturday hours are common across most clinics. Some clinics also open on Sundays, particularly polyclinics and multi-specialty centers. Check individual clinic listings on the UAE Open Healthcare Directory for specific weekend hours and availability.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Walk-In Clinics", url: `${base}/directory/${city.slug}/${area.slug}/walk-in` },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "Walk-In Clinics" },
      ]}
      eyebrow={`Walk-in · ${area.name}, ${city.name}`}
      title={`Walk-in clinics in ${area.name}, ${city.name}.`}
      subtitle={
        <span>
          {count} verified walk-in facilities in {area.name}. Typical GP wait: 15-45 minutes. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} walk-in clinics and polyclinics in {area.name}, {city.name}, UAE. These facilities accept patients without prior appointments. GP walk-in wait times are typically 15 to 45 minutes; specialist appointments can usually be booked within 1 to 7 days.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          A standard GP consultation costs {gpFee}. All listings are sourced from official {regulator} licensed facility registers.
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
          <JsonLd data={itemListSchema(`Walk-In Clinics in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />
        </>
      }
      belowGrid={
        <>
          {categoryLinks.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Walk-in {area.name.toLowerCase()} by specialty
              </h2>
              <ul className="flex flex-wrap gap-2">
                {categoryLinks.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/directory/${city.slug}/${area.slug}/walk-in/${cat.slug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {cat.name} ({categoryCounts.get(cat.slug)})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-z-md border border-ink-line bg-white p-5 sm:p-6">
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-3">
              Typical wait times in {area.name}
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
                <p className="font-semibold text-ink">Emergency Triage</p>
                <p className="text-ink-muted">Immediate (critical) / 30-120 min (non-critical)</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`Walk-in clinics across ${city.name}`}
                href={`/directory/${city.slug}/walk-in`}
              />
              <ListingsCrossLink
                label={`All healthcare in ${area.name}`}
                href={`/directory/${city.slug}/${area.slug}`}
              />
              <ListingsCrossLink
                label={`24-hour healthcare in ${city.name}`}
                href={`/directory/${city.slug}/24-hour`}
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Walk-in clinics in {area.name} — FAQ
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
