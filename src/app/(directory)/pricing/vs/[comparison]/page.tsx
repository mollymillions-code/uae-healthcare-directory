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
  params: Promise<{ comparison: string }>;
}

export async function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ comparison: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comparison } = await params;
  const base = getBaseUrl();
  const comp = getComparisonBySlug(comparison);
  if (!comp) return {};

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) return {};

  const title = `${procA.name} vs ${procB.name} Cost in the UAE — Price Comparison ${new Date().getFullYear()} | UAE Open Healthcare Directory`;
  const description = `Compare ${procA.name} (${formatAed(procA.priceRange.min)}–${formatAed(procA.priceRange.max)}) vs ${procB.name} (${formatAed(procB.priceRange.min)}–${formatAed(procB.priceRange.max)}) in the UAE. Side-by-side pricing across 8 cities, insurance coverage, recovery times, and when to choose each.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/pricing/vs/${comp.slug}` },
    openGraph: {
      title: `${procA.name} vs ${procB.name} — UAE Cost Comparison`,
      description,
      url: `${base}/pricing/vs/${comp.slug}`,
      type: "article",
    },
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { comparison } = await params;
  const base = getBaseUrl();
  const comp = getComparisonBySlug(comparison);
  if (!comp) notFound();

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) notFound();

  // Calculate UAE-wide averages
  const avgA = Math.round(
    Object.values(procA.cityPricing).reduce((s, p) => s + p.typical, 0) /
    Object.keys(procA.cityPricing).length
  );
  const avgB = Math.round(
    Object.values(procB.cityPricing).reduce((s, p) => s + p.typical, 0) /
    Object.keys(procB.cityPricing).length
  );

  const cheaperProc = avgA < avgB ? procA : procB;
  const pricierProc = avgA < avgB ? procB : procA;
  const savingsPercent = Math.round(
    (Math.abs(avgA - avgB) / Math.max(avgA, avgB)) * 100
  );

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
      default: return "text-muted bg-light-50";
    }
  };

  // City comparison data
  const cityData = CITIES.map((city) => {
    const pricingA = procA.cityPricing[city.slug];
    const pricingB = procB.cityPricing[city.slug];
    if (!pricingA || !pricingB) return null;
    const gap = pricingA.typical - pricingB.typical;
    return {
      slug: city.slug,
      name: city.name,
      typicalA: pricingA.typical,
      typicalB: pricingB.typical,
      gap,
      absGap: Math.abs(gap),
    };
  }).filter(Boolean) as {
    slug: string; name: string; typicalA: number; typicalB: number; gap: number; absGap: number;
  }[];

  const biggestGapCity = cityData.reduce((max, c) => (c.absGap > max.absGap ? c : max), cityData[0]);
  const smallestGapCity = cityData.reduce((min, c) => (c.absGap < min.absGap ? c : min), cityData[0]);

  // FAQs
  const faqs = [
    {
      question: `Which is cheaper in the UAE: ${procA.name} or ${procB.name}?`,
      answer: `${cheaperProc.name} is typically cheaper, with a UAE-wide average cost of ${formatAed(cheaperProc === procA ? avgA : avgB)} compared to ${formatAed(pricierProc === procA ? avgA : avgB)} for ${pricierProc.name}. That is a difference of approximately ${formatAed(Math.abs(avgA - avgB))} (${savingsPercent}%). However, prices vary significantly by city — ${biggestGapCity?.name || "Dubai"} has the biggest price gap between the two.`,
    },
    {
      question: `Is ${procA.name} or ${procB.name} better?`,
      answer: `Neither is universally "better" — they serve different purposes. ${comp.description} Your doctor will recommend the appropriate option based on your specific medical condition, symptoms, and health history.`,
    },
    {
      question: `Does UAE health insurance cover ${procA.name} and ${procB.name}?`,
      answer: `${procA.name} is ${insuranceLabel(procA.insuranceCoverage).toLowerCase()} by UAE insurance plans. ${procA.insuranceNotes} ${procB.name} is ${insuranceLabel(procB.insuranceCoverage).toLowerCase()}. ${procB.insuranceNotes}`,
    },
    {
      question: `What is the recovery time for ${procA.name} vs ${procB.name}?`,
      answer: `${procA.name} has a recovery time of ${procA.recoveryTime.toLowerCase()}, while ${procB.name} recovery takes ${procB.recoveryTime.toLowerCase()}. ${procA.name} takes ${procA.duration} to perform, and ${procB.name} takes ${procB.duration}.`,
    },
    {
      question: `Where is the cheapest place to get ${procA.name} or ${procB.name} in the UAE?`,
      answer: `For ${procA.name}, the most affordable city is typically in the northern emirates (Sharjah, Ajman, UAQ) where prices start from ${formatAed(procA.priceRange.min)}. For ${procB.name}, prices also start lower outside Dubai, from ${formatAed(procB.priceRange.min)}. Dubai tends to be the most expensive for both procedures. Always confirm the quote directly with the provider.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Compare Procedures", url: `${base}/pricing/vs` },
          { name: comp.title },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", ".comparison-summary"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: "Compare", href: "/pricing/vs" },
          { label: comp.title },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            {procA.name} vs {procB.name} — Cost Comparison in the UAE
          </h1>
        </div>
      </div>

      {/* Answer Block */}
      <div className="answer-block bg-light-50 border border-light-200 p-6 mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          {cheaperProc.name} is typically the more affordable option in the UAE, costing an
          average of {formatAed(cheaperProc === procA ? avgA : avgB)} compared to{" "}
          {formatAed(pricierProc === procA ? avgA : avgB)} for {pricierProc.name} — a
          difference of about {formatAed(Math.abs(avgA - avgB))} ({savingsPercent}%).{" "}
          {comp.description} Prices vary across UAE cities, with {biggestGapCity?.name || "Dubai"}{" "}
          showing the largest price gap and {smallestGapCity?.name || "Ajman"} the smallest.
          Data as of March 2026.
        </p>
      </div>

      {/* Side-by-Side Comparison Card */}
      <div className="mb-10">
        <div className="section-header">
          <h2>Side-by-Side Comparison</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="comparison-summary grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Procedure A Card */}
          <div className="border border-light-200 p-5">
            <h3 className="text-lg font-bold text-dark mb-4">{procA.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Price Range (UAE)</span>
                <span className="font-bold text-dark">{formatAed(procA.priceRange.min)} – {formatAed(procA.priceRange.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Typical Cost</span>
                <span className="font-bold text-accent">{formatAed(avgA)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Duration</span>
                <span className="text-dark">{procA.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Recovery</span>
                <span className="text-dark">{procA.recoveryTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Anaesthesia</span>
                <span className="text-dark capitalize">{procA.anaesthesia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Setting</span>
                <span className="text-dark capitalize">{procA.setting}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted">Insurance</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 ${insuranceColor(procA.insuranceCoverage)}`}>
                  {insuranceLabel(procA.insuranceCoverage)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-light-200">
              <Link href={`/pricing/${procA.slug}`} className="text-xs text-accent hover:underline flex items-center gap-1">
                View full {procA.name} pricing <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Procedure B Card */}
          <div className="border border-light-200 p-5">
            <h3 className="text-lg font-bold text-dark mb-4">{procB.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Price Range (UAE)</span>
                <span className="font-bold text-dark">{formatAed(procB.priceRange.min)} – {formatAed(procB.priceRange.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Typical Cost</span>
                <span className="font-bold text-accent">{formatAed(avgB)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Duration</span>
                <span className="text-dark">{procB.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Recovery</span>
                <span className="text-dark">{procB.recoveryTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Anaesthesia</span>
                <span className="text-dark capitalize">{procB.anaesthesia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Setting</span>
                <span className="text-dark capitalize">{procB.setting}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted">Insurance</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 ${insuranceColor(procB.insuranceCoverage)}`}>
                  {insuranceLabel(procB.insuranceCoverage)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-light-200">
              <Link href={`/pricing/${procB.slug}`} className="text-xs text-accent hover:underline flex items-center gap-1">
                View full {procB.name} pricing <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences Table */}
      <div className="mb-10">
        <div className="section-header">
          <h2>Key Differences</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="border border-light-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-light-50 border-b border-light-200">
                <th className="text-left p-3 text-muted font-medium w-1/4">Category</th>
                <th className="text-left p-3 text-dark font-bold w-[37.5%]">{procA.name}</th>
                <th className="text-left p-3 text-dark font-bold w-[37.5%]">{procB.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200">
              {comp.keyDifferences.map((diff, i) => (
                <tr key={i} className="hover:bg-light-50">
                  <td className="p-3 text-muted font-medium">{diff.category}</td>
                  <td className="p-3 text-dark">{diff.procedureA}</td>
                  <td className="p-3 text-dark">{diff.procedureB}</td>
                </tr>
              ))}
              {/* Price row */}
              <tr className="hover:bg-light-50 bg-light-50">
                <td className="p-3 text-muted font-medium">Typical UAE Cost</td>
                <td className="p-3 font-bold text-accent">{formatAed(avgA)}</td>
                <td className="p-3 font-bold text-accent">{formatAed(avgB)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* City-by-City Price Comparison */}
      <div className="mb-10">
        <div className="section-header">
          <h2>City-by-City Price Comparison</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <p className="text-xs text-muted mb-4">
          Typical prices for {procA.name} and {procB.name} across UAE cities.{" "}
          {biggestGapCity && (
            <>
              {biggestGapCity.name} has the largest price gap ({formatAed(biggestGapCity.absGap)}).{" "}
            </>
          )}
          {smallestGapCity && (
            <>
              {smallestGapCity.name} has the smallest gap ({formatAed(smallestGapCity.absGap)}).
            </>
          )}
        </p>
        <div className="border border-light-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-light-50 border-b border-light-200">
                <th className="text-left p-3 text-muted font-medium">City</th>
                <th className="text-right p-3 text-dark font-bold">{procA.name}</th>
                <th className="text-right p-3 text-dark font-bold">{procB.name}</th>
                <th className="text-right p-3 text-muted font-medium">Difference</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200">
              {cityData.map((city) => (
                <tr key={city.slug} className="hover:bg-light-50">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted" />
                      <span className="text-dark font-medium">{city.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-dark">{formatAed(city.typicalA)}</td>
                  <td className="p-3 text-right font-bold text-dark">{formatAed(city.typicalB)}</td>
                  <td className="p-3 text-right text-muted">
                    {city.gap > 0 ? "+" : ""}{formatAed(city.gap)}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/pricing/vs/${comp.slug}/${city.slug}`}
                      className="text-[11px] text-accent hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* When to Choose Each */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="section-header">
            <h2>When to Choose {procA.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="border border-light-200 p-5">
            <ul className="space-y-3">
              {comp.whenToChooseA.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="section-header">
            <h2>When to Choose {procB.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="border border-light-200 p-5">
            <ul className="space-y-3">
              {comp.whenToChooseB.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Insurance Comparison */}
      <div className="mb-10">
        <div className="section-header">
          <h2>Insurance Coverage Comparison</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-light-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-dark">{procA.name}</h3>
            </div>
            <span className={`inline-block text-[11px] font-medium px-2 py-1 mb-3 ${insuranceColor(procA.insuranceCoverage)}`}>
              {insuranceLabel(procA.insuranceCoverage)}
            </span>
            <p className="text-sm text-muted leading-relaxed">{procA.insuranceNotes}</p>
          </div>
          <div className="border border-light-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-dark">{procB.name}</h3>
            </div>
            <span className={`inline-block text-[11px] font-medium px-2 py-1 mb-3 ${insuranceColor(procB.insuranceCoverage)}`}>
              {insuranceLabel(procB.insuranceCoverage)}
            </span>
            <p className="text-sm text-muted leading-relaxed">{procB.insuranceNotes}</p>
          </div>
        </div>
      </div>

      {/* City Pages Links */}
      <div className="mb-10">
        <div className="section-header">
          <h2>Compare in Your City</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CITIES.map((city) => {
            const hasA = procA.cityPricing[city.slug];
            const hasB = procB.cityPricing[city.slug];
            if (!hasA || !hasB) return null;
            return (
              <Link
                key={city.slug}
                href={`/pricing/vs/${comp.slug}/${city.slug}`}
                className="border border-light-200 p-3 hover:border-accent transition-colors group text-center"
              >
                <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                  {city.name}
                </p>
                <p className="text-[11px] text-muted mt-1">
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
        title={`${procA.name} vs ${procB.name} — Frequently Asked Questions`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges based on the
          DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters, and
          market-observed data as of March 2026. Actual costs vary by facility, doctor,
          clinical complexity, and insurance plan. This comparison is for informational
          purposes only and does not constitute medical advice. Always consult your doctor
          to determine which procedure is appropriate for your condition. Obtain a
          personalised quote from the healthcare provider before proceeding.
        </p>
      </div>
    </div>
  );
}
