import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import {
  getAreaWorkforceProfile,
  getAreaStats,
} from "@/lib/workforce";
import { DUBAI_AREAS } from "@/lib/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { area: string };
}

export function generateStaticParams() {
  return getAreaStats()
    .filter((a) => a.count >= 10)
    .map((a) => ({ area: a.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  if (!areaInfo) return {};

  const profile = getAreaWorkforceProfile(params.area);
  if (!profile) return {};

  const base = getBaseUrl();
  return {
    title: `${areaInfo.name} Workforce Profile — ${profile.totalCount.toLocaleString()} Professionals`,
    description: `Workforce intelligence for ${areaInfo.name}, Dubai. ${profile.totalCount.toLocaleString()} DHA-licensed professionals, category breakdown, license distribution, top specialties, and employers.`,
    alternates: { canonical: `${base}/workforce/area/${areaInfo.slug}` },
    openGraph: {
      title: `${areaInfo.name} Healthcare Workforce Profile`,
      description: `${profile.totalCount.toLocaleString()} healthcare professionals in ${areaInfo.name}, Dubai.`,
      url: `${base}/workforce/area/${areaInfo.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function AreaWorkforcePage({ params }: Props) {
  const profile = getAreaWorkforceProfile(params.area);
  if (!profile) notFound();

  const base = getBaseUrl();

  // Category data for cross-link filtering
  const categoriesWithEnough = profile.categories.filter((c) => c.count >= 10);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Areas", url: `${base}/workforce/areas` },
          { name: profile.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Areas" },
          { label: profile.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {profile.name} — Workforce Profile
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalCount.toLocaleString()} DHA-Licensed Professionals &middot; {profile.per100K} per 100K
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {profile.name} employs {profile.totalCount.toLocaleString()} DHA-licensed healthcare
            professionals, representing approximately{" "}
            {((profile.totalCount / PROFESSIONAL_STATS.total) * 100).toFixed(1)}% of
            Dubai&apos;s total healthcare workforce. The area has a per-capita density
            of {profile.per100K} professionals per 100,000 residents.
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
          <p className="font-['Geist',sans-serif] text-xs text-black/40">FTL license rate</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.topFacilities.length}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Active facilities</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Category Breakdown
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {profile.categories.map((cat) => {
          const pct = ((cat.count / profile.totalCount) * 100).toFixed(1);
          return (
            <div key={cat.slug} className="border border-black/[0.06] p-4">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
                {cat.name}
              </h3>
              <p className="text-xl font-bold text-[#006828] mb-1">
                {cat.count.toLocaleString()}
              </p>
              <div className="w-full bg-black/[0.04] h-1.5 mb-1">
                <div className="bg-[#006828] h-1.5" style={{ width: `${pct}%` }} />
              </div>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">{pct}% of area workforce</p>
            </div>
          );
        })}
      </div>

      {/* License Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          License Distribution
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">FTL (Full Trade License)</p>
          <p className="text-2xl font-bold text-[#006828]">{profile.license.ftl.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{profile.license.ftlPercent}% of area workforce</p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">REG (Registered)</p>
          <p className="text-2xl font-bold text-[#006828]">{profile.license.reg.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{profile.license.regPercent}% of area workforce</p>
        </div>
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Specialties
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">#</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Specialty</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Count</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">% of Area</th>
            </tr>
          </thead>
          <tbody>
            {profile.topSpecialties.map((spec, i) => (
              <tr key={spec.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/professionals/area/${profile.slug}/${spec.slug}`}
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

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Facilities in {profile.name}
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">#</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Facility</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">Staff</th>
            </tr>
          </thead>
          <tbody>
            {profile.topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{fac.count.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explore by Category */}
      {categoriesWithEnough.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Explore by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
            {categoriesWithEnough.map((cat) => (
              <Link
                key={cat.slug}
                href={`/workforce/area/${profile.slug}/${cat.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-black/40">{cat.count.toLocaleString()} professionals</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/professionals/area/${profile.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Browse all professionals in {profile.name} &rarr;
        </Link>
        <Link href={`/directory/dubai/${profile.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Healthcare facilities in {profile.name} &rarr;
        </Link>
        <Link href="/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Compare areas &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          This page is for informational purposes only. Verify credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
