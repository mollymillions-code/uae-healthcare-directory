import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
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
  const journeys = getAllJourneySlugs();
  const citySlugs = CITIES.map((c) => c.slug);
  return journeys.flatMap((journey) =>
    citySlugs.map((city) => ({ journey, city }))
  );
}

interface Props {
  params: Promise<{ journey: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { journey: journeySlug, city: citySlug } = await params;
  const journey = getJourneyBySlug(journeySlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!journey || !city) return {};

  const base = getBaseUrl();
  const cost = calculateJourneyCost(journey, citySlug);

  return {
    title: `${journey.name} Cost in ${city.name} — ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)} | UAE Open Healthcare Directory`,
    description: `How much does ${journey.name.toLowerCase()} cost in ${city.name}? Total estimated cost: ${formatAed(cost.requiredTypical)}. Step-by-step breakdown with ${city.name}-specific prices for ${journey.steps.length} procedures. Compare with other UAE cities.`,
    alternates: {
      canonical: `${base}/pricing/journey/${journeySlug}/${citySlug}`,
    },
    openGraph: {
      title: `${journey.name} Cost in ${city.name} — ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)}`,
      description: `Total ${journey.name.toLowerCase()} cost in ${city.name}: ${formatAed(cost.requiredTypical)} typical. Compare with 7 other UAE cities.`,
      url: `${base}/pricing/journey/${journeySlug}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function JourneyCityPage({ params }: Props) {
  const { journey: journeySlug, city: citySlug } = await params;
  const journey = getJourneyBySlug(journeySlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!journey || !city) notFound();

  const base = getBaseUrl();
  const cost = calculateJourneyCost(journey, citySlug);
  const uaeCost = calculateJourneyCost(journey);
  const cityComparison = getJourneyCityComparison(journey);
  const cheapestCity = cityComparison[0];
  const mostExpensiveCity = cityComparison[cityComparison.length - 1];
  const thisRank = cityComparison.findIndex((c) => c.citySlug === citySlug) + 1;

  // Percentage vs UAE average
  const vsUaeAvg =
    uaeCost.requiredTypical > 0
      ? Math.round(
          ((cost.requiredTypical - uaeCost.requiredTypical) /
            uaeCost.requiredTypical) *
            100
        )
      : 0;

  // Percentage vs cheapest
  const vsCheapest =
    cheapestCity.requiredTypical > 0
      ? Math.round(
          ((cost.requiredTypical - cheapestCity.requiredTypical) /
            cheapestCity.requiredTypical) *
            100
        )
      : 0;

  const regulator =
    citySlug === "dubai"
      ? "Dubai Health Authority (DHA)"
      : citySlug === "abu-dhabi" || citySlug === "al-ain"
      ? "Department of Health Abu Dhabi (DOH)"
      : "Ministry of Health and Prevention (MOHAP)";

  // Answer block
  const answerBlock = `${journey.name} in ${city.name} costs an estimated ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)}, with a typical total of ${formatAed(cost.requiredTypical)}.${cost.optionalTypical > 0 ? ` With optional add-ons, the total can reach ${formatAed(cost.totalTypical)}.` : ""} ${city.name} ranks #${thisRank} out of 8 UAE cities for this journey. ${vsUaeAvg > 0 ? `Prices are ${vsUaeAvg}% above the UAE average.` : vsUaeAvg < 0 ? `Prices are ${Math.abs(vsUaeAvg)}% below the UAE average.` : "Prices are at the UAE average."} Healthcare in ${city.name} is regulated by the ${regulator}. Data as of March 2026.`;

  // FAQs
  const faqs = [
    {
      question: `How much does ${journey.name.toLowerCase()} cost in ${city.name}?`,
      answer: `${journey.name} in ${city.name} costs ${formatAed(cost.requiredMin)} to ${formatAed(cost.requiredMax)} for required steps, with a typical total of ${formatAed(cost.requiredTypical)}. This includes ${cost.steps.filter((s) => !s.isOptional).length} procedures over ${journey.totalDuration}. Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
    {
      question: `Is ${city.name} expensive for ${journey.name.toLowerCase()} compared to other UAE cities?`,
      answer: `${city.name} ranks #${thisRank} out of 8 UAE cities for ${journey.name.toLowerCase()} cost. ${vsCheapest > 0 ? `It is ${vsCheapest}% more expensive than ${cheapestCity.cityName} (${formatAed(cheapestCity.requiredTypical)}), which is the cheapest option.` : `It is the most affordable option in the UAE for this journey.`} ${mostExpensiveCity.cityName} is the most expensive at ${formatAed(mostExpensiveCity.requiredTypical)}.`,
    },
    {
      question: `Where can I find providers for ${journey.name.toLowerCase()} in ${city.name}?`,
      answer: `Browse the UAE Open Healthcare Directory for ${city.name} providers. Each step in this journey links to the relevant procedure page where you can find specific providers. Compare by rating, insurance acceptance, and location to find the best option for your needs.`,
    },
    {
      question: `Does insurance cover ${journey.name.toLowerCase()} in ${city.name}?`,
      answer: (() => {
        const coveredSteps = cost.steps.filter((s) => {
          const proc = getProcedureBySlug(s.procedureSlug);
          return (
            proc?.insuranceCoverage === "typically-covered" ||
            proc?.insuranceCoverage === "partially-covered"
          );
        });
        return `${coveredSteps.length} out of ${cost.steps.length} steps are typically covered by UAE health insurance when medically indicated. Coverage depends on your plan tier. Co-pays of 10–20% apply. Cosmetic and elective procedures are generally not covered. Health insurance is mandatory across all UAE emirates since January 2025.`;
      })(),
    },
  ];

  // Schema.org
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${journey.name} in ${city.name}`,
    description: `${journey.name} treatment in ${city.name}, UAE. Total estimated cost: AED ${cost.requiredTypical.toLocaleString()}.`,
    url: `${base}/pricing/journey/${journey.slug}/${citySlug}`,
    provider: {
      "@type": "MedicalOrganization",
      name: "UAE Healthcare Providers",
      areaServed: {
        "@type": "City",
        name: city.name,
        containedInPlace: {
          "@type": "Country",
          name: "United Arab Emirates",
        },
      },
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AED",
      lowPrice: cost.requiredMin,
      highPrice: cost.requiredMax,
      offerCount: cost.steps.length,
    },
    areaServed: {
      "@type": "City",
      name: city.name,
    },
  };

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Care Journeys", url: `${base}/pricing/journey` },
          {
            name: journey.name,
            url: `${base}/pricing/journey/${journey.slug}`,
          },
          { name: city.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={serviceSchema} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Care Journeys", href: "/pricing/journey" },
          {
            label: journey.name,
            href: `/pricing/journey/${journey.slug}`,
          },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-dark mb-3">
          {journey.name} Cost in {city.name}
        </h1>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">{answerBlock}</p>
        </div>

        {/* Cost summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">
              Typical Total ({city.name})
            </p>
            <p className="text-lg font-bold text-accent">
              {formatAed(cost.requiredTypical)}
            </p>
            <p className="text-[10px] text-muted">
              {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
            </p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">vs. UAE Average</p>
            <p
              className={`text-lg font-bold ${
                vsUaeAvg > 0
                  ? "text-red-600"
                  : vsUaeAvg < 0
                  ? "text-green-600"
                  : "text-dark"
              }`}
            >
              {vsUaeAvg > 0 ? "+" : ""}
              {vsUaeAvg}%
            </p>
            <p className="text-[10px] text-muted">
              UAE avg: {formatAed(uaeCost.requiredTypical)}
            </p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">City Rank</p>
            <p className="text-lg font-bold text-dark">
              #{thisRank} of 8
            </p>
            <p className="text-[10px] text-muted">
              {thisRank <= 3 ? "Affordable" : thisRank <= 6 ? "Mid-range" : "Premium"}
            </p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-[11px] text-muted mb-1">Duration</p>
            <p className="text-lg font-bold text-dark">
              {journey.totalDuration}
            </p>
            <p className="text-[10px] text-muted">
              {cost.steps.filter((s) => !s.isOptional).length} steps
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step Breakdown (city-specific prices) */}
      <div className="section-header">
        <h2>Step-by-Step Cost in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="border border-light-200 mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-light-50 text-left">
              <th className="p-3 font-bold text-dark">Procedure</th>
              <th className="p-3 font-bold text-dark text-center">Qty</th>
              <th className="p-3 font-bold text-dark text-right">
                Unit Cost ({city.name})
              </th>
              <th className="p-3 font-bold text-dark text-right">Subtotal</th>
              <th className="p-3 font-bold text-dark text-center">Type</th>
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
                    href={`/pricing/${step.procedureSlug}/${citySlug}`}
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

      {/* Compare with Other Cities */}
      <div className="section-header">
        <h2>Compare with Other Cities</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        How does {city.name} compare to other UAE cities for{" "}
        {journey.name.toLowerCase()} cost? Showing typical cost for required
        steps.
      </p>
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        {cityComparison.map((comp) => {
          const isThis = comp.citySlug === citySlug;
          const diff = comp.requiredTypical - cost.requiredTypical;
          const pctDiff =
            cost.requiredTypical > 0
              ? Math.round((diff / cost.requiredTypical) * 100)
              : 0;

          return (
            <Link
              key={comp.citySlug}
              href={`/pricing/journey/${journey.slug}/${comp.citySlug}`}
              className={`flex items-center justify-between p-3 hover:bg-light-50 transition-colors group ${
                isThis ? "bg-accent/5 border-l-2 border-l-accent" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    isThis ? "text-accent" : "text-muted"
                  }`}
                />
                <div>
                  <span
                    className={`text-sm font-bold ${
                      isThis
                        ? "text-accent"
                        : "text-dark group-hover:text-accent"
                    } transition-colors`}
                  >
                    {comp.cityName}
                    {isThis && " (current)"}
                  </span>
                  <span className="text-[11px] text-muted block">
                    {formatAed(comp.requiredMin)} –{" "}
                    {formatAed(comp.requiredMax)}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-dark">
                    {formatAed(comp.requiredTypical)}
                  </p>
                  {!isThis && pctDiff !== 0 && (
                    <p
                      className={`text-[11px] flex items-center justify-end gap-0.5 ${
                        pctDiff > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {pctDiff > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {pctDiff > 0 ? "+" : ""}
                      {pctDiff}% vs {city.name}
                    </p>
                  )}
                </div>
                {!isThis && (
                  <ArrowRight className="w-3 h-3 text-muted group-hover:text-accent" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Find Providers */}
      <div className="section-header">
        <h2>Find Providers in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Links to individual procedure pricing pages in {city.name} for each step
        of this journey.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {cost.steps.map((step, i) => (
          <Link
            key={`provider-${step.procedureSlug}-${i}`}
            href={`/pricing/${step.procedureSlug}/${citySlug}`}
            className="border border-light-200 p-3 hover:border-accent transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {step.procedureName}
                {step.quantity > 1 && (
                  <span className="text-muted"> x{step.quantity}</span>
                )}
              </p>
              <p className="text-[11px] text-muted">
                {formatAed(step.unitTypical)} typical in {city.name}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Other Cities for This Journey */}
      <div className="section-header">
        <h2>{journey.name} in Other Cities</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.filter((c) => c.slug !== citySlug).map((c) => {
          const cCost = calculateJourneyCost(journey, c.slug);
          return (
            <Link
              key={c.slug}
              href={`/pricing/journey/${journey.slug}/${c.slug}`}
              className="border border-light-200 p-3 hover:border-accent transition-colors group text-center"
            >
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {c.name}
              </h3>
              <p className="text-xs text-muted">
                {formatAed(cCost.requiredTypical)} typical
              </p>
            </Link>
          );
        })}
      </div>

      {/* Other Journeys in This City */}
      <div className="section-header">
        <h2>Other Journeys in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {CARE_JOURNEYS.filter((j) => j.slug !== journey.slug)
          .slice(0, 6)
          .map((j) => {
            const jCost = calculateJourneyCost(j, citySlug);
            return (
              <Link
                key={j.slug}
                href={`/pricing/journey/${j.slug}/${citySlug}`}
                className="border border-light-200 p-3 hover:border-accent transition-colors group"
              >
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors mb-1">
                  {j.name}
                </h3>
                <p className="text-xs text-muted">
                  {formatAed(jCost.requiredMin)} –{" "}
                  {formatAed(jCost.requiredMax)} in {city.name}
                </p>
              </Link>
            );
          })}
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${journey.name} Cost in ${city.name} — FAQ`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges for{" "}
          {city.name} based on the DOH Mandatory Tariff (Shafafiya) methodology
          and market-observed data as of March 2026. Actual costs vary by facility,
          doctor, clinical complexity, and insurance plan. This cost bundle is for
          planning purposes only and does not constitute medical or financial
          advice. Always obtain a personalised quote from your healthcare provider
          before proceeding. Healthcare in {city.name} is regulated by the{" "}
          {regulator}.
        </p>
      </div>
    </div>
  );
}
