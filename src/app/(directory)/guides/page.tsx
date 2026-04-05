import { Metadata } from "next";
import Link from "next/link";
import { DollarSign, BarChart3, BookOpen, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  GUIDES,
  getGuidesByType,
  type GuideDefinition,
} from "@/lib/guides/data";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "UAE Healthcare Guides — Costs, Best Providers & System Guides | Zavis",
  description:
    "Comprehensive guides to UAE healthcare: procedure costs in Dubai and Abu Dhabi, best hospitals and clinics ranked by patient reviews, health insurance, and navigating the system. Data-driven and updated monthly.",
  alternates: {
    canonical: `${getBaseUrl()}/guides`,
  },
  openGraph: {
    title: "UAE Healthcare Guides — Costs, Best Providers & System Guides",
    description: "Comprehensive guides to UAE healthcare costs, top-rated providers, and navigating the health system.",
    url: `${getBaseUrl()}/guides`,
    type: "website",
    locale: "en_AE",
    siteName: "Zavis",
  },
};

const TEMPLATE_CONFIG = {
  "cost-guide": {
    icon: DollarSign,
    label: "Cost & Pricing Guides",
    description: "Detailed price breakdowns for medical procedures in the UAE, with insurance coverage information and clinic comparisons.",
  },
  comparison: {
    icon: BarChart3,
    label: "Best Provider Rankings",
    description: "Data-driven rankings of the best hospitals, clinics, and specialists in each emirate, based on verified patient reviews.",
  },
  "system-guide": {
    icon: BookOpen,
    label: "Healthcare System Guides",
    description: "Navigate the UAE healthcare system: licensing, insurance, medical tourism, and emirate-specific regulations.",
  },
} as const;

function GuideCard({ guide }: { guide: GuideDefinition }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group block border border-light-200 hover:border-[#006828] transition-colors"
    >
      <div className="p-4">
        <span className="inline-block px-2 py-0.5 text-[10px] font-mono bg-canvas-200 text-muted uppercase tracking-wider mb-2">
          {guide.templateType === "cost-guide" && "Price Guide"}
          {guide.templateType === "comparison" && "Rankings"}
          {guide.templateType === "system-guide" && "System Guide"}
        </span>
        <h3 className="text-sm font-bold text-dark group-hover:text-[#006828] transition-colors mb-2 line-clamp-2">
          {guide.h1}
        </h3>
        <p className="text-xs text-muted line-clamp-2 mb-3">
          {guide.metaDescription}
        </p>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#006828] opacity-0 group-hover:opacity-100 transition-opacity">
          Read guide
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

export default function GuidesListingPage() {
  const base = getBaseUrl();
  const costGuides = getGuidesByType("cost-guide");
  const comparisonGuides = getGuidesByType("comparison");
  const systemGuides = getGuidesByType("system-guide");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Healthcare Guides" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "UAE Healthcare Guides",
          description: "Comprehensive guides to UAE healthcare costs, top-rated providers, and navigating the health system.",
          url: `${base}/guides`,
          publisher: {
            "@type": "Organization",
            name: "Zavis",
            url: base,
          },
          numberOfItems: GUIDES.length,
        }}
      />

      <div className="container-tc pt-8 pb-16">
        <Breadcrumb items={[{ label: "Healthcare Guides" }]} />

        {/* Header */}
        <div className="mb-10">
          <h1 className="headline-serif-xl mb-4">UAE Healthcare Guides</h1>
          <p className="font-serif text-lg text-muted leading-relaxed max-w-3xl">
            Data-driven guides to healthcare costs, top-rated providers, and navigating the UAE health system.
            Every guide is backed by pricing data, verified patient reviews, and official regulatory information.
          </p>
        </div>

        {/* Template sections */}
        {([
          { type: "cost-guide" as const, guides: costGuides },
          { type: "comparison" as const, guides: comparisonGuides },
          { type: "system-guide" as const, guides: systemGuides },
        ]).map(({ type, guides }) => {
          const config = TEMPLATE_CONFIG[type];
          const Icon = config.icon;
          return (
            <section key={type} className="mb-12">
              <div className="border-b-2 border-dark mb-4" />
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-[#006828]" />
                <h2 className="font-sans text-xl font-bold text-dark">
                  {config.label}
                </h2>
                <span className="text-xs text-muted ml-2">({guides.length})</span>
              </div>
              <p className="text-sm text-muted mb-6 max-w-2xl">
                {config.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {guides.map((guide) => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </section>
          );
        })}

        {/* AEO Answer Block */}
        <section className="mt-12">
          <div className="answer-block bg-light-50 border border-light-200 p-5" data-answer-block="true">
            <p className="text-sm text-muted leading-relaxed">
              Zavis publishes {GUIDES.length} comprehensive healthcare guides covering
              procedure costs, provider rankings, and UAE health system navigation.
              Guides are data-driven, sourcing pricing from market research and official health authority
              tariff frameworks, and ranking providers using verified Google patient reviews from the
              UAE Open Healthcare Directory database of 12,500+ licensed facilities.
              All guides are reviewed and updated monthly. Last updated April 2026.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
