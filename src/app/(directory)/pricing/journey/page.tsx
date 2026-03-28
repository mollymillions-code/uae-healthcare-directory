import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Route, Clock, DollarSign } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  CARE_JOURNEYS,
  calculateJourneyCost,
} from "@/lib/constants/care-journeys";
import { formatAed } from "@/lib/constants/procedures";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "UAE Medical Treatment Cost Bundles — How Much Does It Cost to Treat a Condition? | UAE Open Healthcare Directory",
    description:
      "How much does pregnancy, LASIK, dental implants, or knee treatment cost in the UAE? Browse 15 care journey cost bundles with step-by-step breakdowns across Dubai, Abu Dhabi, Sharjah, and all emirates. Based on DOH tariff data.",
    alternates: { canonical: `${base}/pricing/journey` },
    openGraph: {
      title: "UAE Medical Treatment Cost Bundles — Total Condition Costs",
      description:
        "Browse 15 care journeys with total cost estimates. Pregnancy, IVF, dental makeover, knee treatment, and more across 8 UAE cities.",
      url: `${base}/pricing/journey`,
      type: "website",
    },
  };
}

export default function JourneyHubPage() {
  const base = getBaseUrl();

  const journeysWithCosts = CARE_JOURNEYS.map((journey) => {
    const cost = calculateJourneyCost(journey);
    return { journey, cost };
  }).sort((a, b) => a.journey.sortOrder - b.journey.sortOrder);

  const faqs = [
    {
      question: "What are care journey cost bundles?",
      answer:
        "Care journey cost bundles estimate the total cost of treating a condition or completing a medical journey in the UAE. Instead of looking at individual procedure prices, bundles combine all the consultations, tests, and procedures you need into one total estimate. For example, the pregnancy journey includes GP visits, ultrasounds, blood tests, and delivery.",
    },
    {
      question: "How accurate are these total cost estimates?",
      answer:
        "Cost estimates are indicative ranges based on the DOH Mandatory Tariff (Shafafiya) methodology and market-observed data as of March 2026. Actual costs depend on the specific facility, doctor, clinical complexity, and your insurance plan. The bundles show typical costs — your real total may be higher or lower depending on your specific situation.",
    },
    {
      question: "Are these treatment costs covered by insurance in the UAE?",
      answer:
        "Coverage varies by journey and insurance plan. Medically necessary treatments (heart checkups, appendicitis, back pain) are typically covered with 10–20% co-pay. Elective and cosmetic procedures (dental makeover, rhinoplasty, hair transplant) are generally not covered. Each journey page includes a step-by-step insurance coverage breakdown.",
    },
    {
      question: "Which UAE city is cheapest for medical treatment?",
      answer:
        "Northern emirates (Sharjah, Ajman, Umm Al Quwain) consistently offer the lowest prices, often 30–40% less than Dubai. Abu Dhabi falls in the middle. Dubai is generally the most expensive due to higher facility costs and premium pricing. Each journey page compares total costs across all 8 UAE cities.",
    },
    {
      question: "Can I use these estimates to plan my medical budget?",
      answer:
        "Yes — these bundles are designed to help you plan and budget for medical treatment in the UAE. They include all typical steps from initial consultation through treatment and follow-up. Always confirm specific quotes with your healthcare provider before proceeding, as actual costs may differ.",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Care Journey Cost Bundles" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Care Journey Cost Bundles" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Route className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            UAE Medical Treatment Cost Bundles
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            How much does it really cost to treat a condition in the UAE? These {CARE_JOURNEYS.length} care
            journey bundles combine all consultations, tests, and procedures into a total
            estimated cost. Compare prices across Dubai, Abu Dhabi, Sharjah, and all
            emirates. Based on DOH Mandatory Tariff data and market-observed ranges as
            of March 2026.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: CARE_JOURNEYS.length.toString(), label: "Care journeys" },
            { value: "8", label: "Cities compared" },
            { value: "136", label: "Total pages" },
            { value: "2026", label: "Data year" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journey Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">All Care Journeys</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {journeysWithCosts.map(({ journey, cost }) => (
          <Link
            key={journey.slug}
            href={`/pricing/journey/${journey.slug}`}
            className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {journey.name}
              </h3>
              <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5" />
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3 line-clamp-2">
              {journey.description.slice(0, 120)}...
            </p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#006828]" />
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-black/40">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {journey.totalDuration}
              </span>
              <span>
                {journey.steps.filter((s) => !s.isOptional).length} steps
                {journey.steps.some((s) => s.isOptional) &&
                  ` + ${journey.steps.filter((s) => s.isOptional).length} optional`}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
          How Care Journey Cost Bundles Work
        </h2>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 space-y-3" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            Each care journey bundles the individual procedures needed to treat a condition
            from start to finish. Prices are calculated by summing the cost of each step
            (procedure cost x quantity) using our DOH-tariff-based pricing data. Required
            steps show the minimum you can expect to pay, while optional add-ons (like a
            C-section for pregnancy, or ACL surgery for a knee injury) show potential
            additional costs depending on your clinical situation.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            Costs vary by city — Dubai is typically the most expensive, while Sharjah and
            northern emirates offer lower rates. Each journey page includes a city-by-city
            comparison so you can see exactly where to find the best value.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="Care Journey Costs — Frequently Asked Questions"
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All cost bundles are indicative estimates
          based on the DOH Mandatory Tariff (Shafafiya) methodology and
          market-observed data as of March 2026. Actual total costs depend on the
          specific facility, doctor, clinical complexity, number of visits required,
          and insurance plan. These bundles are for planning purposes only and do
          not constitute medical or financial advice. Always obtain a personalised
          quote from your healthcare provider.
        </p>
      </div>
    </div>
  );
}
