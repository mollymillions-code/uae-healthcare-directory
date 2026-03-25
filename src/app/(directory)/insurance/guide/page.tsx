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
      "Who needs self-sponsored insurance, how to get it, the cheapest DHA and DOH compliant options, and what freelance permit holders must know about mandatory coverage.",
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
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "Health Insurance Guides — UAE | Zavis",
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
    <div className="container-tc py-8">
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

      <h1 className="text-3xl font-bold text-dark mb-2">
        Health Insurance Guides — UAE
      </h1>
      <p className="text-sm text-muted mb-4">
        {GUIDES.length} in-depth guides · Last updated March 2026
      </p>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          These guides cover the most common questions about health insurance in the United Arab Emirates — from choosing a plan as a freelancer or self-sponsored resident, to understanding maternity coverage waiting periods, filing claims, insuring domestic workers, and switching providers mid-year. Each guide is written for UAE residents and references DHA, DOH, and MOHAP regulations.
        </p>
      </div>

      <div className="section-header">
        <h2>All Guides</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/insurance/guide/${guide.slug}`}
            className="block border border-light-200 p-5 hover:border-accent transition-colors group"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-dark text-sm mb-1 group-hover:text-accent transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {guide.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent mt-2">
                  Read guide <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Cross-link to insurance navigator */}
      <div className="mt-8 pt-6 border-t border-light-200">
        <Link
          href="/insurance"
          className="text-sm font-medium text-accent hover:underline"
        >
          &larr; Back to Insurance Navigator
        </Link>
      </div>
    </div>
  );
}
