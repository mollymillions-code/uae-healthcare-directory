import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getSpecialtyWorkforceMetrics,
  getSpecialtySupplyMetrics,
  getLicenseTypeBySpecialty,
  getSpecialtyBySlug,
  getSpecialtiesByCategory,
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  DUBAI_POPULATION,
  DUBAI_AREAS,
} from "@/lib/workforce";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return ALL_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { specialty: string };
}): Metadata {
  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  if (!metrics) return {};
  const base = getBaseUrl();

  return {
    title: `${metrics.name} Workforce in Dubai — ${metrics.totalCount.toLocaleString()} Licensed, ${metrics.per100K} per 100K`,
    description: `Labor market profile for ${metrics.totalCount.toLocaleString()} ${metrics.name.toLowerCase()} professionals in Dubai. FTL rate ${metrics.license.ftlPercent}%, ${metrics.areaDistribution.length} areas covered, top facilities, geographic gaps. DHA Sheryan data.`,
    alternates: {
      canonical: `${base}/workforce/specialty/${params.specialty}`,
    },
    openGraph: {
      title: `${metrics.name} Workforce in Dubai — ${metrics.totalCount.toLocaleString()} Licensed`,
      description: `${metrics.totalCount.toLocaleString()} ${metrics.name.toLowerCase()} professionals. ${metrics.per100K} per 100K population, ${metrics.concentrationIndex}% concentrated in top 3 areas.`,
      url: `${base}/workforce/specialty/${params.specialty}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

// ─── OECD per-100K benchmarks (approximate) for editorial interpretation ─────

const OECD_SPECIALTY_BENCHMARKS: Record<string, number> = {
  "general-practitioner": 120,
  "pediatrics": 25,
  "obstetrics-gynecology": 20,
  "cardiology": 15,
  "orthopedic-surgery": 15,
  "psychiatry": 18,
  "anesthesia": 20,
  "general-surgery": 20,
  "ophthalmology": 12,
  "dermatology": 10,
  "neurology": 10,
  "general-dentist": 60,
  "registered-nurse": 800,
  "pharmacist": 80,
  "physiotherapist": 50,
};

function getSupplyAssessment(
  slug: string,
  per100K: number,
  areasCovered: number,
  totalAreas: number
): string {
  const benchmark = OECD_SPECIALTY_BENCHMARKS[slug];
  const coverageRatio = areasCovered / totalAreas;
  const parts: string[] = [];

  if (benchmark) {
    if (per100K < benchmark * 0.5) {
      parts.push(
        `At ${per100K} per 100K, this specialty appears significantly undersupplied relative to the OECD benchmark of ~${benchmark} per 100K. This gap may indicate recruitment opportunities or unmet demand.`
      );
    } else if (per100K < benchmark * 0.8) {
      parts.push(
        `At ${per100K} per 100K versus an OECD benchmark of ~${benchmark} per 100K, there may be moderate undersupply. Dubai's younger population demographics partially offset this gap.`
      );
    } else if (per100K > benchmark * 1.3) {
      parts.push(
        `At ${per100K} per 100K, this specialty exceeds the OECD benchmark of ~${benchmark} per 100K, reflecting Dubai's role as a regional medical hub and medical tourism destination.`
      );
    } else {
      parts.push(
        `At ${per100K} per 100K, supply is broadly in line with the OECD benchmark of ~${benchmark} per 100K, though Dubai's unique demographics affect direct comparability.`
      );
    }
  } else {
    parts.push(
      `With ${per100K} professionals per 100K population, this specialty's supply level should be interpreted in context of Dubai's demographics and healthcare utilization patterns.`
    );
  }

  if (coverageRatio < 0.3) {
    parts.push(
      `Geographic coverage is limited to ${areasCovered} of ${totalAreas} mapped areas, suggesting significant access gaps in underserved neighborhoods.`
    );
  } else if (coverageRatio < 0.6) {
    parts.push(
      `Coverage spans ${areasCovered} of ${totalAreas} areas, with room for geographic expansion into underserved communities.`
    );
  }

  return parts.join(" ");
}

