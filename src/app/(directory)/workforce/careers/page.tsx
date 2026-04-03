import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Healthcare Careers in Dubai — Workforce Intelligence & Career Guides | Zavis",
    description:
      "Career intelligence for healthcare professionals in Dubai. Workforce size by category, top specialties, employer landscape, and career guides for physicians, dentists, nurses, and allied health workers.",
    alternates: { canonical: `${base}/workforce/careers` },
    openGraph: {
      title: "Healthcare Careers in Dubai — Workforce Intelligence & Career Guides",
      description:
        "Data-driven career intelligence for healthcare professionals considering Dubai's labor market.",
      url: `${base}/workforce/careers`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

const CAREER_GUIDES = [
  {
    slug: "dha-licensing-process",
    title: "DHA Licensing Process",
    description:
      "Step-by-step guide to obtaining a DHA license through the Sheryan system for foreign-trained healthcare professionals.",
  },
  {
    slug: "salary-benchmarks",
    title: "Salary Benchmarks by Specialty",
    description:
      "Estimated compensation ranges for physicians, nurses, dentists, and allied health professionals in Dubai.",
  },
  {
    slug: "top-employers-guide",
    title: "Top Employers Guide",
    description:
      "Inside look at Dubai's largest healthcare employers — culture, staffing, and career growth opportunities.",
  },
  {
    slug: "specialist-vs-consultant",
    title: "Specialist vs Consultant Track",
    description:
      "Understanding the DHA designation hierarchy: when and how professionals advance from Specialist to Consultant.",
  },
  {
    slug: "ftl-vs-reg-explained",
    title: "FTL vs REG License Explained",
    description:
      "What Full Time License and Registration mean for your career, mobility, and earning potential in Dubai.",
  },
  {
    slug: "high-demand-specialties",
    title: "High-Demand Specialties 2026",
    description:
      "Which specialties are growing fastest and where workforce gaps create the best opportunities for new hires.",
  },
];

export default function CareersPage() {
  const base = getBaseUrl();
  const topSpecialties = [...ALL_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Healthcare Careers in Dubai",
          description:
            "Career intelligence and guides for healthcare professionals in Dubai.",
          url: `${base}/workforce/careers`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Careers" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Careers" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Career Intelligence
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Healthcare Careers in Dubai
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          Data-driven career intelligence for healthcare professionals
          considering Dubai. Workforce size by category, in-demand specialties,
          employer rankings, and DHA licensing guidance.
        </p>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Dubai&apos;s healthcare sector employs{" "}
            <strong>{PROFESSIONAL_STATS.total.toLocaleString()}</strong>{" "}
            DHA-licensed professionals across{" "}
            <strong>
              {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}
            </strong>{" "}
            facilities, making it one of the fastest-growing and most
            internationally diverse healthcare labor markets in the Middle East.
          </p>
        </div>
      </div>

      {/* Category Career Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Careers by Category
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const pct = Math.round(
            (cat.count / PROFESSIONAL_STATS.total) * 100
          );
          return (
            <Link
              key={cat.slug}
              href={`/workforce/career/category/${cat.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {cat.name}
                </h3>
                <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {cat.count.toLocaleString()}
                </span>
              </div>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed mb-3">
                {cat.description}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-[#f8f8f6] overflow-hidden">
                    <div
                      className="h-full bg-[#006828]/40"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30">
                  {pct}% of workforce
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Top Specialty Career Links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Specialties
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
        {topSpecialties.map((spec) => (
          <Link
            key={spec.slug}
            href={`/workforce/career/${spec.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
              {spec.name}
            </p>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-[#006828] font-medium">
              {spec.count.toLocaleString()} professionals
            </p>
          </Link>
        ))}
      </div>

      {/* Career Guides */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Career Guides
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {CAREER_GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/workforce/guide/${guide.slug}`}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2 group-hover:text-[#006828] transition-colors">
              {guide.title}
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Related
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/workforce/employers"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Top Employers
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Ranked list of healthcare facilities by staff count
          </p>
        </Link>
        <Link
          href="/workforce/specialties"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Specialty Analysis
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            All {ALL_SPECIALTIES.length} specialties ranked by workforce size
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Staffing Benchmarks
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Nurse-to-doctor ratios, FTL rates, and more
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. Career
          guides are for informational purposes only and do not constitute
          employment or immigration advice. Verify all licensing requirements
          directly with DHA.
        </p>
      </div>
    </div>
  );
}
