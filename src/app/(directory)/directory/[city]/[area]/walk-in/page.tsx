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
  params: { city: string; area: string };
}

const WALK_IN_CATS = [
  "clinics", "dental", "dermatology", "ophthalmology", "pediatrics",
  "ent", "pharmacy", "labs-diagnostics", "emergency-care",
];

/** Only generate pages for city x area combos with 3+ walk-in providers */
export async function generateStaticParams() {
  const cities = getCities();
  const params: { city: string; area: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const providers = await getWalkInProviders(city.slug, undefined, area.slug);
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

  const providers = await getWalkInProviders(city.slug, undefined, area.slug);
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const gpFee = getGPFeeRange(city.slug);
  const pageUrl = `${base}/directory/${city.slug}/${area.slug}/walk-in`;
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

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Walk-In Clinics", url: pageUrl },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={itemListSchema(`Walk-In Clinics in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "Walk-In Clinics" },
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">
          Walk-In Clinics in {area.name}, {city.name}, UAE
        </h1>
        <p className="text-sm text-muted mb-4">
          {count} verified walk-in facilities · GP wait: 15-45 min · Last updated March 2026
        </p>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count}{" "}
            walk-in clinics and polyclinics in {area.name}, {city.name}, UAE.
            These facilities accept patients without prior appointments. GP
            walk-in wait times are typically 15 to 45 minutes; specialist
            appointments can usually be booked within 1 to 7 days.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <>{" "}The highest-rated is <strong>{sorted[0].name}</strong> with a{" "}
              {sorted[0].googleRating}-star Google rating based on{" "}
              {sorted[0].googleReviewCount.toLocaleString()} patient reviews.</>
            )}{" "}
            A standard GP consultation costs {gpFee}. All listings are sourced
            from official {regulator} licensed facility registers.
          </p>
        </div>
      </div>

      {categoryLinks.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-dark mb-2">Filter by specialty:</p>
          <div className="flex flex-wrap gap-2">
            {categoryLinks.map((cat) => (
              <Link key={cat.slug} href={`/directory/${city.slug}/${area.slug}/walk-in/${cat.slug}`}
                className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted">
                {cat.name} ({categoryCounts.get(cat.slug)})
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border border-light-200 bg-light-50 p-5 mb-8">
        <h2 className="font-semibold text-dark mb-3">Typical Wait Times in {area.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="font-medium text-dark">GP Walk-In</p><p className="text-muted">15-45 minutes</p></div>
          <div><p className="font-medium text-dark">Specialist Appointment</p><p className="text-muted">1-7 days</p></div>
          <div><p className="font-medium text-dark">Lab Results (basic)</p><p className="text-muted">Same day</p></div>
          <div><p className="font-medium text-dark">Emergency Triage</p><p className="text-muted">Immediate (critical) / 30-120 min (non-critical)</p></div>
        </div>
      </div>

      <section className="mb-10">
        <div className="section-header">
          <h2>All Walk-In Clinics in {area.name}, {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
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
        <p className="text-sm text-muted">
          See all walk-in clinics in {city.name}?{" "}
          <Link href={`/directory/${city.slug}/walk-in`} className="text-accent hover:underline font-medium">
            Walk-in clinics across {city.name} &rarr;
          </Link>
        </p>
        <p className="text-sm text-muted">
          Browse all healthcare in {area.name}?{" "}
          <Link href={`/directory/${city.slug}/${area.slug}`} className="text-accent hover:underline font-medium">
            All providers in {area.name} &rarr;
          </Link>
        </p>
        <p className="text-sm text-muted">
          Need 24-hour care?{" "}
          <Link href={`/directory/${city.slug}/24-hour`} className="text-accent hover:underline font-medium">
            24-hour healthcare in {city.name} &rarr;
          </Link>
        </p>
      </section>

      <FaqSection faqs={faqs} title={`Walk-In Clinics in ${area.name}, ${city.name} — FAQ`} />
    </div>
  );
}
