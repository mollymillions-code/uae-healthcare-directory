import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCityBySlug, getCities, getConditions } from "@/lib/data";
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

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Conditions" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Conditions" },
      ]} />

      <h1 className="text-3xl font-bold text-dark mb-2">
        Common Health Conditions & Treatments in {city.name}
      </h1>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          According to the UAE Open Healthcare Directory, {city.name} has verified healthcare providers offering treatment for {conditions.length}+ common health conditions. From dental implants and LASIK surgery to fertility treatments and mental health care, find the right specialist for your needs. All providers are sourced from official government registers, last verified March 2026.
        </p>
      </div>

      <div className="section-header">
        <h2>Health Conditions</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {conditions.map((cond) => (
          <Link
            key={cond.slug}
            href={`/directory/${city.slug}/condition/${cond.slug}`}
            className="block border border-light-200 p-4 hover:border-accent transition-colors"
          >
            <h3 className="font-bold text-dark text-sm mb-1">{cond.name}</h3>
            <p className="text-xs text-muted line-clamp-2">{cond.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
