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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
        Languages Spoken by Healthcare Providers in {city.name}
      </h1>

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          According to the UAE Open Healthcare Directory, healthcare providers in {city.name} offer services in {languages.length}+ languages, reflecting the UAE&apos;s diverse multicultural population. Whether you need a doctor who speaks Arabic, English, Hindi, Urdu, or another language, our directory helps you find the right provider. Data sourced from official government registers, last verified March 2026.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Available Languages</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang) => {
          const count = langCountMap[lang.slug] ?? 0;
          return (
            <Link
              key={lang.slug}
              href={`/directory/${city.slug}/language/${lang.slug}`}
              className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#1c1c1c] text-sm">{lang.name}</h3>
                <span className="text-black/40 text-xs">{lang.nativeName}</span>
              </div>
              <p className="text-xs font-bold text-[#006828]">
                {count} {count === 1 ? "provider" : "providers"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
