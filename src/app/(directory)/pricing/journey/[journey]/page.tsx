import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Clock,
  DollarSign,
  Shield,
  MapPin,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  CARE_JOURNEYS,
  getJourneyBySlug,
  getAllJourneySlugs,
  calculateJourneyCost,
  getJourneyCityComparison,
} from "@/lib/constants/care-journeys";
import {
  getProcedureBySlug,
  formatAed,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  return getAllJourneySlugs().map((slug) => ({ journey: slug }));
}

interface Props {
  params: Promise<{ journey: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { journey: slug } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) return {};

  const base = getBaseUrl();
  const cost = calculateJourneyCost(journey);

  return {
    title: `${journey.name} Cost in UAE — ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)} Total | UAE Open Healthcare Directory`,
    description: `How much does ${journey.name.toLowerCase()} cost in the UAE? Total estimated cost: ${formatAed(cost.requiredTypical)}. Step-by-step breakdown of ${journey.steps.length} procedures across Dubai, Abu Dhabi, Sharjah, and all emirates. ${journey.totalDuration} journey.`,
    alternates: { canonical: `${base}/pricing/journey/${slug}` },
    openGraph: {
      title: `${journey.name} Cost in UAE — ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)}`,
      description: `Total ${journey.name.toLowerCase()} cost in the UAE: ${formatAed(cost.requiredTypical)} typical. Compare across 8 cities with step-by-step breakdown.`,
      url: `${base}/pricing/journey/${slug}`,
      type: "website",
    },
  };
}

