import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug,
  getInsuranceProviders, getProviderCountByInsurance,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export const dynamicParams = true;

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();

  return {
    title: `Health Insurance Providers in ${city.name} | UAE Open Healthcare Directory`,
    description: `Browse health insurance providers accepted by healthcare facilities in ${city.name}, UAE. Find clinics and hospitals by insurance plan — Daman, Thiqa, AXA, Cigna, and more. Last verified March 2026.`,
    alternates: {
      canonical: `${base}/directory/${city.slug}/insurance`,
      languages: {
        'en-AE': `${base}/directory/${city.slug}/insurance`,
        'ar-AE': `${base}/ar/directory/${city.slug}/insurance`,
      },
    },
  };
}

export default async function InsuranceIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const insurers = getInsuranceProviders();
  const base = getBaseUrl();

  // Pre-fetch insurance counts (safe-wrapped: any single failure degrades
  // the count to 0 for that card rather than 500-ing the whole page).
  const insurerCounts = await Promise.all(
    insurers.map((ins) =>
      safe(getProviderCountByInsurance(ins.slug, city.slug), 0, `ins-count:${ins.slug}`)
    )
  );
  const insurersWithCounts = insurers.map((ins, i) => ({ ...ins, count: insurerCounts[i] }));

  const insurerItems: HubItem[] = insurersWithCounts.map((ins) => ({
    href: `/directory/${city.slug}/insurance/${ins.slug}`,
    label: ins.name,
    subLabel: ins.description,
    count: ins.count,
  }));

  const mandatoryNote =
    city.name === "Dubai"
      ? "Dubai mandates health insurance for all residents under DHA regulations."
      : city.name === "Abu Dhabi"
      ? "Abu Dhabi requires mandatory health insurance (Daman/Thiqa) for all residents and nationals under DOH regulations."
      : `Health insurance coverage in ${city.name} follows UAE federal regulations under MOHAP.`;

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance" },
      ]}
      eyebrow={`${city.name} · Insurance directory`}
      title={`Health Insurance in ${city.name}.`}
      subtitle={
        <>
          Find healthcare providers in {city.name} that accept your insurance plan. Browse Daman, Thiqa,
          AXA, Cigna, Bupa, and more — all cross-referenced against official government registers.
        </>
      }
      stats={[
        { n: String(insurers.length), l: "Insurance plans" },
        { n: city.name, l: "Emirate" },
      ]}
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, healthcare providers in {city.name} accept a
          wide range of insurance plans. {mandatoryNote} Browse by insurance provider below to find clinics
          and hospitals that accept your plan. Data sourced from official government registers, last
          verified March 2026.
        </>
      }
      arabicHref={`/ar/directory/${city.slug}/insurance`}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            { name: "Insurance" },
          ])} />
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      sections={[
        {
          title: "Insurance providers",
          eyebrow: "Browse by plan",
          items: insurerItems,
          layout: "grid",
          gridCols: "3",
        },
      ]}
    />
  );
}
