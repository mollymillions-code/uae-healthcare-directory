import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCityBySlug, getCities, getConditions } from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
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
    title: `Common Health Conditions & Treatments in ${city.name} | UAE Open Healthcare Directory`,
    description: `Find specialists and treatment options for common health conditions in ${city.name}, UAE. Browse verified providers for back pain, dental implants, LASIK, IVF, and more. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/condition` },
  };
}

export default function ConditionIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const conditions = getConditions();
  const base = getBaseUrl();

  const conditionItems: HubItem[] = conditions.map((cond) => ({
    href: `/directory/${city.slug}/condition/${cond.slug}`,
    label: cond.name,
    subLabel: cond.description,
  }));

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Conditions" },
      ]}
      eyebrow={`${city.name} · Conditions & treatments`}
      title={`Common Health Conditions in ${city.name}.`}
      subtitle={
        <>
          Find specialists and treatment pathways for the most-searched conditions in {city.name}, UAE.
          Every provider is cross-referenced against official DHA, DOH, or MOHAP registers.
        </>
      }
      stats={[
        { n: `${conditions.length}+`, l: "Conditions" },
        { n: city.name, l: "Emirate" },
      ]}
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, {city.name} has verified healthcare providers
          offering treatment for {conditions.length}+ common health conditions. From dental implants and
          LASIK surgery to fertility treatments and mental health care, find the right specialist for your
          needs. All providers are sourced from official government registers, last verified March 2026.
        </>
      }
      schemas={
        <>
          <JsonLd data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            { name: "Conditions" },
          ])} />
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      sections={[
        {
          title: "Health conditions",
          eyebrow: "Browse by condition",
          items: conditionItems,
          layout: "grid",
          gridCols: "3",
        },
      ]}
    />
  );
}
