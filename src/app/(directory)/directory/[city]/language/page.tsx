import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getLanguagesList, getProviderCountByLanguage,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getCities().map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();

  return {
    title: `Languages Spoken by Healthcare Providers in ${city.name} | UAE Open Healthcare Directory`,
    description: `Find healthcare providers in ${city.name} by language spoken. Browse doctors and clinics with staff speaking Arabic, English, Hindi, Urdu, and 15+ other languages. Last verified March 2026.`,
    alternates: {
      canonical: `${base}/directory/${city.slug}/language`,
      languages: {
        'en-AE': `${base}/directory/${city.slug}/language`,
        'ar-AE': `${base}/ar/directory/${city.slug}/language`,
      },
    },
  };
}

export default async function LanguageIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const languages = getLanguagesList();
  const base = getBaseUrl();

  // Pre-fetch all language counts (safe-wrapped individually so a single
  // stuck query doesn't 500 the whole hub).
  const langCounts = await Promise.all(
    languages.map((lang) =>
      safe(getProviderCountByLanguage(lang.slug, city.slug), 0, `lang-count:${lang.slug}`)
    )
  );

  const languageItems: HubItem[] = languages.map((lang, i) => ({
    href: `/directory/${city.slug}/language/${lang.slug}`,
    label: lang.name,
    subLabel: lang.nativeName,
    count: langCounts[i] ?? 0,
  }));

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Languages" },
      ]}
      eyebrow={`${city.name} · Language directory`}
      title={`Languages Spoken by Healthcare Providers in ${city.name}.`}
      subtitle={
        <>
          Find doctors and clinics in {city.name} whose staff speak your language. Arabic, English, Hindi, Urdu,
          Tagalog, and more — all listings cross-referenced against official government registers.
        </>
      }
      stats={[
        { n: `${languages.length}+`, l: "Languages" },
        { n: city.name, l: "Emirate" },
      ]}
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, healthcare providers in {city.name} offer services
          in {languages.length}+ languages, reflecting the UAE&apos;s diverse multicultural population.
          Whether you need a doctor who speaks Arabic, English, Hindi, Urdu, or another language, our
          directory helps you find the right provider. Data sourced from official government registers,
          last verified March 2026.
        </>
      }
      arabicHref={`/ar/directory/${city.slug}/language`}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            { name: "Languages" },
          ])} />
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      sections={[
        {
          title: "Available languages",
          eyebrow: "Browse by language",
          items: languageItems,
          layout: "grid",
          gridCols: "3",
        },
      ]}
    />
  );
}
