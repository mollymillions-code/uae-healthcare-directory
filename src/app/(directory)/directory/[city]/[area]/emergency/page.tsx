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
  getEmergencyProviders,
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

export function generateStaticParams() {
  const cities = getCities();
  const params: { city: string; area: string }[] = [];
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const providers = getEmergencyProviders(city.slug, area.slug);
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
  const title = `Emergency Healthcare in ${area.name}, ${city.name}, UAE | Hospitals & Urgent Care`;
  const description = `Find emergency rooms, urgent care centers, and hospitals with emergency departments in ${area.name}, ${city.name}, UAE. Wait times, insurance info, and contact details. Call 998 for ambulance. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/emergency`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

export default function EmergencyAreaPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) notFound();

  const providers = getEmergencyProviders(city.slug, area.slug);
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const count = providers.length;

  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const faqs = [
    {
      question: `What is the emergency number in ${area.name}, ${city.name}, UAE?`,
      answer: `The UAE emergency numbers are 998 for ambulance services and 999 for police and fire. These numbers work across all emirates including ${city.name}. For non-life-threatening emergencies, you can visit any hospital emergency department listed in the UAE Open Healthcare Directory. Dubai also operates the DHA hotline at 800-342.`,
    },
    {
      question: `How many hospitals have emergency departments near ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} healthcare facilities in and around ${area.name}, ${city.name} offering emergency or urgent care services. These include hospitals with 24/7 emergency departments and dedicated urgent care centers. All facilities are licensed by ${regulator}. Data last verified March 2026.`,
    },
    {
      question: `What are the typical emergency room wait times near ${area.name}, ${city.name}?`,
      answer: `Emergency departments near ${area.name}, ${city.name} use a triage system. Critical and life-threatening cases receive immediate attention. Urgent but non-critical cases are typically seen within 30 to 60 minutes. Non-urgent cases may wait 60 to 120 minutes or longer depending on patient volume. Trauma centers and major hospitals generally have shorter wait times for critical cases due to dedicated trauma teams on staff 24/7.`,
    },
    {
      question: `How much does an emergency room visit cost near ${area.name}, ${city.name}?`,
      answer: `An emergency room visit near ${area.name}, ${city.name} typically costs AED 300 to 1,000 before treatment, depending on the facility tier. With insurance, you usually pay only the co-payment (AED 0 to 100 for genuine emergencies). Without insurance, costs can range from AED 500 to several thousand dirhams depending on treatment required. Under UAE law, hospitals cannot refuse emergency treatment regardless of insurance status.`,
    },
    {
      question: `Does insurance cover emergency visits near ${area.name}, ${city.name}?`,
      answer: `Yes. Under UAE health insurance regulations, all basic health plans must cover emergency services. This applies to plans under both ${regulator} and MOHAP frameworks. Major insurers including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, and Allianz cover emergency department visits. Co-payments for emergencies are typically lower than for scheduled visits. Always carry your insurance card and Emirates ID to the emergency department.`,
    },
    {
      question: `What should I bring to an emergency room near ${area.name}, ${city.name}?`,
      answer: `When visiting an emergency room near ${area.name}, ${city.name}, bring your Emirates ID (or passport for visitors), health insurance card, a list of current medications, and any relevant medical records. If you have a chronic condition such as diabetes or heart disease, bring documentation. For children, bring their vaccination records if available. Payment method (credit card or cash) is needed for co-payments or uninsured portions.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Emergency", url: `${base}/directory/${city.slug}/${area.slug}/emergency` },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={itemListSchema(`Emergency Healthcare in ${area.name}, ${city.name}`, sorted.slice(0, 20), city.name, base)} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
        { label: "Emergency" },
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">Emergency Healthcare in {area.name}, {city.name}, UAE</h1>
        <p className="text-sm text-muted mb-4">{count} emergency & urgent care facilities · Last updated March 2026</p>

        <div className="bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm font-bold text-red-800 mb-1">Life-threatening emergency? Call now:</p>
          <p className="text-lg font-bold text-red-900">
            <a href="tel:998" className="hover:underline">998</a> (Ambulance) &nbsp;|&nbsp; <a href="tel:999" className="hover:underline">999</a> (Police/Fire)
          </p>
          <p className="text-xs text-red-700 mt-1">Dubai Health Authority hotline: <a href="tel:800342" className="hover:underline">800-342</a></p>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count} healthcare facilities in and around {area.name}, {city.name} offering emergency or urgent care services. These include hospital emergency departments and dedicated urgent care centers. For life-threatening emergencies, call 998 (Ambulance) or 999 (Police/Fire). Emergency departments provide immediate triage for critical cases. Non-critical emergency visits are typically attended to within 30 to 120 minutes.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <> The highest-rated facility is <strong>{sorted[0].name}</strong> with a {sorted[0].googleRating}-star Google rating based on {sorted[0].googleReviewCount.toLocaleString()} patient reviews.</>
            )}{" "}
            All listings are sourced from official {regulator} licensed facility registers.
          </p>
        </div>
      </div>

      <section className="mb-10">
        <div className="section-header">
          <h2>Emergency & Urgent Care Facilities near {area.name}, {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <ProviderCard key={provider.id} name={provider.name} slug={provider.slug} citySlug={provider.citySlug} categorySlug={provider.categorySlug} address={provider.address} phone={provider.phone} website={provider.website} shortDescription={provider.shortDescription} googleRating={provider.googleRating} googleReviewCount={provider.googleReviewCount} isClaimed={provider.isClaimed} isVerified={provider.isVerified} />
          ))}
        </div>
      </section>

      <section className="mb-10 space-y-2">
        <p className="text-sm text-muted">See all emergency facilities in {city.name}?{" "}<Link href={`/directory/${city.slug}/emergency`} className="text-accent hover:underline font-medium">Emergency healthcare in {city.name} &rarr;</Link></p>
        <p className="text-sm text-muted">Need 24-hour non-emergency care?{" "}<Link href={`/directory/${city.slug}/${area.slug}/24-hour`} className="text-accent hover:underline font-medium">24-hour healthcare in {area.name} &rarr;</Link></p>
        <p className="text-sm text-muted">Browse all providers?{" "}<Link href={`/directory/${city.slug}/${area.slug}`} className="text-accent hover:underline font-medium">All healthcare providers in {area.name} &rarr;</Link></p>
      </section>

      <FaqSection faqs={faqs} title={`Emergency Healthcare in ${area.name}, ${city.name} — FAQ`} />
    </div>
  );
}
