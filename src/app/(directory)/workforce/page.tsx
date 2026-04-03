import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getWorkforceRatios,
  getLicenseTypeBreakdown,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Dubai Healthcare Workforce Intelligence — Labor Market Data & Analysis | Zavis",
    description:
      "Explore Dubai's healthcare labor market: 99,520 DHA-licensed professionals across 5,505 facilities. Workforce ratios, employer rankings, specialty analysis, geographic distribution, and staffing benchmarks sourced from the DHA Sheryan Medical Registry.",
    alternates: { canonical: `${base}/workforce` },
    openGraph: {
      title:
        "Dubai Healthcare Workforce Intelligence — Labor Market Data & Analysis",
      description:
        "The definitive source for Dubai healthcare labor market intelligence. 99,520 licensed professionals, 73 specialties, 5,505 facilities. Data from the DHA Sheryan Registry.",
      url: `${base}/workforce`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

const SUB_HUBS = [
  {
    title: "Workforce Overview",
    href: "/workforce/overview",
    description:
      "The flagship report: population ratios, category breakdowns, license types, top facilities, and geographic concentration.",
    stat: "Full Report",
  },
  {
    title: "Specialty Analysis",
    href: "/workforce/specialties",
    description:
      "All 73 tracked specialties ranked by workforce size, per-capita rates, and FTL license penetration.",
    stat: `${ALL_SPECIALTIES.length} Specialties`,
  },
  {
    title: "Top Employers",
    href: "/workforce/employers",
    description:
      "Healthcare facilities ranked by total staff count. Size tiers from mega-hospitals to neighborhood clinics.",
    stat: `${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} Facilities`,
  },
  {
    title: "Geographic Distribution",
    href: "/workforce/areas",
    description:
      "Where healthcare professionals are concentrated across Dubai's neighborhoods and medical districts.",
    stat: "36 Areas",
  },
  {
    title: "Staffing Benchmarks",
    href: "/workforce/benchmarks",
    description:
      "Nurse-to-doctor ratios, specialist per-capita rates, FTL analysis, consultant pipelines, and specialty concentration.",
    stat: "6 Benchmarks",
  },
  {
    title: "Career Intelligence",
    href: "/workforce/careers",
    description:
      "Career guides and workforce insights for healthcare professionals considering Dubai's labor market.",
    stat: "4 Categories",
  },
];

export default function WorkforceHubPage() {
  const base = getBaseUrl();
  const ratios = getWorkforceRatios();
  const license = getLicenseTypeBreakdown();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Dubai Healthcare Workforce Intelligence",
          description: `Labor market data and analysis for ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals in Dubai.`,
          url: `${base}/workforce`,
          mainEntity: {
            "@type": "Dataset",
            name: "Dubai Healthcare Workforce Data",
            description: `${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities in Dubai, sourced from the DHA Sheryan Medical Registry.`,
            creator: {
              "@type": "Organization",
              name: "Dubai Health Authority",
            },
            temporalCoverage: PROFESSIONAL_STATS.scraped,
            variableMeasured: [
              "Professional count by category",
              "Physician-to-population ratio",
              "Nurse-to-physician ratio",
              "License type distribution",
            ],
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Healthcare Labor Market Intelligence
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Dubai Healthcare Workforce Intelligence
        </h1>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Zavis tracks every DHA-licensed healthcare professional in Dubai —{" "}
            <strong>{PROFESSIONAL_STATS.total.toLocaleString()}</strong> individuals
            across{" "}
            <strong>
              {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}
            </strong>{" "}
            facilities — to produce the most comprehensive labor market
            intelligence available for the emirate&apos;s healthcare sector. This
            data serves hospital administrators, recruitment agencies, health
            economists, policymakers, and journalists tracking Dubai&apos;s
            healthcare workforce.
          </p>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.total.toLocaleString(),
              label: "Licensed Professionals",
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString(),
              label: "Healthcare Facilities",
            },
            {
              value: `${ratios.physiciansPer100K}`,
              label: "Physicians per 100K",
            },
            {
              value: `${ratios.nurseToPhysicianRatio}:1`,
              label: "Nurse-to-Physician Ratio",
            },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
                {value}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Category Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {PROFESSIONAL_CATEGORIES.map((cat) => {
            const pct = Math.round(
              (cat.count / PROFESSIONAL_STATS.total) * 100
            );
            return (
              <div
                key={cat.slug}
                className="border border-black/[0.06] p-4"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
                  {cat.name}
                </p>
                <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828]">
                  {cat.count.toLocaleString()}
                </p>
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
                  {pct}% of workforce
                </p>
              </div>
            );
          })}
        </div>

        {/* License breakdown */}
        <div className="border border-black/[0.06] p-5 mb-8">
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-2 uppercase tracking-wider">
            License Type Distribution
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-[#f8f8f6] overflow-hidden">
                <div
                  className="h-full bg-[#006828]"
                  style={{ width: `${license.ftlPercent}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-xs font-['Geist_Mono',monospace]">
              <span className="text-[#006828] font-medium">
                FTL {license.ftlPercent}%
              </span>
              <span className="text-black/40">
                REG {license.regPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Hub Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Explore Workforce Intelligence
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {SUB_HUBS.map((hub) => (
          <Link
            key={hub.href}
            href={hub.href}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {hub.title}
              </h3>
              <span className="font-['Geist_Mono',monospace] text-[11px] text-[#006828] font-medium">
                {hub.stat}
              </span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {hub.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Related Resources
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/professionals"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Professional Directory
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Search individual DHA-licensed professionals by name, specialty, or
            facility
          </p>
        </Link>
        <Link
          href="/directory/dubai"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Facility Directory
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Browse 12,500+ licensed healthcare facilities across the UAE
          </p>
        </Link>
        <Link
          href="/intelligence"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Industry Insights
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Healthcare industry news and analysis for the UAE market
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. This
          workforce intelligence is for informational purposes only. Verify
          professional credentials directly with DHA before making hiring or
          credentialing decisions.
        </p>
      </div>
    </div>
  );
}
