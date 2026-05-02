import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftRight, ArrowRight, CheckCircle, MapPin, Shield } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getComparisonBySlug,
  getAllComparisonSlugs,
} from "@/lib/constants/procedure-comparisons";
import { getProcedureBySlug, formatAed } from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface PageProps {
  params: Promise<{ comparison: string; city: string }>;
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const slugs = getAllComparisonSlugs();
  const cityParams: { comparison: string; city: string }[] = [];

  for (const slug of slugs) {
    const comp = getComparisonBySlug(slug);
    if (!comp) continue;
    const procA = getProcedureBySlug(comp.procedureASlug);
    const procB = getProcedureBySlug(comp.procedureBSlug);
    if (!procA || !procB) continue;

    for (const city of CITIES) {
      if (procA.cityPricing[city.slug] && procB.cityPricing[city.slug]) {
        cityParams.push({ comparison: slug, city: city.slug });
      }
    }
  }

  return cityParams;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comparison, city: citySlug } = await params;
  const base = getBaseUrl();
  const comp = getComparisonBySlug(comparison);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!comp || !city) return {};

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) return {};

  const pricingA = procA.cityPricing[citySlug];
  const pricingB = procB.cityPricing[citySlug];
  if (!pricingA || !pricingB) return {};

  const title = `${procA.name} vs ${procB.name} Cost in ${city.name} — ${new Date().getFullYear()} Price Comparison | UAE Open Healthcare Directory`;
  const description = `Compare ${procA.name} (${formatAed(pricingA.typical)} typical) vs ${procB.name} (${formatAed(pricingB.typical)} typical) in ${city.name}. City-specific pricing, insurance coverage, and guidance on when to choose each procedure.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/pricing/vs/${comp.slug}/${citySlug}` },
    openGraph: {
      title: `${procA.name} vs ${procB.name} in ${city.name} — Price Comparison`,
      description,
      url: `${base}/pricing/vs/${comp.slug}/${citySlug}`,
      type: "article",
    },
  };
}

