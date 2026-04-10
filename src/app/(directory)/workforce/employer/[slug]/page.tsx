import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getFacilityBenchmarks,
  getAllFacilities,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllFacilities(20)
    .slice(0, 100)
    .map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const bench = getFacilityBenchmarks(params.slug);
  if (!bench) {
    return {
      title: "Facility Workforce Profile",
      description:
        "Workforce profile for a Dubai healthcare facility. Licensed staff count, specialty breakdown, and staffing benchmarks.",
    };
  }
  const base = getBaseUrl();
  return {
    title: `${bench.name} Workforce Profile — ${bench.totalStaff.toLocaleString()} Licensed Staff`,
    description: `Workforce profile for ${bench.name}: ${bench.totalStaff.toLocaleString()} DHA-licensed staff, ${bench.specialtyBreadth} specialties, ${bench.nurseToDoctorRatio}:1 nurse-to-doctor ratio. Category breakdown, staffing benchmarks, and top specialties.`,
    alternates: { canonical: `${base}/workforce/employer/${bench.slug}` },
    openGraph: {
      title: `${bench.name} Workforce Profile — ${bench.totalStaff.toLocaleString()} Licensed Staff`,
      description: `${bench.totalStaff.toLocaleString()} licensed healthcare professionals across ${bench.specialtyBreadth} specialties. Staffing benchmarks and category breakdown.`,
      url: `${base}/workforce/employer/${bench.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

function sizeTierLabel(tier: string): string {
  switch (tier) {
    case "mega":
      return "Mega (500+ staff)";
    case "large":
      return "Large (100-499 staff)";
    case "mid":
      return "Mid-Size (20-99 staff)";
    case "small":
      return "Small (5-19 staff)";
    case "micro":
      return "Micro (<5 staff)";
    default:
      return tier;
  }
}

export default function EmployerProfilePage({ params }: Props) {
  const bench = getFacilityBenchmarks(params.slug);
  if (!bench) notFound();

  const base = getBaseUrl();

  const categoryBreakdown = PROFESSIONAL_CATEGORIES.map((cat) => ({
    name: cat.name,
    count: bench.categories[cat.slug] || 0,
    pct:
      bench.totalStaff > 0
        ? ((bench.categories[cat.slug] || 0) / bench.totalStaff) * 100
        : 0,
  })).filter((c) => c.count > 0);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${bench.name} Workforce Profile`,
          description: `Workforce profile for ${bench.name}: ${bench.totalStaff.toLocaleString()} DHA-licensed staff.`,
          url: `${base}/workforce/employer/${bench.slug}`,
          about: {
            "@type": "MedicalBusiness",
            name: bench.name,
            numberOfEmployees: {
              "@type": "QuantitativeValue",
              value: bench.totalStaff,
            },
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Employers", url: `${base}/workforce/rankings/top-employers` },
          { name: bench.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Employers", href: "/workforce/rankings/top-employers" },
          { label: bench.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Employer Workforce Profile
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {bench.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {bench.totalStaff.toLocaleString()} Licensed Staff &middot;{" "}
          {sizeTierLabel(bench.sizeTier)} &middot; Data as of{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Workforce profile for {bench.name} based on DHA Sheryan Medical
            Professional Registry data. This facility employs{" "}
            {bench.totalStaff.toLocaleString()} DHA-licensed professionals across{" "}
            {bench.specialtyBreadth} specialties, with a nurse-to-doctor ratio of{" "}
            {bench.nurseToDoctorRatio}:1 and an FTL (independent license) rate of{" "}
            {bench.ftlRate}%.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {[
          {
            value: bench.totalStaff.toLocaleString(),
            label: "Total Licensed Staff",
          },
          {
            value: `${bench.nurseToDoctorRatio}:1`,
            label: "Nurse-to-Doctor Ratio",
          },
          { value: `${bench.ftlRate}%`, label: "FTL Rate" },
          {
            value: bench.specialtyBreadth.toString(),
            label: "Unique Specialties",
          },
          {
            value: sizeTierLabel(bench.sizeTier).split(" (")[0],
            label: "Size Tier",
          },
          {
            value: bench.physicians.toLocaleString(),
            label: "Physicians",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Workforce by Category
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {categoryBreakdown.map((cat) => (
          <div key={cat.name} className="border border-black/[0.06] p-4">
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
              {cat.name}
            </p>
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828] mb-1">
              {cat.count.toLocaleString()}
            </p>
            <div className="w-full bg-black/[0.04] h-1.5 mb-2">
              <div
                className="bg-[#006828] h-1.5"
                style={{ width: `${Math.min(cat.pct, 100)}%` }}
              />
            </div>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
              {cat.pct.toFixed(1)}% of facility staff
            </p>
          </div>
        ))}
      </div>

      {/* Top Specialties */}
      {bench.topSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top Specialties
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                    #
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Specialty
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Count
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    % of Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {bench.topSpecialties.map((spec, i) => {
                  const pct =
                    bench.totalStaff > 0
                      ? ((spec.count / bench.totalStaff) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr
                      key={spec.slug}
                      className="border-b border-black/[0.06]"
                    >
                      <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/workforce/specialty/${spec.slug}`}
                          className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                        >
                          {spec.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                          {spec.count.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Cross-Links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Related Pages
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href={`/professionals/facility/${bench.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Full Staff Directory
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Browse all {bench.totalStaff.toLocaleString()} licensed professionals
            at this facility
          </p>
        </Link>
        <Link
          href={`/doctors-at/${bench.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Doctors at {bench.name}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Physicians and dentists by specialty and seniority level
          </p>
        </Link>
        <Link
          href="/workforce/rankings/top-employers"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Top 50 Employers
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            See how this facility ranks against other Dubai healthcare employers
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. Staff
          counts reflect DHA-licensed professionals only and may not include
          administrative, support, or unlicensed staff. Verify credentials directly
          with DHA.
        </p>
      </div>
    </div>
  );
}
