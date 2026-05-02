import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const GUIDES = [
  {
    slug: "freelancer-health-insurance",
    title: "Health Insurance for Freelancers & Self-Sponsored Residents in UAE",
    description:
      "Who needs self-sponsored insurance, how to get it, the cheapest the UAE healthcare regulator and the UAE healthcare regulator compliant options, and what freelance permit holders must know about mandatory coverage.",
  },
  {
    slug: "maternity-insurance-uae",
    title: "Maternity Health Insurance in UAE — What's Covered, Waiting Periods & Best Plans",
    description:
      "Waiting periods by insurer, what is covered versus excluded, C-section and newborn coverage, and how to choose the best maternity plan for your needs.",
  },
  {
    slug: "how-to-claim-health-insurance",
    title: "How to File a Health Insurance Claim in UAE — Step by Step",
    description:
      "Direct billing versus reimbursement, required documents, timelines for processing, and how to dispute a rejected claim with your insurer.",
  },
  {
    slug: "domestic-worker-insurance",
    title: "Health Insurance for Domestic Workers in UAE — Employer Requirements",
    description:
      "Legal requirements for domestic worker coverage, minimum benefits, cheapest compliant plans, and penalties for non-compliance.",
  },
  {
    slug: "switching-health-insurance",
    title: "How to Switch Health Insurance Providers in UAE",
    description:
      "When you can switch, how pre-existing conditions transfer, continuous coverage rules, and the difference between employer-sponsored and self-purchased plans.",
  },
  // ─── Phase 3 listicles (added 2026-05-02) ─────────────────────────────
  {
    slug: "walk-in-clinic-insurance",
    title: "Walk-In Clinic Insurance in the UAE — Direct Billing, Co-pays, Networks (2026)",
    description:
      "Which UAE health insurance plans cover walk-in consultations with direct billing, expected co-pays at reception, and the chains that accept the broadest set of carriers.",
  },
  {
    slug: "direct-billing-insurance-uae",
    title: "Direct Billing Health Insurance in the UAE — How It Works (2026)",
    description:
      "How direct billing works between clinics, TPAs, and insurers; the carriers with the deepest networks; and the five most common reasons direct billing fails at reception.",
  },
  {
    slug: "same-day-claims-insurance",
    title: "Same-Day Claims Insurance in the UAE — Carriers That Settle Fast",
    description:
      "Real reimbursement-claim settlement timelines by carrier, the documents that speed up claims, and how to escalate stalled claims.",
  },
  {
    slug: "dental-insurance-uae-2026",
    title: "Dental Insurance in the UAE — Sub-limits, What's Covered, and the Best Plans",
    description:
      "Dental sub-limits across major UAE carriers, what's covered versus excluded, orthodontic coverage rules, and standalone dental riders.",
  },
  {
    slug: "chronic-disease-coverage-uae",
    title: "Chronic Disease Coverage in UAE Health Insurance",
    description:
      "How UAE plans cover diabetes, hypertension, and heart disease — chronic-disease management programmes, sub-limits, exclusions, and the best carriers for chronic-care patients.",
  },
  {
    slug: "outpatient-vs-inpatient-uae",
    title: "Outpatient vs Inpatient Health Insurance in the UAE",
    description:
      "UAE health-insurance terminology decoded — the difference between outpatient, inpatient, day-case, and observation status, and how each affects co-pay and benefit limits.",
  },
  {
    slug: "expat-vs-resident-insurance",
    title: "Expat vs Resident Health Insurance in the UAE — Why It Matters",
    description:
      "What changes between international expat plans and UAE-resident plans — network depth, international cover, family additions, and the right choice for each profile.",
  },
  {
    slug: "top-up-insurance-uae",
    title: "Top-Up Health Insurance in the UAE — When You Need It",
    description:
      "When top-up insurance is worth buying, how it stacks with employer-paid base cover, typical pricing, and the providers offering it in 2026.",
  },
  {
    slug: "mandatory-health-insurance-emirates",
    title: "Mandatory Health Insurance in the UAE — Rules by Emirate",
    description:
      "The UAE healthcare regulator mandatory cover rules by emirate, who pays, the minimum compliant cover, and the consequences of non-compliance.",
  },
  {
    slug: "insurance-claim-process-uae",
    title: "UAE Health Insurance Claim Process — Step by Step",
    description:
      "End-to-end claim process — direct billing at the clinic, post-visit reimbursement, required documents, common rejections, and how to dispute denials.",
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "Health Insurance Guides — UAE",
    description:
      "In-depth guides to health insurance in the UAE. Learn about freelancer insurance, maternity coverage, filing claims, domestic worker requirements, and switching providers.",
    alternates: { canonical: `${base}/insurance/guide` },
    openGraph: {
      title: "Health Insurance Guides — UAE",
      description:
        "Practical, in-depth guides covering every aspect of health insurance in the UAE.",
      url: `${base}/insurance/guide`,
      type: "website",
    },
  };
}

export default function InsuranceGuideIndexPage() {
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Insurance", url: `${base}/insurance` },
        { name: "Guides" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Insurance", href: "/insurance" },
        { label: "Guides" },
      ]} />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
        Health Insurance Guides — UAE
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
        {GUIDES.length} in-depth guides · Last updated May 2026
      </p>

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          These guides cover the most common questions about health insurance in the United Arab Emirates — from choosing a plan as a freelancer or self-sponsored resident, to understanding maternity coverage, filing and disputing claims, walk-in versus inpatient cover, dental and chronic-disease sub-limits, and the differences between expat-international and UAE-domestic plans. Each guide is written for UAE residents and references the UAE healthcare regulator regulations.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">All Guides</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/insurance/guide/${guide.slug}`}
            className="block border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-[#006828] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1c1c1c] text-sm mb-1 group-hover:text-[#006828] transition-colors">
                  {guide.title}
                </h3>
                <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
                  {guide.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#006828] mt-2">
                  Read guide <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Cross-link to insurance navigator */}
      <div className="mt-8 pt-6 border-t border-black/[0.06]">
        <Link
          href="/insurance"
          className="text-sm font-medium text-[#006828] hover:underline"
        >
          &larr; Back to Insurance Navigator
        </Link>
      </div>
    </div>
  );
}