export default async function JourneyDetailPage({ params }: Props) {
  const { journey: slug } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) notFound();

  const base = getBaseUrl();
  const cost = calculateJourneyCost(journey);
  const cityComparison = getJourneyCityComparison(journey);
  const cheapestCity = cityComparison[0];
  const mostExpensiveCity = cityComparison[cityComparison.length - 1];

  // Build answer block
  const answerBlock = `${journey.name} in the UAE typically costs ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)}, with a typical total of ${formatAed(cost.requiredTypical)}. This includes ${cost.steps.filter((s) => !s.isOptional).length} required steps over ${journey.totalDuration}.${cost.optionalTypical > 0 ? ` Optional add-ons can bring the total to ${formatAed(cost.totalTypical)}.` : ""} ${cheapestCity.cityName} is the most affordable at ${formatAed(cheapestCity.requiredTypical)}, while ${mostExpensiveCity.cityName} is the most expensive at ${formatAed(mostExpensiveCity.requiredTypical)}. Prices based on DOH Mandatory Tariff methodology and market data as of March 2026.`;

  // Insurance summary per step
  const insuranceSummary = cost.steps.map((step) => {
    const proc = getProcedureBySlug(step.procedureSlug);
    return {
      name: step.procedureName,
      coverage: proc?.insuranceCoverage ?? "not-covered",
      notes: proc?.insuranceNotes ?? "",
    };
  });

  // FAQs
  const faqs = [
    {
      question: `How much does ${journey.name.toLowerCase()} cost in the UAE?`,
      answer: `${journey.name} in the UAE costs between ${formatAed(cost.requiredMin)} and ${formatAed(cost.requiredMax)} for all required steps, with a typical total of ${formatAed(cost.requiredTypical)}. This covers ${cost.steps.filter((s) => !s.isOptional).length} procedures over ${journey.totalDuration}. ${cheapestCity.cityName} offers the lowest prices, while ${mostExpensiveCity.cityName} is the most expensive.`,
    },
    {
      question: `What is included in the ${journey.name.toLowerCase()} cost?`,
      answer: `The total includes: ${cost.steps.filter((s) => !s.isOptional).map((s) => `${s.procedureName} (x${s.quantity})`).join(", ")}.${cost.steps.some((s) => s.isOptional) ? ` Optional add-ons include: ${cost.steps.filter((s) => s.isOptional).map((s) => `${s.procedureName} (x${s.quantity})`).join(", ")}.` : ""}`,
    },
    {
      question: `Is ${journey.name.toLowerCase()} covered by insurance in the UAE?`,
      answer: (() => {
        const covered = insuranceSummary.filter(
          (s) =>
            s.coverage === "typically-covered" ||
            s.coverage === "partially-covered"
        ).length;
        const total = insuranceSummary.length;
        return `${covered} out of ${total} steps in this journey are typically covered by UAE health insurance. Coverage depends on your plan tier — enhanced and premium plans offer better coverage. Co-pays of 10–20% apply for covered procedures. Cosmetic and elective steps are generally not covered.`;
      })(),
    },
    {
      question: `Where is the cheapest place for ${journey.name.toLowerCase()} in the UAE?`,
      answer: `${cheapestCity.cityName} offers the lowest typical cost at ${formatAed(cheapestCity.requiredTypical)} for required steps. ${mostExpensiveCity.cityName} is the most expensive at ${formatAed(mostExpensiveCity.requiredTypical)} — that is ${Math.round(((mostExpensiveCity.requiredTypical - cheapestCity.requiredTypical) / cheapestCity.requiredTypical) * 100)}% more. Sharjah and northern emirates generally offer the best value.`,
    },
    {
      question: `How long does ${journey.name.toLowerCase()} take?`,
      answer: `The complete ${journey.name.toLowerCase()} journey takes approximately ${journey.totalDuration}. ${journey.whatToExpect}`,
    },
  ];

  // Schema.org
  const medicalProcedureSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: journey.name,
    alternateName: journey.nameAr,
    description: journey.description,
    url: `${base}/pricing/journey/${journey.slug}`,
    howPerformed: journey.whatToExpect,
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "AED",
      minValue: cost.requiredMin,
      maxValue: cost.requiredMax,
    },
  };

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Care Journeys", url: `${base}/pricing/journey` },
          { name: journey.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={medicalProcedureSchema} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Care Journeys", href: "/pricing/journey" },
          { label: journey.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-dark mb-3">
          {journey.name} — Total Estimated Cost in the UAE
        </h1>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">{answerBlock}</p>
        </div>

        {/* Cost summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">Required Steps</p>
            <p className="text-lg font-bold text-accent">
              {formatAed(cost.requiredTypical)}
            </p>
            <p className="text-[10px] text-muted">
              {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
            </p>
          </div>
          {cost.optionalTypical > 0 && (
            <div className="bg-light-50 p-4 text-center">
              <p className="text-[11px] text-muted mb-1">+ Optional Add-ons</p>
              <p className="text-lg font-bold text-dark">
                {formatAed(cost.optionalTypical)}
              </p>
              <p className="text-[10px] text-muted">
                {formatAed(cost.optionalMin)} – {formatAed(cost.optionalMax)}
              </p>
            </div>
          )}
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">Duration</p>
            <p className="text-lg font-bold text-dark">{journey.totalDuration}</p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">Cheapest City</p>
            <p className="text-lg font-bold text-dark">{cheapestCity.cityName}</p>
            <p className="text-[10px] text-muted">
              {formatAed(cheapestCity.requiredTypical)}
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step Breakdown */}
      <div className="section-header">
        <h2>Step-by-Step Cost Breakdown</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="border border-light-200 mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-light-50 text-left">
              <th className="p-3 font-bold text-dark">Step</th>
              <th className="p-3 font-bold text-dark text-center">Qty</th>
              <th className="p-3 font-bold text-dark text-right">Unit Cost</th>
              <th className="p-3 font-bold text-dark text-right">Subtotal</th>
              <th className="p-3 font-bold text-dark text-center">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-200">
            {cost.steps.map((step, i) => (
              <tr
                key={`${step.procedureSlug}-${i}`}
                className={step.isOptional ? "bg-light-50/50" : ""}
              >
                <td className="p-3">
                  <Link
                    href={`/pricing/${step.procedureSlug}`}
                    className="text-accent hover:underline font-medium"
                  >
                    {step.procedureName}
                  </Link>
                  {step.note && (
                    <span className="text-[11px] text-muted block">
                      {step.note}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">{step.quantity}</td>
                <td className="p-3 text-right text-muted">
                  {formatAed(step.unitMin)} – {formatAed(step.unitMax)}
                </td>
                <td className="p-3 text-right font-bold text-dark">
                  {formatAed(step.subtotalMin)} – {formatAed(step.subtotalMax)}
                </td>
                <td className="p-3 text-center">
                  {step.isOptional ? (
                    <span className="text-[10px] text-muted bg-light-50 px-2 py-0.5">
                      Optional
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-light-50 font-bold">
              <td className="p-3 text-dark" colSpan={3}>
                Total (Required Steps)
              </td>
              <td className="p-3 text-right text-accent">
                {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
              </td>
              <td />
            </tr>
            {cost.optionalTypical > 0 && (
              <tr className="bg-light-50/50">
                <td className="p-3 text-muted" colSpan={3}>
                  + Optional Add-ons
                </td>
                <td className="p-3 text-right text-muted">
                  {formatAed(cost.optionalMin)} – {formatAed(cost.optionalMax)}
                </td>
                <td />
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* City Comparison */}
      <div className="section-header">
        <h2>Cost by City</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Compare the total {journey.name.toLowerCase()} cost across all UAE cities.
        Prices show required steps only (typical estimate).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {cityComparison.map((city, i) => {
          const diff =
            city.requiredTypical - cheapestCity.requiredTypical;
          const pctMore =
            cheapestCity.requiredTypical > 0
              ? Math.round((diff / cheapestCity.requiredTypical) * 100)
              : 0;

          return (
            <Link
              key={city.citySlug}
              href={`/pricing/journey/${journey.slug}/${city.citySlug}`}
              className="border border-light-200 p-4 hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                    {city.cityName}
                  </h3>
                </div>
                <ArrowRight className="w-3 h-3 text-muted group-hover:text-accent" />
              </div>
              <p className="text-lg font-bold text-dark mb-1">
                {formatAed(city.requiredTypical)}
              </p>
              <p className="text-[11px] text-muted">
                {formatAed(city.requiredMin)} – {formatAed(city.requiredMax)}
              </p>
              {i === 0 ? (
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 mt-2 inline-block">
                  Cheapest
                </span>
              ) : pctMore > 0 ? (
                <span className="text-[10px] text-muted mt-2 inline-block">
                  {pctMore}% more than {cheapestCity.cityName}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Insurance Coverage */}
      <div className="section-header">
        <h2>Insurance Coverage</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Step-by-step insurance coverage summary for {journey.name.toLowerCase()}.
        Coverage depends on your specific plan and insurer.
      </p>
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        {insuranceSummary.map((item, i) => {
          const coverageColor =
            item.coverage === "typically-covered"
              ? "text-green-700 bg-green-50"
              : item.coverage === "partially-covered"
              ? "text-yellow-700 bg-yellow-50"
              : item.coverage === "rarely-covered"
              ? "text-orange-700 bg-orange-50"
              : "text-red-700 bg-red-50";

          const coverageLabel =
            item.coverage === "typically-covered"
              ? "Covered"
              : item.coverage === "partially-covered"
              ? "Partial"
              : item.coverage === "rarely-covered"
              ? "Rare"
              : "Not covered";

          return (
            <div key={`${item.name}-${i}`} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark">{item.name}</p>
                <p className="text-[11px] text-muted line-clamp-1">
                  {item.notes.slice(0, 100)}
                  {item.notes.length > 100 ? "..." : ""}
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 flex-shrink-0 ml-4 ${coverageColor}`}
              >
                {coverageLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* What to Expect / Timeline */}
      <div className="section-header">
        <h2>What to Expect</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="bg-light-50 border border-light-200 p-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-accent" />
          <p className="text-sm font-bold text-dark">
            Timeline: {journey.totalDuration}
          </p>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          {journey.whatToExpect}
        </p>

        <div className="mt-6 space-y-3">
          {cost.steps.map((step, i) => (
            <div key={`timeline-${step.procedureSlug}-${i}`} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-accent">
                  {i + 1}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-dark">
                  {step.procedureName}
                  {step.quantity > 1 && (
                    <span className="text-muted"> x{step.quantity}</span>
                  )}
                  {step.isOptional && (
                    <span className="text-[10px] text-muted bg-light-50 px-1.5 py-0.5 ml-2">
                      optional
                    </span>
                  )}
                </p>
                {step.note && (
                  <p className="text-[11px] text-muted">{step.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse by City */}
      <div className="section-header">
        <h2>Browse by City</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.map((city) => (
          <Link
            key={city.slug}
            href={`/pricing/journey/${journey.slug}/${city.slug}`}
            className="border border-light-200 p-3 hover:border-accent transition-colors group text-center"
          >
            <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
              {city.name}
            </h3>
            <p className="text-[11px] text-muted">
              {journey.name} cost
            </p>
          </Link>
        ))}
      </div>

      {/* Related Journeys */}
      <div className="section-header">
        <h2>Other Care Journeys</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {CARE_JOURNEYS.filter((j) => j.slug !== journey.slug)
          .slice(0, 6)
          .map((j) => {
            const jCost = calculateJourneyCost(j);
            return (
              <Link
                key={j.slug}
                href={`/pricing/journey/${j.slug}`}
                className="border border-light-200 p-3 hover:border-accent transition-colors group"
              >
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors mb-1">
                  {j.name}
                </h3>
                <p className="text-xs text-muted">
                  {formatAed(jCost.requiredMin)} – {formatAed(jCost.requiredMax)}
                </p>
              </Link>
            );
          })}
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${journey.name} Cost — Frequently Asked Questions`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges
          based on the DOH Mandatory Tariff (Shafafiya) methodology and
          market-observed data as of March 2026. Actual costs vary by facility,
          doctor, clinical complexity, and insurance plan. This cost bundle is for
          planning purposes only and does not constitute medical or financial
          advice. Always obtain a personalised quote from your healthcare provider
          before proceeding.
        </p>
      </div>
    </div>
  );
}
