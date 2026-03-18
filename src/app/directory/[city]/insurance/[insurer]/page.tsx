import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getInsuranceProviders, getProvidersByInsurance, getProviderCountByInsurance,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 21600;

interface Props {
  params: { city: string; insurer: string };
}

export function generateStaticParams() {
  const cities = getCities();
  const insurers = getInsuranceProviders();
  const params: { city: string; insurer: string }[] = [];

  for (const city of cities) {
    for (const ins of insurers) {
      params.push({ city: city.slug, insurer: ins.slug });
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const insurer = getInsuranceProviders().find((i) => i.slug === params.insurer);
  if (!insurer) return {};
  const count = getProviderCountByInsurance(insurer.slug, city.slug);
  const base = getBaseUrl();

  return {
    title: `Clinics Accepting ${insurer.name} Insurance in ${city.name} | ${count} ${count === 1 ? "Provider" : "Providers"}`,
    description: `Find ${count} healthcare providers in ${city.name} that accept ${insurer.name} insurance. ${insurer.description} Browse verified listings with ratings, reviews, and contact details. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/insurance/${insurer.slug}` },
  };
}

export default function InsuranceProviderPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const insurer = getInsuranceProviders().find((i) => i.slug === params.insurer);
  if (!insurer) notFound();

  const providers = getProvidersByInsurance(insurer.slug, city.slug);
  const count = providers.length;
  const base = getBaseUrl();

  const faqs = [
    {
      question: `Does ${insurer.name} cover healthcare in ${city.name}?`,
      answer: `Yes. ${insurer.name} insurance is accepted at ${count} healthcare ${count === 1 ? "provider" : "providers"} in ${city.name}, UAE. ${insurer.description} Use our directory to find specific clinics and hospitals that accept ${insurer.name}.`,
    },
    {
      question: `How many providers accept ${insurer.name} in ${city.name}?`,
      answer: `According to the UAE Healthcare Directory, there are ${count} healthcare ${count === 1 ? "provider" : "providers"} in ${city.name} that accept ${insurer.name} insurance. This includes hospitals, clinics, and specialist centers. Last verified March 2026.`,
    },
    {
      question: `What specialists accept ${insurer.name} insurance in ${city.name}?`,
      answer: `${insurer.name} is accepted by a range of specialists in ${city.name}, including hospitals, dental clinics, dermatologists, ophthalmologists, and more. Browse our listings to filter by specialty and find the right provider for your needs.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Insurance", url: `${base}/directory/${city.slug}/insurance` },
        { name: insurer.name },
      ])} />
      {providers.length > 0 && (
        <JsonLd data={itemListSchema(`Healthcare Providers Accepting ${insurer.name} in ${city.name}`, providers, city.name)} />
      )}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance", href: `/directory/${city.slug}/insurance` },
        { label: insurer.name },
      ]} />

      <h1 className="text-3xl font-bold text-dark mb-2">
        {insurer.name} Insurance — Healthcare Providers in {city.name}
      </h1>
      <p className="text-sm text-muted mb-4">
        {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
      </p>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          According to the UAE Healthcare Directory, there are {count} healthcare {count === 1 ? "provider" : "providers"} in {city.name} that accept {insurer.name} insurance. {insurer.description} Data from official government registers, last verified March 2026.
        </p>
      </div>

      {providers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              name={p.name}
              slug={p.slug}
              citySlug={p.citySlug}
              categorySlug={p.categorySlug}
              address={p.address}
              phone={p.phone}
              website={p.website}
              shortDescription={p.shortDescription}
              googleRating={p.googleRating}
              googleReviewCount={p.googleReviewCount}
              isClaimed={p.isClaimed}
              isVerified={p.isVerified}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted mb-2">No providers accepting {insurer.name} found in {city.name} yet.</p>
          <Link href={`/directory/${city.slug}`} className="text-accent text-sm">
            View all healthcare providers in {city.name} &rarr;
          </Link>
        </div>
      )}

      <FaqSection faqs={faqs} title={`${insurer.name} Insurance in ${city.name} — FAQ`} />
    </div>
  );
}
