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
  params: { city: string };
}

/** Only generate pages for cities with 3+ government providers */
export function generateStaticParams() {
  const cities = getCities();
  const params: { city: string }[] = [];

  for (const city of cities) {
    const providers = getGovernmentProviders(city.slug);
    if (providers.length >= 3) {
      params.push({ city: city.slug });
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
  if (citySlug === "dubai")
    return "DHA operates government hospitals such as Rashid Hospital, Dubai Hospital, Latifa Hospital, and primary healthcare centers across the emirate.";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "SEHA (Abu Dhabi Health Services Company) manages public hospitals including Sheikh Khalifa Medical City, Tawam Hospital, Al Ain Hospital, and Mafraq Hospital under DOH oversight.";
  return "MOHAP directly operates government hospitals and primary healthcare centers across the Northern Emirates, including Al Qassimi Hospital in Sharjah, Saqr Hospital in Ras Al Khaimah, and clinics in Ajman, Umm Al Quwain, and Fujairah.";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const base = getBaseUrl();
  const title = `Government & Public Healthcare in ${city.name}, UAE | Free & Subsidized`;
  const description = `Find government hospitals, public health centers, and MOHAP/DHA/SEHA facilities in ${city.name}, UAE. Many services are free or subsidized for Emiratis and insured residents. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/government`;

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

export default function GovernmentCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const providers = getGovernmentProviders(city.slug);
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const operatorNote = getGovernmentOperator(city.slug);
  const count = providers.length;

  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const categoryCounts = new Map<string, number>();
  for (const p of providers) {
    categoryCounts.set(
      p.categorySlug,
      (categoryCounts.get(p.categorySlug) || 0) + 1
    );
  }
  const categories = getCategories();
  const categoryLinks = categories.filter(
    (cat) => (categoryCounts.get(cat.slug) || 0) >= 3
  );

  const faqs = [
    {
      question: `How many government healthcare facilities are in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} government and public healthcare facilities in ${city.name}. These include government hospitals, primary healthcare centers, and specialty clinics operated by ${regulator.replace("the ", "")}. ${operatorNote} All listings are sourced from official health authority registers, last verified March 2026.`,
    },
    {
      question: `Is government healthcare free in ${city.name}?`,
      answer: `Many government healthcare services in ${city.name} are free or heavily subsidized for UAE nationals. Emirati citizens with Thiqa insurance (Abu Dhabi) or DHA coverage (Dubai) receive most services at no cost. Expatriate residents with valid health insurance can access government facilities at reduced rates, typically paying only co-payments. Emergency services at government hospitals cannot be refused regardless of insurance status. Uninsured patients may pay out-of-pocket at government-set rates, which are significantly lower than private hospital fees.`,
    },
    {
      question: `What is the difference between government and private healthcare in ${city.name}?`,
      answer: `Government healthcare in ${city.name} is operated by ${regulator.replace("the ", "")} and offers services at lower cost, often free for nationals. Wait times tend to be longer (1 to 4 weeks for specialist appointments vs. 1 to 7 days at private facilities). Private hospitals generally offer shorter wait times, more comfortable amenities, and wider specialist availability but at higher cost (GP visits: AED 150 to 300 private vs. AED 0 to 50 government). Both sectors are licensed by ${regulator} and meet the same regulatory standards.`,
    },
    {
      question: `Which insurance plans are accepted at government hospitals in ${city.name}?`,
      answer: `Government hospitals in ${city.name} accept Thiqa (for UAE nationals in Abu Dhabi), Daman (mandatory for Abu Dhabi expatriates), DHA Essential Benefits Plan (mandatory in Dubai), and most major private insurance plans including AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz. Coverage levels depend on your specific plan. Always carry your Emirates ID and insurance card when visiting a government facility.`,
    },
    {
      question: `How do I register at a government health center in ${city.name}?`,
      answer: `To register at a government health center in ${city.name}, visit the facility with your Emirates ID (or passport for visitors), insurance card, and any existing medical records. In Dubai, you can register online through the DHA app. In Abu Dhabi, the SEHA app allows appointment booking. In the Northern Emirates, MOHAP facilities accept walk-in registrations. Once registered, you receive a medical record number for future visits. Initial registration is typically free for insured patients.`,
    },
    {
      question: `Are government hospitals in ${city.name} good quality?`,
      answer: `Government hospitals in ${city.name} are licensed and regularly inspected by ${regulator}. Many are internationally accredited by JCI (Joint Commission International). Government hospitals handle complex cases including trauma, organ transplants, and advanced cancer treatment. They employ qualified specialists and maintain modern diagnostic equipment. Patient reviews on the UAE Open Healthcare Directory show ratings for each facility based on real patient experiences.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Government", url: `${base}/directory/${city.slug}/government` },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={itemListSchema(
          `Government Healthcare in ${city.name}`,
          sorted.slice(0, 20),
          city.name,
          base
        )}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: "Government" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">
          Government & Public Healthcare in {city.name}, UAE
        </h1>
        <p className="text-sm text-muted mb-4">
          {count} government & public facilities · Last updated March 2026
        </p>

        <div className="bg-emerald-50 border border-emerald-200 p-4 mb-6">
          <p className="text-sm font-bold text-emerald-800 mb-1">
            About UAE Public Healthcare
          </p>
          <p className="text-sm text-emerald-700">
            {city.slug === "dubai" &&
              "In Dubai, government healthcare is operated by the Dubai Health Authority (DHA). DHA runs public hospitals (Rashid, Dubai, Latifa, Hatta, Al Baraha) and primary healthcare centers across the emirate. Services are free or subsidized for Emiratis and heavily discounted for insured residents."}
            {(city.slug === "abu-dhabi" || city.slug === "al-ain") &&
              "In Abu Dhabi, SEHA (Abu Dhabi Health Services Company) manages government hospitals under DOH regulation. Major facilities include Sheikh Khalifa Medical City, Tawam Hospital, Mafraq Hospital, and Al Ain Hospital. UAE nationals with Thiqa insurance receive free care; expatriates pay subsidized rates through Daman or employer plans."}
            {city.slug !== "dubai" &&
              city.slug !== "abu-dhabi" &&
              city.slug !== "al-ain" &&
              "In the Northern Emirates, government healthcare is operated directly by the Ministry of Health and Prevention (MOHAP). MOHAP runs hospitals and primary healthcare centers in Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain, and Fujairah. Many services are free or subsidized for UAE nationals and insured residents."}
          </p>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, there are {count}{" "}
            government and public healthcare facilities in {city.name}.{" "}
            {operatorNote}
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <>
                {" "}
                The highest-rated government facility is{" "}
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

      {categoryLinks.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-dark mb-2">
            Filter by category:
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryLinks.map((cat) => (
              <Link
                key={cat.slug}
                href={`/directory/${city.slug}/government/${cat.slug}`}
                className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted"
              >
                {cat.name} ({categoryCounts.get(cat.slug)})
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="mb-10">
        <div className="section-header">
          <h2>Government & Public Facilities in {city.name}</h2>
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

      <section className="mb-10 space-y-2">
        <p className="text-sm text-muted">
          Looking for private healthcare?{" "}
          <Link
            href={`/directory/${city.slug}`}
            className="text-accent hover:underline font-medium"
          >
            Browse all healthcare providers in {city.name} &rarr;
          </Link>
        </p>
        <p className="text-sm text-muted">
          Need emergency care?{" "}
          <Link
            href={`/directory/${city.slug}/emergency`}
            className="text-accent hover:underline font-medium"
          >
            Emergency healthcare in {city.name} &rarr;
          </Link>
        </p>
      </section>

      <FaqSection
        faqs={faqs}
        title={`Government Healthcare in ${city.name} — FAQ`}
      />
    </div>
  );
}
