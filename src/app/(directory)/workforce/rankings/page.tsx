import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllFacilities,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Healthcare Workforce Rankings Dubai — Top Employers, Specialties & More | Zavis",
    description: `Rankings and league tables for Dubai's healthcare workforce: top employers by staff count, largest specialties, nurse-to-doctor ratios, FTL rates, and staffing benchmarks. ${PROFESSIONAL_STATS.total.toLocaleString()} professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities.`,
    alternates: { canonical: `${base}/workforce/rankings` },
    openGraph: {
      title:
        "Healthcare Workforce Rankings Dubai — Top Employers, Specialties & More",
      description: `League tables and rankings for Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals.`,
      url: `${base}/workforce/rankings`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function RankingsHubPage() {
  const base = getBaseUrl();
  const topFacilities = getAllFacilities(20);
  const topEmployerCount = Math.min(topFacilities.length, 50);
  const specialtyCount = ALL_SPECIALTIES.filter((s) => s.count >= 10).length;

  const RANKING_CARDS = [
    {
      title: "Top 50 Employers",
      href: "/workforce/rankings/top-employers",
      description:
        "The 50 largest healthcare employers in Dubai ranked by total DHA-licensed staff count.",
      stat: `${topEmployerCount} Facilities`,
    },
    {
      title: "Top Employers — Physicians",
      href: "/workforce/rankings/top-employers/physicians",
      description:
        "Facilities employing the most physicians and doctors in Dubai.",
      stat: `${PROFESSIONAL_CATEGORIES[0].count.toLocaleString()} Physicians`,
    },
    {
      title: "Top Employers — Nurses",
      href: "/workforce/rankings/top-employers/nurses",
      description:
        "Facilities with the largest nursing and midwifery teams in Dubai.",
      stat: `${PROFESSIONAL_CATEGORIES[2].count.toLocaleString()} Nurses`,
    },
    {
      title: "Top Employers — Dentists",
      href: "/workforce/rankings/top-employers/dentists",
      description:
        "Dental practices and hospitals ranked by licensed dentist count.",
      stat: `${PROFESSIONAL_CATEGORIES[1].count.toLocaleString()} Dentists`,
    },
    {
      title: "Top Employers — Allied Health",
      href: "/workforce/rankings/top-employers/allied-health",
      description:
        "Pharmacists, physiotherapists, lab techs, and other allied health professionals by employer.",
      stat: `${PROFESSIONAL_CATEGORIES[3].count.toLocaleString()} Allied`,
    },
    {
      title: "Largest Specialties",
      href: "/workforce/rankings/largest-specialties",
      description:
        "All medical specialties ranked by licensed professional count and per-capita rates.",
      stat: `${specialtyCount} Specialties`,
    },
    {
      title: "Staffing Benchmarks",
      href: "/workforce/benchmarks/nurse-to-doctor",
      description:
        "Nurse-to-doctor ratios, staff-per-facility distribution, specialist per-capita rates, and FTL analysis.",
      stat: "4 Benchmarks",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Healthcare Workforce Rankings Dubai",
          description: `Rankings for Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals.`,
          url: `${base}/workforce/rankings`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Rankings" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Rankings" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Workforce Rankings
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Healthcare Workforce Rankings — Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {PROFESSIONAL_STATS.total.toLocaleString()} Professionals &middot;{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} Facilities
          &middot; Data as of {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            League tables and rankings for Dubai&apos;s healthcare workforce.
            Explore the largest employers by total staff or by professional
            category, the most common medical specialties, and staffing
            benchmarks including nurse-to-doctor ratios and per-capita specialist
            rates. All data sourced from the DHA Sheryan Medical Professional
            Registry.
          </p>
        </div>
      </div>

      {/* Ranking Cards Grid */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Rankings
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {RANKING_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {card.title}
              </h3>
              <span className="font-['Geist_Mono',monospace] text-[11px] text-[#006828] font-medium whitespace-nowrap ml-2">
                {card.stat}
              </span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {card.description}
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
          href="/workforce"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Workforce Intelligence Hub
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Full labor market overview with ratios, breakdowns, and benchmarks
          </p>
        </Link>
        <Link
          href="/professionals"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Professional Directory
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Search individual licensed professionals by name, specialty, or
            facility
          </p>
        </Link>
        <Link
          href="/professionals/stats"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Workforce Statistics
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Aggregate stats, geographic distribution, and specialist vs.
            consultant analysis
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Rankings reflect licensed professional counts only. Verify credentials
          directly with DHA.
        </p>
      </div>
    </div>
  );
}
