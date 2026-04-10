import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByArea,
  getAreaStats,
  DUBAI_AREAS,
} from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
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
  if (!areaInfo) {
    return {
      title: "Healthcare Professionals by Area",
      description:
        "Browse DHA-licensed healthcare professionals by area in Dubai.",
    };
  }
  const professionals = getProfessionalsByArea(params.area);
  const count = professionals.length;
  const base = getBaseUrl();
  return {
    title: `Healthcare Professionals in ${areaInfo.name}, Dubai — ${count.toLocaleString()} Licensed Staff`,
    description: `Browse ${count.toLocaleString()} DHA-licensed healthcare professionals in ${areaInfo.name}, Dubai. Physicians, dentists, nurses, and allied health workers by specialty and facility. Sourced from the official Sheryan Medical Registry.`,
    alternates: {
      canonical: `${base}/professionals/area/${areaInfo.slug}`,
    },
    openGraph: {
      title: `Healthcare Professionals in ${areaInfo.name}, Dubai`,
      description: `${count.toLocaleString()} DHA-licensed professionals practicing in ${areaInfo.name}.`,
      url: `${base}/professionals/area/${areaInfo.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function AreaProfessionalsPage({ params }: Props) {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  if (!areaInfo) notFound();

  const professionals = getProfessionalsByArea(params.area);
  if (professionals.length === 0) notFound();

  const base = getBaseUrl();

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const p of professionals) {
    categoryCounts[p.categorySlug] = (categoryCounts[p.categorySlug] || 0) + 1;
  }
  const categoryBreakdown = PROFESSIONAL_CATEGORIES.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    count: categoryCounts[cat.slug] || 0,
  })).filter((c) => c.count > 0);

  // Specialty breakdown for this area
  const specCounts: Record<string, number> = {};
  for (const p of professionals) {
    if (p.specialtySlug) {
      specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
    }
  }
  const topSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([slug, count]) => {
      const spec = getSpecialtyBySlug(slug);
      return { slug, name: spec?.name || slug, count };
    })
    .filter((s) => s.count >= 3);

  // Staff listing — first 100, sorted alphabetically
  const displayLimit = 100;
  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const displayProfessionals = sortedProfessionals.slice(0, displayLimit);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          { name: areaInfo.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Healthcare Professionals in ${areaInfo.name}, Dubai`,
          description: `${professionals.length.toLocaleString()} DHA-licensed healthcare professionals in ${areaInfo.name}, Dubai.`,
          url: `${base}/professionals/area/${areaInfo.slug}`,
          about: {
            "@type": "Place",
            name: areaInfo.name,
            containedInPlace: {
              "@type": "City",
              name: "Dubai",
              addressCountry: "AE",
            },
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: areaInfo.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Healthcare Professionals in {areaInfo.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {professionals.length.toLocaleString()} DHA-Licensed Staff in{" "}
          {areaInfo.name}, Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {areaInfo.name} is home to{" "}
            {professionals.length.toLocaleString()} DHA-licensed healthcare
            professionals, including{" "}
            {categoryBreakdown
              .map(
                (c) =>
                  `${c.count.toLocaleString()} ${c.name.toLowerCase()}`
              )
              .join(", ")}
            . This area covers{" "}
            {topSpecialties.length > 0
              ? `${topSpecialties.length} medical specialties`
              : "multiple specialties"}
            , with the highest concentration in{" "}
            {topSpecialties.length > 0
              ? topSpecialties
                  .slice(0, 3)
                  .map((s) => s.name.toLowerCase())
                  .join(", ")
              : "general practice"}
            . All data sourced from the official DHA Sheryan Medical Registry.
          </p>
        </div>

        {/* Category stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {categoryBreakdown.map(({ name, count }) => (
            <div key={name} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {count.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Specialties */}
      {topSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top Specialties in {areaInfo.name}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {topSpecialties.map((spec) => (
              <Link
                key={spec.slug}
                href={`/professionals/area/${areaInfo.slug}/${spec.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                  {spec.name}
                </h3>
                <p className="text-[11px] text-black/40">
                  {spec.count.toLocaleString()} professionals
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Staff Listing Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Licensed Staff Directory — A-Z
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing{" "}
        {displayLimit < professionals.length
          ? `first ${displayLimit} of `
          : ""}
        {professionals.length.toLocaleString()} licensed professionals in{" "}
        {areaInfo.name}, sorted alphabetically.
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Name
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Category
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden md:table-cell">
                Specialty
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden lg:table-cell">
                License
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Facility
              </th>
            </tr>
          </thead>
          <tbody>
            {displayProfessionals.map((pro) => (
              <tr key={pro.id} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {pro.name}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden sm:table-cell">
                  <span className="text-xs text-black/40">{pro.category}</span>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-xs text-black/40">
                    {pro.specialty || "--"}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden lg:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
                <td className="py-2.5">
                  {pro.facilitySlug ? (
                    <Link
                      href={`/professionals/facility/${pro.facilitySlug}`}
                      className="text-xs text-black/40 hover:text-[#006828] transition-colors"
                    >
                      {pro.facilityName}
                    </Link>
                  ) : (
                    <span className="text-xs text-black/40">
                      {pro.facilityName || "--"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {professionals.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          Showing {displayLimit} of{" "}
          {professionals.length.toLocaleString()} professionals. Browse by
          specialty above to see the full list for each discipline.
        </p>
      )}

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/directory/dubai/${areaInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View healthcare facilities in {areaInfo.name} &rarr;
        </Link>
        <Link
          href="/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          Back to Professional Directory &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. This directory is for informational purposes
          only. Verify professional credentials directly with DHA before making
          healthcare decisions.
        </p>
      </div>
    </div>
  );
}
