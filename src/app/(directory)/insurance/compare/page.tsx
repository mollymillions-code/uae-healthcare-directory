import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CompareClient } from "@/components/insurance/CompareClient";
import { INSURER_PROFILES, getAllPlans } from "@/lib/insurance";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const totalPlans = getAllPlans().length;

  return {
    title: `Compare Health Insurance Plans in the UAE Side-by-Side | ${totalPlans} Plans, ${INSURER_PROFILES.length} Insurers`,
    description: `Compare up to 4 UAE health insurance plans side-by-side. Coverage, premiums, co-pay, dental limits, maternity waiting periods, and exclusions for ${INSURER_PROFILES.length} insurers including Daman, AXA, Cigna, Bupa, and more.`,
    alternates: { canonical: `${base}/insurance/compare` },
    openGraph: {
      title: "Compare UAE Health Insurance Plans Side-by-Side",
      description: `${totalPlans} plans across ${INSURER_PROFILES.length} insurers. Select up to 4 and compare coverage, premiums, co-pay, and network sizes.`,
      url: `${base}/insurance/compare`,
      type: "website",
    },
  };
}

export default function ComparePage() {
  const base = getBaseUrl();
  const totalPlans = getAllPlans().length;

  const faqs = [
    {
      question: "How do I compare health insurance plans in the UAE?",
      answer: `Use the UAE Health Insurance Navigator comparison tool to select up to 4 plans from ${INSURER_PROFILES.length} insurers and compare them side-by-side. The tool shows annual premiums, coverage limits, co-pay percentages, dental and optical sub-limits, maternity waiting periods, room types, and key exclusions for each plan.`,
    },
    {
      question: "What should I look for when comparing UAE health insurance plans?",
      answer: "When comparing UAE health insurance plans, focus on: (1) Annual premium vs. annual coverage limit, (2) Outpatient co-pay percentage — 0% vs. 20% makes a significant difference over a year, (3) Dental and optical sub-limits if you need these, (4) Maternity waiting period — ranges from 0 to 12 months, (5) Pre-existing condition waiting period, (6) Network size — how many hospitals and clinics accept the plan in your city, and (7) Whether the plan is DHA, HAAD, or MOHAP compliant for your emirate.",
    },
    {
      question: "What is the difference between basic and enhanced health insurance in the UAE?",
      answer: "Basic plans (AED 2,000–6,000/year) meet mandatory DHA/HAAD requirements with inpatient, outpatient, and emergency coverage but typically exclude dental, optical, and mental health. Enhanced plans (AED 5,000–16,000/year) add dental, optical, maternity, mental health, and lower co-pay percentages. Premium plans (AED 14,000–45,000/year) offer zero co-pay, private rooms, international coverage, and comprehensive dental/optical limits.",
    },
    {
      question: "Can I compare plans from different insurers?",
      answer: `Yes. The comparison tool lets you select any combination of plans across all ${INSURER_PROFILES.length} insurers — for example, comparing a Daman Enhanced plan with a Cigna Global Health plan and a Bupa Essential plan. Each plan is shown with the same standardised fields for easy comparison.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Insurance Navigator", url: `${base}/insurance` },
          { name: "Compare Plans" },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Insurance Navigator", href: "/insurance" },
          { label: "Compare Plans" },
        ]}
      />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">Compare Health Insurance Plans</h1>

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          Select up to 4 plans from {INSURER_PROFILES.length} UAE insurers to compare side-by-side.
          The comparison covers annual premiums, coverage limits, co-pay percentages, dental and
          optical sub-limits, maternity and pre-existing condition waiting periods, room types,
          and key exclusions. {totalPlans} plans available across basic, enhanced, premium, and VIP tiers.
        </p>
      </div>

      <CompareClient />

      {/* FAQ for SEO/AEO */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title="Comparing Health Insurance in the UAE — FAQ" />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Plan details and premiums are indicative, based on publicly
          available UAE insurance market data. Obtain personalised quotes from insurers or authorised
          brokers. Provider network data from the UAE Open Healthcare Directory, last verified March 2026.
        </p>
      </div>
    </div>
  );
}
