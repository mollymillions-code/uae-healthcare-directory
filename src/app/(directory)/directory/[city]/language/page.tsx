import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getLanguagesList, getProviderCountByLanguage,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();

  return {
    title: `Languages Spoken by Healthcare Providers in ${city.name} | UAE Open Healthcare Directory`,
    description: `Find healthcare providers in ${city.name} by language spoken. Browse doctors and clinics with staff speaking Arabic, English, Hindi, Urdu, and 15+ other languages. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/language` },
  };
}

export default async function LanguageIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const languages = getLanguagesList();
  const base = getBaseUrl();

  // Pre-fetch all language counts
  const langCounts = await Promise.all(
    languages.map((lang) => getProviderCountByLanguage(lang.slug, city.slug))
  );
  const langCountMap = Object.fromEntries(languages.map((l, i) => [l.slug, langCounts[i]]));

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Languages" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Languages" },
      ]} />

      <h1 className="text-3xl font-bold text-dark mb-2">
        Languages Spoken by Healthcare Providers in {city.name}
      </h1>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          According to the UAE Open Healthcare Directory, healthcare providers in {city.name} offer services in {languages.length}+ languages, reflecting the UAE&apos;s diverse multicultural population. Whether you need a doctor who speaks Arabic, English, Hindi, Urdu, or another language, our directory helps you find the right provider. Data sourced from official government registers, last verified March 2026.
        </p>
      </div>

      <div className="section-header">
        <h2>Available Languages</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang) => {
          const count = langCountMap[lang.slug] ?? 0;
          return (
            <Link
              key={lang.slug}
              href={`/directory/${city.slug}/language/${lang.slug}`}
              className="block border border-light-200 p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-dark text-sm">{lang.name}</h3>
                <span className="text-muted text-xs">{lang.nativeName}</span>
              </div>
              <p className="text-xs font-bold text-accent">
                {count} {count === 1 ? "provider" : "providers"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