export default async function CityComparisonPage({ params }: PageProps) {
  const { comparison, city: citySlug } = await params;
  const base = getBaseUrl();

  const comp = getComparisonBySlug(comparison);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!comp || !city) notFound();

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) notFound();

  const pricingA = procA.cityPricing[citySlug];
  const pricingB = procB.cityPricing[citySlug];
  if (!pricingA || !pricingB) notFound();

  const cheaperProc = pricingA.typical < pricingB.typical ? procA : procB;
  const pricierPricing = pricingA.typical < pricingB.typical ? pricingB : pricingA;
  const priceDiff = Math.abs(pricingA.typical - pricingB.typical);
  const savingsPercent = Math.round((priceDiff / pricierPricing.typical) * 100);

  // Insurance labels
  const insuranceLabel = (coverage: string) => {
    switch (coverage) {
      case "typically-covered": return "Typically Covered";
      case "partially-covered": return "Partially Covered";
      case "rarely-covered": return "Rarely Covered";
      case "not-covered": return "Not Covered";
      default: return coverage;
    }
  };

  const insuranceColor = (coverage: string) => {
    switch (coverage) {
      case "typically-covered": return "text-green-700 bg-green-50";
      case "partially-covered": return "text-yellow-700 bg-yellow-50";
      case "rarely-covered": return "text-orange-700 bg-orange-50";
      case "not-covered": return "text-red-700 bg-red-50";
      default: return "text-black/40 bg-[#f8f8f6]";
    }
  };

  // Compare this city vs others
  const otherCities = CITIES.filter((c) => c.slug !== citySlug).map((c) => {
    const prA = procA.cityPricing[c.slug];
    const prB = procB.cityPricing[c.slug];
    if (!prA || !prB) return null;
    return {
      slug: c.slug,
      name: c.name,
      typicalA: prA.typical,
      typicalB: prB.typical,
    };
  }).filter(Boolean) as { slug: string; name: string; typicalA: number; typicalB: number }[];

  // Regulator
  const regulator =
    citySlug === "dubai"
      ? "Dubai Health Authority (DHA)"
      : citySlug === "abu-dhabi" || citySlug === "al-ain"
      ? "Department of Health Abu Dhabi (DOH)"
      : "Ministry of Health and Prevention (MOHAP)";

  // FAQs
  const faqs = [
    {
      question: `How much does a ${procA.name.toLowerCase()} cost in ${city.name} compared to a ${procB.name.toLowerCase()}?`,
      answer: `In ${city.name}, a ${procA.name.toLowerCase()} typically costs ${formatAed(pricingA.typical)} (range: ${formatAed(pricingA.min)}–${formatAed(pricingA.max)}), while a ${procB.name.toLowerCase()} costs ${formatAed(pricingB.typical)} (range: ${formatAed(pricingB.min)}–${formatAed(pricingB.max)}). ${cheaperProc.name} is ${formatAed(priceDiff)} cheaper (${savingsPercent}% less). Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
    {
      question: `Should I get a ${procA.name.toLowerCase()} or ${procB.name.toLowerCase()} in ${city.name}?`,
      answer: `The choice between ${procA.name.toLowerCase()} and ${procB.name.toLowerCase()} depends on your medical condition, not price alone. ${comp.description} Consult a qualified healthcare provider in ${city.name} to determine which is appropriate for your situation.`,
    },
    {
      question: `Does insurance cover ${procA.name.toLowerCase()} and ${procB.name.toLowerCase()} in ${city.name}?`,
      answer: `${procA.name} is ${insuranceLabel(procA.insuranceCoverage).toLowerCase()} by UAE insurance plans. ${procB.name} is ${insuranceLabel(procB.insuranceCoverage).toLowerCase()}. Coverage details depend on your specific plan tier and insurer. Pre-authorisation may be required.`,
    },
    {
      question: `Is ${city.name} cheaper than other UAE cities for ${procA.name.toLowerCase()} and ${procB.name.toLowerCase()}?`,
      answer: `In ${city.name}, ${procA.name.toLowerCase()} costs ${formatAed(pricingA.typical)} and ${procB.name.toLowerCase()} costs ${formatAed(pricingB.typical)}. ${citySlug === "dubai" ? "Dubai tends to be the most expensive emirate for medical procedures." : citySlug === "abu-dhabi" ? "Abu Dhabi prices are governed by the DOH Mandatory Tariff." : "Northern emirates generally offer lower prices than Dubai and Abu Dhabi."} Compare prices across all cities on the UAE-wide comparison page.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Compare Procedures", url: `${base}/pricing/vs` },
          { name: comp.title, url: `${base}/pricing/vs/${comp.slug}` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", ".comparison-summary"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: "Compare", href: "/pricing/vs" },
          { label: comp.title, href: `/pricing/vs/${comp.slug}` },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {procA.name} vs {procB.name} Cost in {city.name}
          </h1>
        </div>
      </div>

      {/* Answer Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          In {city.name}, a {procA.name.toLowerCase()} typically costs{" "}
          {formatAed(pricingA.typical)} while a {procB.name.toLowerCase()} costs{" "}
          {formatAed(pricingB.typical)} — making {cheaperProc.name.toLowerCase()}{" "}
          {formatAed(priceDiff)} cheaper ({savingsPercent}% less).{" "}
          {procA.name} ranges from {formatAed(pricingA.min)} to {formatAed(pricingA.max)},{" "}
          and {procB.name} from {formatAed(pricingB.min)} to {formatAed(pricingB.max)}.{" "}
          {comp.description.split(". ").slice(0, 1).join(". ")}.{" "}
          Healthcare in {city.name} is regulated by the {regulator}. Data as of March 2026.
        </p>
      </div>

      {/* Side-by-Side City-Specific Comparison */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Side-by-Side Comparison in {city.name}</h2>
        </div>
        <div className="comparison-summary grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Procedure A Card */}
          <div className="border border-black/[0.06] p-5">
            <h3 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">{procA.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Price Range ({city.name})</span>
                <span className="font-bold text-[#1c1c1c]">{formatAed(pricingA.min)} – {formatAed(pricingA.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Typical Cost</span>
                <span className="font-bold text-[#006828]">{formatAed(pricingA.typical)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Duration</span>
                <span className="text-[#1c1c1c]">{procA.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Recovery</span>
                <span className="text-[#1c1c1c]">{procA.recoveryTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Anaesthesia</span>
                <span className="text-[#1c1c1c] capitalize">{procA.anaesthesia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Setting</span>
                <span className="text-[#1c1c1c] capitalize">{procA.setting}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-black/40">Insurance</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 ${insuranceColor(procA.insuranceCoverage)}`}>
                  {insuranceLabel(procA.insuranceCoverage)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.06]">
              <Link href={`/pricing/${procA.slug}/${citySlug}`} className="text-xs text-[#006828] hover:underline flex items-center gap-1">
                {procA.name} pricing in {city.name} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Procedure B Card */}
          <div className="border border-black/[0.06] p-5">
            <h3 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">{procB.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Price Range ({city.name})</span>
                <span className="font-bold text-[#1c1c1c]">{formatAed(pricingB.min)} – {formatAed(pricingB.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Typical Cost</span>
                <span className="font-bold text-[#006828]">{formatAed(pricingB.typical)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Duration</span>
                <span className="text-[#1c1c1c]">{procB.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Recovery</span>
                <span className="text-[#1c1c1c]">{procB.recoveryTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Anaesthesia</span>
                <span className="text-[#1c1c1c] capitalize">{procB.anaesthesia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Setting</span>
                <span className="text-[#1c1c1c] capitalize">{procB.setting}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-black/40">Insurance</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 ${insuranceColor(procB.insuranceCoverage)}`}>
                  {insuranceLabel(procB.insuranceCoverage)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.06]">
              <Link href={`/pricing/${procB.slug}/${citySlug}`} className="text-xs text-[#006828] hover:underline flex items-center gap-1">
                {procB.name} pricing in {city.name} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences (condensed for city page) */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Key Differences</h2>
        </div>
        <div className="border border-black/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left p-3 text-black/40 font-medium w-1/4">Category</th>
                <th className="text-left p-3 text-[#1c1c1c] font-bold w-[37.5%]">{procA.name}</th>
                <th className="text-left p-3 text-[#1c1c1c] font-bold w-[37.5%]">{procB.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200">
              <tr className="bg-[#f8f8f6]">
                <td className="p-3 text-black/40 font-medium">Cost in {city.name}</td>
                <td className="p-3 font-bold text-[#006828]">{formatAed(pricingA.typical)}</td>
                <td className="p-3 font-bold text-[#006828]">{formatAed(pricingB.typical)}</td>
              </tr>
              {comp.keyDifferences.slice(0, 5).map((diff, i) => (
                <tr key={i} className="hover:bg-[#f8f8f6]">
                  <td className="p-3 text-black/40 font-medium">{diff.category}</td>
                  <td className="p-3 text-[#1c1c1c]">{diff.procedureA}</td>
                  <td className="p-3 text-[#1c1c1c]">{diff.procedureB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare This City vs Others */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare {city.name} vs Other Cities</h2>
        </div>
        <div className="border border-black/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left p-3 text-black/40 font-medium">City</th>
                <th className="text-right p-3 text-[#1c1c1c] font-bold">{procA.name}</th>
                <th className="text-right p-3 text-[#1c1c1c] font-bold">{procB.name}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200">
              {/* Current city highlighted */}
              <tr className="bg-[#f8f8f6]">
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#006828]" />
                    <span className="text-[#1c1c1c] font-bold">{city.name} (this city)</span>
                  </div>
                </td>
                <td className="p-3 text-right font-bold text-[#006828]">{formatAed(pricingA.typical)}</td>
                <td className="p-3 text-right font-bold text-[#006828]">{formatAed(pricingB.typical)}</td>
                <td className="p-3"></td>
              </tr>
              {otherCities.map((other) => (
                <tr key={other.slug} className="hover:bg-[#f8f8f6]">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-black/40" />
                      <span className="text-[#1c1c1c]">{other.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-[#1c1c1c]">{formatAed(other.typicalA)}</td>
                  <td className="p-3 text-right text-[#1c1c1c]">{formatAed(other.typicalB)}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/pricing/vs/${comp.slug}/${other.slug}`}
                      className="text-[11px] text-[#006828] hover:underline"
                    >
                      Compare
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* When to Choose Each (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">When to Choose {procA.name}</h2>
          </div>
          <div className="border border-black/[0.06] p-5">
            <ul className="space-y-2">
              {comp.whenToChooseA.slice(0, 4).map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                  <span className="font-['Geist',sans-serif] text-sm text-black/40">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">When to Choose {procB.name}</h2>
          </div>
          <div className="border border-black/[0.06] p-5">
            <ul className="space-y-2">
              {comp.whenToChooseB.slice(0, 4).map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                  <span className="font-['Geist',sans-serif] text-sm text-black/40">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Insurance Comparison */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurance Coverage in {city.name}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{procA.name}</h3>
            </div>
            <span className={`inline-block text-[11px] font-medium px-2 py-1 mb-3 ${insuranceColor(procA.insuranceCoverage)}`}>
              {insuranceLabel(procA.insuranceCoverage)}
            </span>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">{procA.insuranceNotes}</p>
          </div>
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{procB.name}</h3>
            </div>
            <span className={`inline-block text-[11px] font-medium px-2 py-1 mb-3 ${insuranceColor(procB.insuranceCoverage)}`}>
              {insuranceLabel(procB.insuranceCoverage)}
            </span>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">{procB.insuranceNotes}</p>
          </div>
        </div>
      </div>

      {/* Links to UAE-wide and other city comparisons */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare in Other Cities</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href={`/pricing/vs/${comp.slug}`}
            className="border border-[#006828] p-3 hover:bg-[#f8f8f6] transition-colors group text-center"
          >
            <p className="text-sm font-bold text-[#006828]">
              All UAE
            </p>
            <p className="text-[11px] text-black/40 mt-1">UAE-wide comparison</p>
          </Link>
          {CITIES.filter((c) => c.slug !== citySlug).map((c) => {
            const hasA = procA.cityPricing[c.slug];
            const hasB = procB.cityPricing[c.slug];
            if (!hasA || !hasB) return null;
            return (
              <Link
                key={c.slug}
                href={`/pricing/vs/${comp.slug}/${c.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-[11px] text-black/40 mt-1">
                  {formatAed(hasA.typical)} vs {formatAed(hasB.typical)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${procA.name} vs ${procB.name} in ${city.name} — FAQ`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges for {city.name}{" "}
          based on the DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters,
          and market-observed data as of March 2026. Actual costs vary by facility, doctor,
          clinical complexity, and insurance plan. This comparison is for informational
          purposes only and does not constitute medical advice. Always consult a qualified
          healthcare provider in {city.name} to determine which procedure is appropriate.
          Obtain a personalised quote before proceeding.
        </p>
      </div>
    </div>
  );
}
