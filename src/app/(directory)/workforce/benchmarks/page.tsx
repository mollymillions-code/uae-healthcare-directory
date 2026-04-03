import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getWorkforceRatios,
  getLicenseTypeBreakdown,
  getNurseToDoctorRatios,
  getFacilitySizeDistribution,
  getSpecialistPerCapita,
  getSpecialtyConcentration,
  getSpecialtiesWithBothLevels,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Healthcare Staffing Benchmarks Dubai — Ratios & Standards | Zavis",
    description:
      "Staffing benchmarks for Dubai healthcare: nurse-to-doctor ratios, staff per facility, specialist per-capita rates, FTL license analysis, consultant pipeline metrics, and specialty geographic concentration. DHA Sheryan data.",
    alternates: { canonical: `${base}/workforce/benchmarks` },
    openGraph: {
      title: "Healthcare Staffing Benchmarks Dubai — Ratios & Standards",
      description:
        "Six key benchmarks for evaluating Dubai's healthcare workforce capacity and distribution.",
      url: `${base}/workforce/benchmarks`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function BenchmarksPage() {
  const base = getBaseUrl();
  const ratios = getWorkforceRatios();
  const license = getLicenseTypeBreakdown();
  const nurseDoctorData = getNurseToDoctorRatios(20);
  const sizeDist = getFacilitySizeDistribution();
  const perCapita = getSpecialistPerCapita();
  const concentration = getSpecialtyConcentration();
  const pipeline = getSpecialtiesWithBothLevels();

  const benchmarks = [
    {
      title: "Nurse-to-Doctor Ratio",
      href: "/workforce/benchmarks/nurse-to-doctor",
      description:
        "Facility-level nurse-to-doctor ratios benchmarked against WHO standards. Identifies understaffed and overstaffed facilities.",
      stats: [
        {
          label: "System Avg",
          value: `${ratios.nurseToPhysicianRatio}:1`,
        },
        {
          label: "Facilities Tracked",
          value: nurseDoctorData.length.toString(),
        },
        { label: "WHO Benchmark", value: "3:1" },
      ],
    },
    {
      title: "Staff per Facility",
      href: "/workforce/benchmarks/staff-per-facility",
      description:
        "Size distribution of healthcare facilities from mega-hospitals (500+) to micro-clinics (<5). Median, mean, and tier breakdown.",
      stats: [
        { label: "Median Staff", value: sizeDist.medianStaff.toString() },
        { label: "Average Staff", value: sizeDist.averageStaff.toString() },
        {
          label: "Mega Facilities",
          value: sizeDist.mega.toString(),
        },
      ],
    },
    {
      title: "Specialist per Capita",
      href: "/workforce/benchmarks/specialist-per-capita",
      description:
        "Per-100,000 population rates for each specialty. Compares Dubai's specialist density against international norms.",
      stats: [
        {
          label: "Top Specialty",
          value: perCapita[0]?.name || "—",
        },
        {
          label: "Highest Rate",
          value: `${perCapita[0]?.per100K || 0}/100K`,
        },
        {
          label: "Specialties Tracked",
          value: perCapita.length.toString(),
        },
      ],
    },
    {
      title: "FTL Rate Analysis",
      href: "/workforce/benchmarks/ftl-rate",
      description:
        "Full Time License (FTL) vs Registration (REG) penetration by specialty and area. Measures staffing stability and commitment.",
      stats: [
        {
          label: "Overall FTL Rate",
          value: `${license.ftlPercent}%`,
        },
        {
          label: "FTL Holders",
          value: license.ftl.toLocaleString(),
        },
        {
          label: "REG Holders",
          value: license.reg.toLocaleString(),
        },
      ],
    },
    {
      title: "Consultant Pipeline",
      href: "/workforce/benchmarks/consultant-pipeline",
      description:
        "Specialist-to-consultant progression ratio by specialty. Shows seniority depth and career advancement patterns in each discipline.",
      stats: [
        {
          label: "Dual-Track Specialties",
          value: pipeline.length.toString(),
        },
        {
          label: "Top Pipeline",
          value: pipeline[0]?.name || "—",
        },
        {
          label: "Consultants",
          value:
            pipeline
              .reduce((sum, p) => sum + p.consultants, 0)
              .toLocaleString(),
        },
      ],
    },
    {
      title: "Specialty Concentration",
      href: "/workforce/benchmarks/specialty-concentration",
      description:
        "Geographic concentration index: what percentage of each specialty is clustered in just 3 areas. Identifies over-concentrated and well-distributed specialties.",
      stats: [
        {
          label: "Most Concentrated",
          value: concentration[0]?.name || "—",
        },
        {
          label: "Top 3 Area Share",
          value: `${concentration[0]?.top3Percent || 0}%`,
        },
        {
          label: "Specialties Tracked",
          value: concentration.length.toString(),
        },
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Healthcare Staffing Benchmarks — Dubai",
          description:
            "Six key staffing benchmarks for Dubai's healthcare workforce.",
          url: `${base}/workforce/benchmarks`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Benchmarks" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Benchmarks" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Staffing Benchmarks
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Healthcare Staffing Benchmarks
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          Six benchmark analyses measuring Dubai&apos;s healthcare workforce
          capacity, distribution, and staffing quality. Built on{" "}
          {PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed professionals
          across {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}{" "}
          facilities.
        </p>
      </div>

      {/* Benchmark Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Benchmark Reports
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {benchmarks.map((bm) => (
          <Link
            key={bm.href}
            href={bm.href}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2 group-hover:text-[#006828] transition-colors">
              {bm.title}
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed mb-4">
              {bm.description}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {bm.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828] truncate">
                    {stat.value}
                  </p>
                  <p className="font-['Geist',sans-serif] text-[10px] text-black/30 truncate">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Key Ratios Summary */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Key System-Level Ratios
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Physician-to-Population",
            value: ratios.physicianToPopulation,
          },
          {
            label: "Nurse-to-Population",
            value: ratios.nurseToPopulation,
          },
          {
            label: "Nurse-to-Physician",
            value: `${ratios.nurseToPhysicianRatio}:1`,
          },
          {
            label: "FTL Rate (System)",
            value: `${license.ftlPercent}%`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* AEO Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          What are the key healthcare staffing benchmarks in Dubai?
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          Dubai&apos;s healthcare system has a physician-to-population ratio of{" "}
          {ratios.physicianToPopulation}, a system-wide nurse-to-physician ratio
          of {ratios.nurseToPhysicianRatio}:1 (below the WHO benchmark of 3:1),
          and an FTL rate of {license.ftlPercent}% indicating high staffing
          stability. The median facility has {sizeDist.medianStaff} licensed
          staff, with only {sizeDist.mega} mega-hospitals employing 500+
          professionals.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Benchmarks are calculated from DHA-licensed professional counts only.
          Population estimates use 3,660,000 for Dubai (2026). Verify with DHA.
        </p>
      </div>
    </div>
  );
}
