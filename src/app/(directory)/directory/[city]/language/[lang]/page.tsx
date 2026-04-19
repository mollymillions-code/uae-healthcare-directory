import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getLanguagesList, getProvidersByLanguage, getProviderCountByLanguage,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 21600;

interface Props {
  params: { city: string; lang: string };
}

export async function generateStaticParams() {
  const cities = getCities();
  const languages = getLanguagesList();
  const params: { city: string; lang: string }[] = [];

  for (const city of cities) {
    for (const lang of languages) {
      const count = await getProviderCountByLanguage(lang.slug, city.slug);
      if (count > 0) {
        params.push({ city: city.slug, lang: lang.slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const language = getLanguagesList().find((l) => l.slug === params.lang);
  if (!language) return {};
  const count = await getProviderCountByLanguage(language.slug, city.slug);
  const base = getBaseUrl();

  return {
    title: `${language.name}-Speaking Doctors in ${city.name} | ${count} ${count === 1 ? "Provider" : "Providers"}`,
    description: `Find ${count} healthcare providers in ${city.name} with ${language.name}-speaking staff. Browse verified listings with ratings, reviews, and contact details. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/language/${language.slug}` },
  };
}

export default async function LanguageProviderPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const language = getLanguagesList().find((l) => l.slug === params.lang);
  if (!language) notFound();

  const providers = await getProvidersByLanguage(language.slug, city.slug);
  const count = providers.length;
  const base = getBaseUrl();

  const faqs = [
    {
      question: `How do I find a ${language.name}-speaking doctor in ${city.name}?`,
      answer: `The UAE Open Healthcare Directory lists ${count} healthcare ${count === 1 ? "provider" : "providers"} in ${city.name} with ${language.name}-speaking staff. Browse the listings above to find hospitals, clinics, and specialists where staff speak ${language.name}.`,
    },
    {
      question: `How many healthcare providers in ${city.name} have ${language.name}-speaking staff?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} healthcare ${count === 1 ? "provider" : "providers"} in ${city.name} with ${language.name}-speaking staff. This includes hospitals, clinics, dental practices, and specialist centers. Last verified March 2026.`,
    },
    {
      question: `Can I get medical care in ${language.name} in ${city.name}?`,
      answer: `Yes. Multiple healthcare facilities in ${city.name} employ ${language.name}-speaking medical professionals. You can receive consultations, treatment, and follow-up care in ${language.name} at these verified providers.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Languages", url: `${base}/directory/${city.slug}/language` },
        { name: language.name },
      ])} />
      {providers.length > 0 && (
        <JsonLd data={itemListSchema(`${language.name}-Speaking Healthcare Providers in ${city.name}`, providers, city.name, base)} />
      )}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Languages", href: `/directory/${city.slug}/language` },
        { label: language.name },
      ]} />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
        {language.name}-Speaking Healthcare Providers in {city.name}
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
        {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
      </p>

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          According to the UAE Open Healthcare Directory, there are {count} healthcare {count === 1 ? "provider" : "providers"} in {city.name} with {language.name}-speaking staff. The UAE&apos;s multicultural healthcare system ensures patients can receive care in their preferred language. Data from official government registers, last verified March 2026.
        </p>
      </div>

      {providers.length > 0 ? (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.slice(0, 48).map((p) => (
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
                coverImageUrl={p.coverImageUrl}
              />
            ))}
          </div>
          {providers.length > 48 && (
            <div className="text-center mt-6 py-4 border-t border-black/[0.06]">
              <Link href={`/search?city=${city.slug}&q=${language.name}`} className="btn-accent">
                View all {count} {language.name}-speaking providers
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-black/40 mb-2">No providers with {language.name}-speaking staff found in {city.name} yet.</p>
          <Link href={`/directory/${city.slug}`} className="text-[#006828] text-sm">
            View all healthcare providers in {city.name} &rarr;
          </Link>
        </div>
      )}

      <FaqSection faqs={faqs} title={`${language.name}-Speaking Doctors in ${city.name} — FAQ`} />
    </div>
  );
}