export default function SpecialtyWorkforcePage({
  params,
}: {
  params: { specialty: string };
}) {
  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  if (!metrics) notFound();

  const supply = getSpecialtySupplyMetrics(params.specialty);
  const license = getLicenseTypeBySpecialty(params.specialty);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const base = getBaseUrl();
  const category = PROFESSIONAL_CATEGORIES.find(
    (c) => c.slug === metrics.category
  );
  const categoryName = category?.name || metrics.category;

  // Related specialties in same category (excluding self)
  const relatedSpecialties = getSpecialtiesByCategory(metrics.category)
    .filter((s) => s.slug !== params.specialty)
    .slice(0, 6);

  const hasConsultantData =
    metrics.specialists > 0 || metrics.consultants > 0;
  const totalAreas = DUBAI_AREAS.length;

  const supplyAssessment = supply
    ? getSupplyAssessment(
        params.specialty,
        metrics.per100K,
        supply.areasCovered,
        totalAreas
      )
    : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Specialties", url: `${base}/workforce/category/${metrics.category}` },
          { name: metrics.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${metrics.name} Workforce in Dubai`,
          description: `Labor market data for ${metrics.totalCount.toLocaleString()} ${metrics.name.toLowerCase()} professionals licensed by DHA.`,
          url: `${base}/workforce/specialty/${params.specialty}`,
          about: {
            "@type": "MedicalSpecialty",
            name: metrics.name,
          },
          mainEntity: {
            "@type": "Dataset",
            name: `Dubai ${metrics.name} Workforce Data`,
            description: `Workforce metrics for ${metrics.totalCount.toLocaleString()} DHA-licensed ${metrics.name.toLowerCase()} professionals.`,
            creator: {
              "@type": "Organization",
              name: "Zavis",
              url: base,
            },
            distribution: {
              "@type": "DataDownload",
              contentUrl: `${base}/workforce/specialty/${params.specialty}`,
              encodingFormat: "text/html",
            },
            temporalCoverage: "2026",
            spatialCoverage: {
              "@type": "Place",
              name: "Dubai, United Arab Emirates",
            },
            variableMeasured: [
              "Total licensed professionals",
              "Per 100K population rate",
              "License type distribution",
              "Specialist vs Consultant ratio",
              "Geographic distribution",
              "Facility concentration",
            ],
          },
        }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          {
            label: categoryName,
            href: `/workforce/category/${metrics.category}`,
          },
          { label: metrics.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40 uppercase tracking-wider mb-1">
          {categoryName}
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {metrics.name}: Workforce Profile
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {metrics.totalCount.toLocaleString()} Licensed &middot;{" "}
          {metrics.per100K} per 100K &middot;{" "}
          {metrics.areaDistribution.length} Areas Covered
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Workforce intelligence for{" "}
            {metrics.name.toLowerCase()} professionals in Dubai. This profile
            covers supply density, licensing patterns, seniority distribution,
            employer concentration, and geographic access. All data from the DHA
            Sheryan Medical Professional Registry.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {[
          {
            value: metrics.totalCount.toLocaleString(),
            label: "Total licensed",
          },
          {
            value: metrics.per100K.toString(),
            label: "Per 100K pop.",
          },
          {
            value: `${license.ftlPercent}%`,
            label: "FTL rate",
          },
          {
            value: hasConsultantData
              ? `${metrics.consultantRatio}%`
              : "N/A",
            label: "Consultant ratio",
          },
          {
            value: metrics.areaDistribution.length.toString(),
            label: "Areas covered",
          },
          {
            value: `${metrics.concentrationIndex}%`,
            label: "Top 3 area conc.",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl sm:text-2xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Supply Assessment */}
      {supplyAssessment && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Supply Assessment
            </h2>
          </div>
          <div className="bg-[#f8f8f6] border-l-4 border-[#006828] py-5 px-6 mb-12">
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {supplyAssessment}
            </p>
          </div>
        </>
      )}

      {/* License Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          License Type Breakdown
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          <strong>FTL</strong> (Full Trade License) holders operate under their
          own license, typically independent practitioners.{" "}
          <strong>REG</strong> (Registered) professionals work under a
          facility&apos;s license.{" "}
          {license.ftlPercent > 40
            ? `A ${license.ftlPercent}% FTL rate is high, suggesting many ${metrics.name.toLowerCase()} professionals operate independently or run private practices.`
            : `A ${license.ftlPercent}% FTL rate indicates most ${metrics.name.toLowerCase()} professionals are facility-employed rather than independent practitioners.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            FTL (Full Trade License)
          </p>
          <p className="text-2xl font-bold text-[#006828]">
            {license.ftl.toLocaleString()}
          </p>
          <div className="w-full bg-black/[0.04] h-1.5 mt-2 mb-1">
            <div
              className="bg-[#006828] h-1.5"
              style={{ width: `${license.ftlPercent}%` }}
            />
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {license.ftlPercent}%
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            REG (Registered)
          </p>
          <p className="text-2xl font-bold text-[#1c1c1c]">
            {license.reg.toLocaleString()}
          </p>
          <div className="w-full bg-black/[0.04] h-1.5 mt-2 mb-1">
            <div
              className="bg-[#1c1c1c] h-1.5"
              style={{ width: `${license.regPercent}%` }}
            />
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {license.regPercent}%
          </p>
        </div>
      </div>

      {/* Specialist vs Consultant */}
      {hasConsultantData && (metrics.specialists > 0 || metrics.consultants > 0) && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Specialist vs. Consultant
            </h2>
          </div>
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              In the DHA system, <strong>Specialists</strong> hold board
              certification in their field. <strong>Consultants</strong> are
              senior specialists with 5+ years of post-certification experience.
              The consultant ratio indicates career pipeline maturity &mdash; a
              higher ratio suggests an established, senior workforce.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="bg-[#f8f8f6] p-5 text-center">
              <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
                Specialists
              </p>
              <p className="text-2xl font-bold text-[#006828]">
                {metrics.specialists.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#f8f8f6] p-5 text-center">
              <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
                Consultants
              </p>
              <p className="text-2xl font-bold text-[#1c1c1c]">
                {metrics.consultants.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#f8f8f6] p-5 text-center">
              <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
                Consultant Ratio
              </p>
              <p className="text-2xl font-bold text-[#1c1c1c]">
                {metrics.consultantRatio}%
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
                {metrics.consultantRatio > 40
                  ? "Mature, senior-heavy workforce"
                  : metrics.consultantRatio > 20
                    ? "Balanced seniority pipeline"
                    : "Early-career dominated"}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Top 10 Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Facilities for {metrics.name}
        </h2>
      </div>
      {supply && supply.topFacilityShare > 0 && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          The largest single employer holds {supply.topFacilityShare}% of all{" "}
          {metrics.name.toLowerCase()} professionals in Dubai.
          {supply.topFacilityShare > 20
            ? " This high concentration suggests market power concentrated in a few facilities."
            : " Supply is relatively distributed across facilities."}
        </p>
      )}
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
                {metrics.name} Staff
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Total Staff
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.topFacilities.map((fac, i) => (
              <tr
                key={fac.slug}
                className="border-b border-black/[0.06]"
              >
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
                    {fac.count.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {fac.totalStaff.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Distribution
        </h2>
      </div>

      {/* Concentration Index Callout */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-4 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          <strong>Concentration index:</strong>{" "}
          <span className="font-['Geist_Mono',monospace] font-bold text-[#1c1c1c]">
            {metrics.concentrationIndex}%
          </span>{" "}
          of {metrics.name.toLowerCase()} professionals are located in the top 3
          areas
          {metrics.areaDistribution.length >= 3 && (
            <>
              {" "}
              ({metrics.areaDistribution
                .slice(0, 3)
                .map((a) => a.name)
                .join(", ")}
              )
            </>
          )}
          .{" "}
          {metrics.concentrationIndex > 70
            ? "This high concentration may create access barriers for patients in peripheral areas."
            : metrics.concentrationIndex > 50
              ? "Moderate concentration with room for more distributed coverage."
              : "Supply is relatively well-distributed across areas."}
        </p>
      </div>

      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Area
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Count
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % of Specialty
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.areaDistribution.map((area) => {
              const pct = (
                (area.count / metrics.totalCount) *
                100
              ).toFixed(1);
              return (
                <tr
                  key={area.slug}
                  className="border-b border-black/[0.06]"
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {area.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {area.count.toLocaleString()}
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

      {/* Geographic Gaps */}
      {supply && supply.geographicGaps.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Geographic Gaps
            </h2>
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
            Areas in Dubai with zero licensed {metrics.name.toLowerCase()}{" "}
            professionals. These represent potential access deserts for
            residents needing this specialty.
          </p>
          <div className="flex flex-wrap gap-2 mb-12">
            {supply.geographicGaps.map((gap) => (
              <span
                key={gap}
                className="bg-[#f8f8f6] border border-black/[0.06] px-3 py-1.5 font-['Geist',sans-serif] text-xs text-black/50"
              >
                {gap}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Related
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <Link
          href={`/professionals/${metrics.category}/${params.specialty}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Browse {metrics.name} Directory
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            Search individual {metrics.name.toLowerCase()} professionals
          </p>
        </Link>
        {spec.relatedDirectoryCategory && (
          <Link
            href={`/best/doctors/${params.specialty}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              Best {metrics.name} in Dubai
            </h3>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
              Top-rated professionals by patient reviews
            </p>
          </Link>
        )}
        <Link
          href={`/workforce/category/${metrics.category}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {categoryName} Workforce Overview
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            All {categoryName.toLowerCase()} in Dubai
          </p>
        </Link>
        <Link
          href="/workforce"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Workforce Intelligence Hub
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            Full Dubai healthcare workforce overview
          </p>
        </Link>
      </div>

      {/* Related Specialties */}
      {relatedSpecialties.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-12">
          {relatedSpecialties.map((rs) => (
            <Link
              key={rs.slug}
              href={`/workforce/specialty/${rs.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
            >
              <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {rs.name}
              </p>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/30 mt-0.5">
                {rs.count.toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* DHA Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Population estimate: {DUBAI_POPULATION.toLocaleString()} (Dubai
          Statistics Center). OECD benchmarks are approximate averages for
          context and may not be directly comparable due to differences in
          licensing scope and population demographics. This page presents labor
          market analysis for informational purposes only.
        </p>
      </div>
    </div>
  );
}
