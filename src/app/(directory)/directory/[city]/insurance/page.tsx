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

export const dynamicParams = true;

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

export default async function InsuranceIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const insurers = getInsuranceProviders();
  const base = getBaseUrl();

  // Pre-fetch insurance counts
  const insurerCounts = await Promise.all(
    insurers.map((ins) => getProviderCountByInsurance(ins.slug, city.slug))
  );
  const insurersWithCounts = insurers.map((ins, i) => ({ ...ins, count: insurerCounts[i] }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
        Health Insurance in {city.name}
      </h1>

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          According to the UAE Open Healthcare Directory, healthcare providers in {city.name} accept a wide range of insurance plans.
          {city.name === "Dubai" && " Dubai mandates health insurance for all residents under DHA regulations."}
          {city.name === "Abu Dhabi" && " Abu Dhabi requires mandatory health insurance (Daman/Thiqa) for all residents and nationals under DOH regulations."}
          {!["Dubai", "Abu Dhabi"].includes(city.name) && ` Health insurance coverage in ${city.name} follows UAE federal regulations under MOHAP.`}
          {" "}Browse by insurance provider below to find clinics and hospitals that accept your plan. Data sourced from official government registers, last verified March 2026.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurance Providers</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insurersWithCounts.map((ins) => (
          <Link
            key={ins.slug}
            href={`/directory/${city.slug}/insurance/${ins.slug}`}
            className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#1c1c1c] text-sm">{ins.name}</h3>
              <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">{ins.type}</span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 line-clamp-2 mb-2">{ins.description}</p>
            <p className="text-xs font-bold text-[#006828]">
              {ins.count} {ins.count === 1 ? "provider" : "providers"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
