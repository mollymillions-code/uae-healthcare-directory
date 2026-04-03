import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getCategoryWorkforceProfile,
  getTopEmployersByCategory,
  getLicenseTypeByCategory,
  getSpecialtiesByCategory,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  DUBAI_POPULATION,
} from "@/lib/workforce";

export const revalidate = 43200;
export const dynamicParams = false;

export function generateStaticParams() {
  return PROFESSIONAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const profile = getCategoryWorkforceProfile(params.category);
  if (!profile) return {};
  const base = getBaseUrl();

  const titleMap: Record<string, string> = {
    physicians: "Physicians & Doctors",
    dentists: "Dentists",
    nurses: "Nurses & Midwives",
    "allied-health": "Allied Health Professionals",
  };
  const label = titleMap[params.category] || profile.name;

  return {
    title: `${label} Workforce in Dubai — ${profile.totalCount.toLocaleString()} Licensed Professionals | Zavis`,
    description: `Labor market profile for ${profile.totalCount.toLocaleString()} ${label.toLowerCase()} licensed in Dubai. License breakdown, specialty distribution, top employers, geographic concentration. Sourced from DHA Sheryan Registry.`,
    alternates: {
      canonical: `${base}/workforce/category/${params.category}`,
    },
    openGraph: {
      title: `${label} Workforce in Dubai — ${profile.totalCount.toLocaleString()} Licensed`,
      description: `${profile.totalCount.toLocaleString()} ${label.toLowerCase()} representing ${profile.percentOfWorkforce}% of Dubai's healthcare workforce. ${profile.per100K} per 100K population.`,
      url: `${base}/workforce/category/${params.category}`,
      type: "website",
      siteName: "Zavis Healthcare Intelligence",
    },
  };
}

// ─── OECD benchmarks for editorial context ──────────────────────────────────

const OECD_BENCHMARKS: Record<string, { label: string; per100K: number }> = {
  physicians: { label: "OECD average for physicians", per100K: 360 },
  dentists: { label: "OECD average for dentists", per100K: 70 },
  nurses: { label: "OECD average for nurses", per100K: 900 },
  "allied-health": { label: "OECD average for allied health", per100K: 500 },
};

