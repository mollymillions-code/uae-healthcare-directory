import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import {
  getCategoryWorkforceProfile,
  getTopEmployersByCategory,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string };
}

export function generateStaticParams() {
  return PROFESSIONAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!catInfo) return {};

  const base = getBaseUrl();
  return {
    title: `${catInfo.name} Careers in Dubai — ${catInfo.count.toLocaleString()} Professionals | Zavis`,
    description: `Career overview for ${catInfo.name.toLowerCase()} in Dubai. ${catInfo.count.toLocaleString()} licensed professionals, top specialties, biggest employers, licensing overview, and geographic distribution.`,
    alternates: { canonical: `${base}/workforce/career/category/${catInfo.slug}` },
    openGraph: {
      title: `${catInfo.name} Careers in Dubai`,
      description: `Career intelligence for ${catInfo.count.toLocaleString()} ${catInfo.name.toLowerCase()} in Dubai.`,
      url: `${base}/workforce/career/category/${catInfo.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CareerCategoryPage({ params }: Props) {
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!catInfo) notFound();

  const profile = getCategoryWorkforceProfile(params.category);
  if (!profile) notFound();

  const topEmployers = getTopEmployersByCategory(params.category, 15);
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Careers" },
          { name: catInfo.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Careers" },
          { label: catInfo.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {catInfo.name} Careers in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalCount.toLocaleString()} Licensed Professionals &middot; {profile.percentOfWorkforce}% of Workforce
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {catInfo.description} With {profile.totalCount.toLocaleString()} active
            professionals, {catInfo.name.toLowerCase()} represent{" "}
            {profile.percentOfWorkforce}% of Dubai&apos;s total healthcare
            workforce. The per-capita rate is {profile.per100K} per 100,000 population.
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.totalCount.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Total professionals</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Per 100K population</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.license.ftlPercent}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">FTL rate</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.specialties.length}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Specialties</p>
        </div>
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Specialties
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        The most common specialties within {catInfo.name.toLowerCase()} in Dubai, ranked by active professional count.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">#</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Specialty</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Count</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">%</th>
            </tr>
          </thead>
          <tbody>
            {profile.specialties.slice(0, 15).map((spec, i) => (
              <tr key={spec.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/career/${spec.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {spec.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{spec.count.toLocaleString()}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {((spec.count / profile.totalCount) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Employers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Biggest Employers
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">#</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Facility</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">{catInfo.name}</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">Total Staff</th>
            </tr>
          </thead>
          <tbody>
            {topEmployers.map((emp, i) => (
              <tr key={emp.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/professionals/facility/${emp.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {emp.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{emp.count.toLocaleString()}</span>
                </td>
                <td className="py-2.5 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{emp.totalStaff.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Licensing Overview */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Licensing Overview
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">FTL (Own License)</p>
          <p className="text-2xl font-bold text-[#006828]">{profile.license.ftl.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{profile.license.ftlPercent}%</p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">REG (Facility License)</p>
          <p className="text-2xl font-bold text-[#006828]">{profile.license.reg.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{profile.license.regPercent}%</p>
        </div>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          DHA issues two license types: <strong>FTL</strong> (Full Trade License) for
          independent practitioners, and <strong>REG</strong> (Registered) for those
          working under a facility&apos;s license. Among {catInfo.name.toLowerCase()},{" "}
          {profile.license.ftlPercent}% hold FTL, compared to the overall workforce
          average.
        </p>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Distribution
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {profile.areaDistribution.slice(0, 12).map((area) => (
          <Link
            key={area.slug}
            href={`/workforce/area/${area.slug}/${catInfo.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {area.name}
            </h3>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
              {area.count.toLocaleString()} {catInfo.name.toLowerCase()}
            </p>
          </Link>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/professionals/${catInfo.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Browse all {catInfo.name.toLowerCase()} &rarr;
        </Link>
        <Link href="/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Compare categories &rarr;
        </Link>
        <Link href="/professionals/stats" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Full workforce statistics &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          This career overview is for informational purposes only.
        </p>
      </div>
    </div>
  );
}
