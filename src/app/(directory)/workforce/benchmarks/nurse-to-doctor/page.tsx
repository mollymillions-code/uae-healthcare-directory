import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getNurseToDoctorRatios,
  getWorkforceRatios,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Nurse-to-Doctor Ratio Analysis Dubai — Facility Rankings & WHO Benchmarks | Zavis",
    description: `Nurse-to-doctor ratio analysis for Dubai healthcare facilities. Overall ratio, WHO benchmark comparison, and facility-level rankings for ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. Sourced from DHA Sheryan Registry.`,
    alternates: {
      canonical: `${base}/workforce/benchmarks/nurse-to-doctor`,
    },
    openGraph: {
      title:
        "Nurse-to-Doctor Ratio Analysis Dubai — Facility Rankings & WHO Benchmarks",
      description: `How do Dubai's healthcare facilities compare on nurse-to-doctor staffing? Analysis of ${PROFESSIONAL_STATS.total.toLocaleString()} professionals.`,
      url: `${base}/workforce/benchmarks/nurse-to-doctor`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function NurseToDoctorPage() {
  const base = getBaseUrl();
  const ratios = getNurseToDoctorRatios(20);
  const workforce = getWorkforceRatios();

  // Compute aggregate stats
  const totalNurses = ratios.reduce((s, r) => s + r.nurses, 0);
  const totalDoctors = ratios.reduce((s, r) => s + r.doctors, 0);
  const overallRatio =
    totalDoctors > 0 ? Math.round((totalNurses / totalDoctors) * 100) / 100 : 0;
  const medianIdx = Math.floor(ratios.length / 2);
  const medianRatio = ratios.length > 0 ? ratios[medianIdx].ratio : 0;

  // Top 30 by ratio
  const top30 = ratios.slice(0, 30);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Nurse-to-Doctor Ratio Analysis — Dubai Healthcare",
          description: `Nurse-to-doctor ratio analysis for Dubai: overall ${workforce.nurseToPhysicianRatio}:1, WHO recommends 3:1.`,
          url: `${base}/workforce/benchmarks/nurse-to-doctor`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Benchmarks" },
          { name: "Nurse-to-Doctor Ratio" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Benchmarks" },
          { label: "Nurse-to-Doctor Ratio" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Staffing Benchmark
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Nurse-to-Doctor Ratio Analysis — Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {ratios.length} Facilities Analyzed &middot; Data as of{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            The nurse-to-doctor ratio is a critical staffing benchmark used by
            health economists, regulators, and hospital administrators. The WHO
            recommends a minimum ratio of 3:1 (three nurses per doctor) for
            effective healthcare delivery. Dubai&apos;s overall ratio stands at{" "}
            {workforce.nurseToPhysicianRatio}:1, reflecting the emirate&apos;s
            physician-heavy workforce composition. This page ranks facilities
            with 20+ staff by their nurse-to-doctor ratio.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: `${workforce.nurseToPhysicianRatio}:1`,
            label: "Overall Ratio (All Dubai)",
          },
          { value: `${overallRatio}:1`, label: "Ratio (20+ Staff Facilities)" },
          { value: `${medianRatio}:1`, label: "Median Facility Ratio" },
          { value: "3:1", label: "WHO Recommended Minimum" },
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

      {/* WHO Context */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          WHO Benchmark Comparison
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          The World Health Organization recommends a nurse-to-doctor ratio of at
          least 3:1. Many advanced health systems achieve 4:1 or higher. Dubai
          currently operates at {workforce.nurseToPhysicianRatio}:1 across all
          facilities, which places it below the WHO recommendation.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "WHO Minimum", value: "3.0:1" },
            { label: "OECD Average", value: "2.7:1" },
            { label: "UK (NHS)", value: "3.8:1" },
            {
              label: "Dubai",
              value: `${workforce.nurseToPhysicianRatio}:1`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
                {value}
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Facility Rankings Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 30 Facilities by Nurse-to-Doctor Ratio
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
                Facility
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Ratio
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Nurses
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Doctors
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                Total Staff
              </th>
            </tr>
          </thead>
          <tbody>
            {top30.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.ratio}:1
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {fac.nurses.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {fac.doctors.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 text-right hidden md:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {fac.totalStaff.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related Benchmarks */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Other Benchmarks
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/workforce/benchmarks/staff-per-facility"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Staff per Facility
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Facility size distribution and staffing tier analysis
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Specialist per Capita
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Per-100K population rates for every specialty
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/ftl-rate"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            FTL Rate Analysis
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Independent practice license prevalence by specialty and area
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          &quot;Doctors&quot; includes both physicians and dentists. Only
          facilities with 20+ licensed staff are included. WHO and OECD
          benchmarks are approximate global averages. Verify credentials directly
          with DHA.
        </p>
      </div>
    </div>
  );
}