export default function CategoryWorkforcePage({
  params,
}: {
  params: { category: string };
}) {
  const profile = getCategoryWorkforceProfile(params.category);
  if (!profile) notFound();

  const base = getBaseUrl();
  const license = getLicenseTypeByCategory(params.category);
  const employers = getTopEmployersByCategory(params.category, 20);
  const specialties = getSpecialtiesByCategory(params.category);
  const oecd = OECD_BENCHMARKS[params.category];
  const otherCategories = PROFESSIONAL_CATEGORIES.filter(
    (c) => c.slug !== params.category
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: profile.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${profile.name} Workforce in Dubai`,
          description: `Labor market profile for ${profile.totalCount.toLocaleString()} ${profile.name.toLowerCase()} licensed by DHA.`,
          url: `${base}/workforce/category/${params.category}`,
          mainEntity: {
            "@type": "Dataset",
            name: `Dubai ${profile.name} Workforce Data`,
            description: `Workforce statistics for ${profile.totalCount.toLocaleString()} DHA-licensed ${profile.name.toLowerCase()}.`,
            creator: {
              "@type": "Organization",
              name: "Zavis",
              url: base,
            },
            distribution: {
              "@type": "DataDownload",
              contentUrl: `${base}/workforce/category/${params.category}`,
              encodingFormat: "text/html",
            },
            temporalCoverage: "2026",
            spatialCoverage: {
              "@type": "Place",
              name: "Dubai, United Arab Emirates",
            },
            variableMeasured: [
              "Total licensed professionals",
              "License type distribution",
              "Specialty distribution",
              "Employer distribution",
              "Geographic distribution",
            ],
          },
        }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: profile.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {profile.name}: Workforce Profile
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalCount.toLocaleString()} Licensed Professionals &middot;{" "}
          {profile.percentOfWorkforce}% of Dubai&apos;s Healthcare Workforce
          &middot; {profile.per100K} per 100K Population
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Labor market analysis of the{" "}
            {profile.name.toLowerCase()} workforce in Dubai, covering license
            distribution, specialty breakdown, employer concentration, and
            geographic spread. All data sourced from the DHA Sheryan Medical
            Professional Registry.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: profile.totalCount.toLocaleString(),
            label: "Total licensed",
          },
          {
            value: `${license.ftlPercent}% / ${license.regPercent}%`,
            label: "FTL / REG split",
          },
          {
            value: profile.per100K.toString(),
            label: "Per 100K population",
          },
          {
            value: specialties.length.toString(),
            label: "Specialties",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-5 text-center">
            <p className="font-['Geist_Mono',monospace] text-2xl sm:text-3xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* OECD Benchmark Note */}
      {oecd && (
        <div className="bg-[#f8f8f6] border-l-4 border-black/10 py-4 px-6 mb-12">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <strong>Benchmark:</strong> Dubai&apos;s rate of{" "}
            <span className="font-['Geist_Mono',monospace] font-bold text-[#1c1c1c]">
              {profile.per100K}
            </span>{" "}
            {profile.name.toLowerCase()} per 100K compares to the{" "}
            {oecd.label} of{" "}
            <span className="font-['Geist_Mono',monospace] font-bold text-[#1c1c1c]">
              {oecd.per100K}
            </span>{" "}
            per 100K.{" "}
            {profile.per100K < oecd.per100K * 0.7
              ? "This suggests a relative undersupply, though Dubai's population demographics (younger, expatriate-heavy) alter demand patterns."
              : profile.per100K > oecd.per100K * 1.1
                ? "This exceeds the OECD benchmark, reflecting Dubai's position as a regional medical tourism hub."
                : "This is broadly in line with OECD norms, though Dubai's unique demographics affect comparability."}
          </p>
        </div>
      )}

      {/* License Type Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          License Type Breakdown
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          DHA issues two primary license types: <strong>FTL</strong> (Full Trade
          License) for professionals operating under their own license, and{" "}
          <strong>REG</strong> (Registered) for professionals employed under a
          facility&apos;s license. A high FTL rate typically indicates more
          independent practitioners and private practice owners.
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
            {license.ftlPercent}% of {profile.name.toLowerCase()}
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
            {license.regPercent}% of {profile.name.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Specialties Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Specialties in {profile.name}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {profile.specialties.length} specialties ranked by licensed professional
        count. Click a specialty for its full workforce profile.
      </p>
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
                Per 100K
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.specialties.map((spec, i) => {
              const per100K = Math.round(
                (spec.count / DUBAI_POPULATION) * 100000
              );
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
                      {per100K}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top 20 Employers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 20 Employers of {profile.name}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Facilities ranked by number of {profile.name.toLowerCase()} on staff.
        &quot;Total Staff&quot; includes all categories at the facility.
      </p>
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
                {profile.name} Staff
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Total Staff
              </th>
            </tr>
          </thead>
          <tbody>
            {employers.map((emp, i) => (
              <tr
                key={emp.slug}
                className="border-b border-black/[0.06]"
              >
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/employer/${emp.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {emp.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {emp.count.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {emp.totalStaff.toLocaleString()}
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
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {profile.name} mapped to Dubai areas by facility location. Top{" "}
        {Math.min(profile.areaDistribution.length, 3)} areas account for{" "}
        {(() => {
          const total = profile.areaDistribution.reduce(
            (s, a) => s + a.count,
            0
          );
          const top3 = profile.areaDistribution
            .slice(0, 3)
            .reduce((s, a) => s + a.count, 0);
          return total > 0 ? Math.round((top3 / total) * 100) : 0;
        })()}
        % of this workforce.
      </p>
      <div className="mb-12 overflow-x-auto">
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
                % of Category
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.areaDistribution.map((area) => {
              const pct = (
                (area.count / profile.totalCount) *
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

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Related
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <Link
          href={`/professionals/${params.category}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Browse {profile.name} Directory
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            Search individual professionals in this category
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
            Overview of Dubai&apos;s entire healthcare workforce
          </p>
        </Link>
        {otherCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/workforce/category/${cat.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              {cat.name} Workforce
            </h3>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
              {cat.count.toLocaleString()} licensed professionals
            </p>
          </Link>
        ))}
      </div>

      {/* DHA Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Population estimate: {DUBAI_POPULATION.toLocaleString()} (Dubai
          Statistics Center). This page presents labor market analysis for
          informational purposes only and does not constitute recruitment or
          medical advice. Verify professional credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
