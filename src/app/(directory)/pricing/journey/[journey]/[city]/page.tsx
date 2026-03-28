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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          {journey.name} Cost in {city.name}
        </h1>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{answerBlock}</p>
        </div>

        {/* Cost summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">
              Typical Total ({city.name})
            </p>
            <p className="text-lg font-bold text-[#006828]">
              {formatAed(cost.requiredTypical)}
            </p>
            <p className="text-[10px] text-black/40">
              {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">vs. UAE Average</p>
            <p
              className={`text-lg font-bold ${
                vsUaeAvg > 0
                  ? "text-red-600"
                  : vsUaeAvg < 0
                  ? "text-green-600"
                  : "text-[#1c1c1c]"
              }`}
            >
              {vsUaeAvg > 0 ? "+" : ""}
              {vsUaeAvg}%
            </p>
            <p className="text-[10px] text-black/40">
              UAE avg: {formatAed(uaeCost.requiredTypical)}
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">City Rank</p>
            <p className="text-lg font-bold text-[#1c1c1c]">
              #{thisRank} of 8
            </p>
            <p className="text-[10px] text-black/40">
              {thisRank <= 3 ? "Affordable" : thisRank <= 6 ? "Mid-range" : "Premium"}
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">Duration</p>
            <p className="text-lg font-bold text-[#1c1c1c]">
              {journey.totalDuration}
            </p>
            <p className="text-[10px] text-black/40">
              {cost.steps.filter((s) => !s.isOptional).length} steps
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step Breakdown (city-specific prices) */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Step-by-Step Cost in {city.name}</h2>
      </div>
      <div className="border border-black/[0.06] mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f8f6] text-left">
              <th className="p-3 font-bold text-[#1c1c1c]">Procedure</th>
              <th className="p-3 font-bold text-[#1c1c1c] text-center">Qty</th>
              <th className="p-3 font-bold text-[#1c1c1c] text-right">
                Unit Cost ({city.name})
              </th>
              <th className="p-3 font-bold text-[#1c1c1c] text-right">Subtotal</th>
              <th className="p-3 font-bold text-[#1c1c1c] text-center">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-200">
            {cost.steps.map((step, i) => (
              <tr
                key={`${step.procedureSlug}-${i}`}
                className={step.isOptional ? "bg-[#f8f8f6]/50" : ""}
              >
                <td className="p-3">
                  <Link
                    href={`/pricing/${step.procedureSlug}/${citySlug}`}
                    className="text-[#006828] hover:underline font-medium"
                  >
                    {step.procedureName}
                  </Link>
                  {step.note && (
                    <span className="text-[11px] text-black/40 block">
                      {step.note}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">{step.quantity}</td>
                <td className="p-3 text-right text-black/40">
                  {formatAed(step.unitMin)} – {formatAed(step.unitMax)}
                </td>
                <td className="p-3 text-right font-bold text-[#1c1c1c]">
                  {formatAed(step.subtotalMin)} – {formatAed(step.subtotalMax)}
                </td>
                <td className="p-3 text-center">
                  {step.isOptional ? (
                    <span className="text-[10px] text-black/40 bg-[#f8f8f6] px-2 py-0.5">
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
            <tr className="bg-[#f8f8f6] font-bold">
              <td className="p-3 text-[#1c1c1c]" colSpan={3}>
                Total (Required Steps)
              </td>
              <td className="p-3 text-right text-[#006828]">
                {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
              </td>
              <td />
            </tr>
            {cost.optionalTypical > 0 && (
              <tr className="bg-[#f8f8f6]/50">
                <td className="p-3 text-black/40" colSpan={3}>
                  + Optional Add-ons
                </td>
                <td className="p-3 text-right text-black/40">
                  {formatAed(cost.optionalMin)} – {formatAed(cost.optionalMax)}
                </td>
                <td />
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* Compare with Other Cities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare with Other Cities</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        How does {city.name} compare to other UAE cities for{" "}
        {journey.name.toLowerCase()} cost? Showing typical cost for required
        steps.
      </p>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
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
              className={`flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group ${
                isThis ? "bg-[#006828]/5 border-l-2 border-l-[#006828]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    isThis ? "text-[#006828]" : "text-black/40"
                  }`}
                />
                <div>
                  <span
                    className={`text-sm font-bold ${
                      isThis
                        ? "text-[#006828]"
                        : "text-[#1c1c1c] group-hover:text-[#006828]"
                    } transition-colors`}
                  >
                    {comp.cityName}
                    {isThis && " (current)"}
                  </span>
                  <span className="text-[11px] text-black/40 block">
                    {formatAed(comp.requiredMin)} –{" "}
                    {formatAed(comp.requiredMax)}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
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
                  <ArrowRight className="w-3 h-3 text-black/40 group-hover:text-[#006828]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Find Providers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Find Providers in {city.name}</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Links to individual procedure pricing pages in {city.name} for each step
        of this journey.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {cost.steps.map((step, i) => (
          <Link
            key={`provider-${step.procedureSlug}-${i}`}
            href={`/pricing/${step.procedureSlug}/${citySlug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {step.procedureName}
                {step.quantity > 1 && (
                  <span className="text-black/40"> x{step.quantity}</span>
                )}
              </p>
              <p className="text-[11px] text-black/40">
                {formatAed(step.unitTypical)} typical in {city.name}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Other Cities for This Journey */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{journey.name} in Other Cities</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.filter((c) => c.slug !== citySlug).map((c) => {
          const cCost = calculateJourneyCost(journey, c.slug);
          return (
            <Link
              key={c.slug}
              href={`/pricing/journey/${journey.slug}/${c.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {c.name}
              </h3>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {formatAed(cCost.requiredTypical)} typical
              </p>
            </Link>
          );
        })}
      </div>

      {/* Other Journeys in This City */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Journeys in {city.name}</h2>
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
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
                  {j.name}
                </h3>
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
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
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
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
