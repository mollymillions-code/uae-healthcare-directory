import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getInsuranceProviders, getProviderCountByInsurance,
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
    title: `Health Insurance Providers in ${city.name} | UAE Open Healthcare Directory`,
    description: `Browse health insurance providers accepted by healthcare facilities in ${city.name}, UAE. Find clinics and hospitals by insurance plan — Daman, Thiqa, AXA, Cigna, and more. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/insurance` },
  };
}

export default function InsuranceIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const insurers = getInsuranceProviders();
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Insurance" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance" },
      ]} />

      <h1 className="text-3xl font-bold text-dark mb-2">
        Health Insurance in {city.name}
      </h1>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          According to the UAE Open Healthcare Directory, healthcare providers in {city.name} accept a wide range of insurance plans.
          {city.name === "Dubai" && " Dubai mandates health insurance for all residents under DHA regulations."}
          {city.name === "Abu Dhabi" && " Abu Dhabi requires mandatory health insurance (Daman/Thiqa) for all residents and nationals under DOH regulations."}
          {!["Dubai", "Abu Dhabi"].includes(city.name) && ` Health insurance coverage in ${city.name} follows UAE federal regulations under MOHAP.`}
          {" "}Browse by insurance provider below to find clinics and hospitals that accept your plan. Data sourced from official government registers, last verified March 2026.
        </p>
      </div>

      <div className="section-header">
        <h2>Insurance Providers</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insurers.map((ins) => {
          const count = getProviderCountByInsurance(ins.slug, city.slug);
          return (
            <Link
              key={ins.slug}
              href={`/directory/${city.slug}/insurance/${ins.slug}`}
              className="block border border-light-200 p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-dark text-sm">{ins.name}</h3>
                <span className="badge text-[9px]">{ins.type}</span>
              </div>
              <p className="text-xs text-muted line-clamp-2 mb-2">{ins.description}</p>
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
