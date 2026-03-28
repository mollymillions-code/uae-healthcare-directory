import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PRICING_GUIDES } from "@/lib/constants/pricing-guides";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
};

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Medical Pricing Guides by Audience — Tourists, Expats, Budget & Premium | UAE Open Healthcare Directory",
    description:
      "Choose the pricing guide that fits your situation. Guides for tourists, expats, uninsured residents, budget-conscious patients, premium healthcare seekers, and expecting parents in the UAE.",
    alternates: { canonical: `${base}/pricing/guide` },
    openGraph: {
      title: "UAE Medical Pricing Guides — Find the Right Guide for You",
      description:
        "Audience-specific healthcare cost guides for the UAE. Compare prices for 40+ procedures across 8 cities, tailored to your situation.",
      url: `${base}/pricing/guide`,
      type: "website",
    },
  };
}

export default function PricingGuideHubPage() {
  const base = getBaseUrl();

  const faqs = [
    {
      question: "Which pricing guide should I use?",
      answer:
        "Choose the guide that best matches your situation. If you do not have health insurance, start with the 'Without Insurance' guide. Tourists and visitors should use the 'For Tourists' guide. Expats with employer-provided insurance will find the 'For Expats' guide most relevant. If you are looking for the most affordable care, use the 'Budget Healthcare' guide. Expecting parents should start with the 'Maternity Costs' guide.",
    },
    {
      question: "Are the prices in these guides accurate?",
      answer:
        "Prices are indicative ranges based on the DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters, and market-observed data as of March 2026. Actual costs depend on the specific facility, doctor, clinical complexity, and your insurance plan. Always confirm the quote directly with the provider before proceeding.",
    },
    {
      question: "Do these guides cover all UAE cities?",
      answer:
        "Yes. Each guide includes pricing data for all 8 major UAE cities: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain, and Al Ain. You can view city-specific pricing by clicking into any guide and selecting your city.",
    },
    {
      question: "How often are these pricing guides updated?",
      answer:
        "Pricing data is reviewed and updated regularly based on the latest DOH tariff publications, DHA pricing updates, and market-observed changes. The current data reflects pricing as of March 2026.",
    },
    {
      question: "Can I use these guides to estimate my insurance co-pay?",
      answer:
        "The 'For Expats' guide includes typical co-pay amounts for common procedures. For a more precise estimate, use the insurance cost calculator on individual procedure pages, where you can select your specific insurance plan and get a personalised out-of-pocket estimate.",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Pricing Guides" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "UAE Medical Pricing Guides",
          description:
            "Audience-specific healthcare cost guides for the UAE covering tourists, expats, uninsured residents, budget and premium healthcare, and maternity costs.",
          url: `${base}/pricing/guide`,
          isPartOf: {
            "@type": "WebSite",
            name: "UAE Open Healthcare Directory",
            url: base,
          },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PRICING_GUIDES.length,
            itemListElement: PRICING_GUIDES.map((guide, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${base}/pricing/guide/${guide.slug}`,
              name: guide.name,
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Pricing Guides" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            UAE Medical Pricing Guides
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Healthcare costs in the UAE depend on who you are, where you go, and
            what insurance you have. These guides are tailored to specific
            situations — whether you are a tourist needing emergency care, an
            expat budgeting for your family, or an uninsured resident looking
            for affordable options. Choose the guide that matches your situation
            to find relevant prices, tips, and provider recommendations across
            all {CITIES.length} UAE cities.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: PRICING_GUIDES.length.toString(), label: "Audience guides" },
            { value: "40+", label: "Procedures priced" },
            { value: CITIES.length.toString(), label: "UAE cities" },
            { value: "55", label: "Total guide pages" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Choose Your Guide</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {PRICING_GUIDES.map((guide) => {
          const Icon = ICON_MAP[guide.icon] || BookOpen;
          return (
            <Link
              key={guide.slug}
              href={`/pricing/guide/${guide.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-start gap-3 mb-3">
                <Icon className="w-6 h-6 text-[#006828] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
                    {guide.name}
                  </h3>
                  <p className="text-[11px] text-black/40 line-clamp-2">
                    {guide.audience.slice(0, 120)}...
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-black/40">
                <span className="bg-[#f8f8f6] px-2 py-0.5">
                  {guide.featuredProcedures.length} procedures
                </span>
                <span className="bg-[#f8f8f6] px-2 py-0.5">
                  {CITIES.length} cities
                </span>
                <span className="bg-[#f8f8f6] px-2 py-0.5">
                  {guide.tips.length} tips
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* City-specific guides */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Guides by City</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Each guide is also available for specific UAE cities with localised
        pricing, provider recommendations, and city-specific tips.
      </p>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-12">
        {CITIES.map((city) => (
          <div key={city.slug} className="p-3">
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">{city.name}</h3>
            <div className="flex flex-wrap gap-2">
              {PRICING_GUIDES.map((guide) => (
                <Link
                  key={`${city.slug}-${guide.slug}`}
                  href={`/pricing/guide/${guide.slug}/${city.slug}`}
                  className="text-[11px] text-black/40 hover:text-[#006828] transition-colors border border-black/[0.06] px-2 py-1"
                >
                  {guide.name.replace("in UAE", "").replace("in the UAE", "").trim()}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="Pricing Guides — Frequently Asked Questions"
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges
          based on the DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG
          parameters, and market-observed data as of March 2026. Actual costs
          vary by facility, doctor, clinical complexity, and insurance plan. This
          tool is for informational purposes only and does not constitute medical
          or financial advice. Always obtain a personalised quote from the
          healthcare provider before proceeding with any procedure.
        </p>
      </div>
    </div>
  );
}
