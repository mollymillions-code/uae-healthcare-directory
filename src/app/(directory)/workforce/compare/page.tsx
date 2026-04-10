import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  PHYSICIAN_SPECIALTIES,
} from "@/lib/constants/professionals";
import {
  getTopAreas,
  getTopFacilities,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "Compare Healthcare Workforce in Dubai — Specialty, Area, Employer",
    description: `Side-by-side workforce comparisons across Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals. Compare specialties, areas, employers, and categories using DHA Sheryan Registry data.`,
    alternates: { canonical: `${base}/workforce/compare` },
    openGraph: {
      title: "Compare Healthcare Workforce in Dubai",
      description: `Side-by-side workforce comparisons across Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals.`,
      url: `${base}/workforce/compare`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CompareHubPage() {
  const base = getBaseUrl();
  const topAreas = getTopAreas(10);
  const topFacilities = getTopFacilities(20);

  // Top 6 physician specialties for sample links
  const topSpecs = [...PHYSICIAN_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Compare" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Compare" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Workforce Comparisons
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Side-by-Side Analysis &middot; {PROFESSIONAL_STATS.total.toLocaleString()} DHA-Licensed Professionals
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Compare specialties, geographic areas, employers, and professional categories
            side by side. All data sourced from the DHA Sheryan Medical Professional Registry.
          </p>
        </div>
      </div>

      {/* Specialty Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Specialty vs. Specialty
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        Compare workforce size, FTL rates, consultant ratios, concentration, and top employers
        between any two medical specialties. 105+ comparison pages from the top 15 physician specialties.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {topSpecs.slice(0, 3).map((specA, i) => {
          const specB = topSpecs[i + 3];
          if (!specB) return null;
          return (
            <Link
              key={`${specA.slug}-vs-${specB.slug}`}
              href={`/workforce/compare/specialty/${specA.slug}-vs-${specB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {specA.name} vs. {specB.name}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {specA.count.toLocaleString()} vs {specB.count.toLocaleString()} professionals
              </p>
            </Link>
          );
        })}
      </div>

      {/* Area Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Area vs. Area
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        Compare healthcare workforce density, category mix, license types, and top facilities
        between Dubai areas. 45 comparison pages from the top 10 areas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {topAreas.slice(0, 3).map((areaA, i) => {
          const areaB = topAreas[i + 3];
          if (!areaB) return null;
          return (
            <Link
              key={`${areaA.slug}-vs-${areaB.slug}`}
              href={`/workforce/compare/area/${areaA.slug}-vs-${areaB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {areaA.name} vs. {areaB.name}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {areaA.count.toLocaleString()} vs {areaB.count.toLocaleString()} professionals
              </p>
            </Link>
          );
        })}
      </div>

      {/* Employer Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Employer vs. Employer
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        Compare total staff, nurse-to-doctor ratios, FTL rates, specialty breadth, and category mix
        between Dubai&apos;s largest healthcare employers. 190 comparison pages from the top 20 facilities.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {topFacilities.slice(0, 3).map((facA, i) => {
          const facB = topFacilities[i + 3];
          if (!facB) return null;
          return (
            <Link
              key={`${facA.slug}-vs-${facB.slug}`}
              href={`/workforce/compare/employer/${facA.slug}-vs-${facB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {facA.name} vs. {facB.name}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {facA.totalStaff.toLocaleString()} vs {facB.totalStaff.toLocaleString()} staff
              </p>
            </Link>
          );
        })}
      </div>

      {/* Category Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Category vs. Category
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        Compare workforce profiles between the four DHA professional categories: physicians,
        dentists, nurses, and allied health professionals.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {PROFESSIONAL_CATEGORIES.slice(0, 2).map((catA, i) => {
          const catB = PROFESSIONAL_CATEGORIES[i + 2];
          if (!catB) return null;
          return (
            <Link
              key={`${catA.slug}-vs-${catB.slug}`}
              href={`/workforce/compare/category/${catA.slug}-vs-${catB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {catA.name} vs. {catB.name}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {catA.count.toLocaleString()} vs {catB.count.toLocaleString()} professionals
              </p>
            </Link>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          All comparisons are for informational purposes only and do not constitute
          medical or employment advice.
        </p>
      </div>
    </div>
  );
}
