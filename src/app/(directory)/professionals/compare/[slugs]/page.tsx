import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSpecialtyStats, getSpecialtiesWithBothLevels } from "@/lib/professionals";
import {
  PHYSICIAN_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  // Top 15 physician specialties by count, generate all unique pairs
  const top15 = [...PHYSICIAN_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const params: { slugs: string }[] = [];
  for (let i = 0; i < top15.length; i++) {
    for (let j = i + 1; j < top15.length; j++) {
      params.push({ slugs: `${top15[i].slug}-vs-${top15[j].slug}` });
    }
  }
  return params;
}

function parseSlugs(slugs: string): { slugA: string; slugB: string } | null {
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) return null;
  return { slugA: parts[0], slugB: parts[1] };
}

export function generateMetadata({ params }: Props): Metadata {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) return {};

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) return {};

  const base = getBaseUrl();
  return {
    title: `${specA.name} vs ${specB.name} in Dubai — Side-by-Side Comparison`,
    description: `Compare ${specA.name} (${specA.count.toLocaleString()} professionals) and ${specB.name} (${specB.count.toLocaleString()} professionals) in Dubai. Side-by-side analysis of workforce size, license types, top facilities, and seniority levels. Sourced from DHA Sheryan Registry.`,
    alternates: { canonical: `${base}/professionals/compare/${params.slugs}` },
    openGraph: {
      title: `${specA.name} vs ${specB.name} in Dubai — Side-by-Side Comparison`,
      description: `Compare ${specA.count.toLocaleString()} ${specA.name.toLowerCase()} professionals with ${specB.count.toLocaleString()} ${specB.name.toLowerCase()} professionals in Dubai.`,
      url: `${base}/professionals/compare/${params.slugs}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CompareSpecialtiesPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) notFound();

  const base = getBaseUrl();
  const statsA = getSpecialtyStats(parsed.slugA);
  const statsB = getSpecialtyStats(parsed.slugB);

  // Get specialist/consultant data
  const bothLevels = getSpecialtiesWithBothLevels();
  const levelsA = bothLevels.find((s) => s.slug === parsed.slugA);
  const levelsB = bothLevels.find((s) => s.slug === parsed.slugB);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          { name: "Compare" },
          { name: `${specA.name} vs ${specB.name}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${specA.name} vs ${specB.name} in Dubai`,
          description: `Side-by-side comparison of ${specA.name} and ${specB.name} specialties in Dubai.`,
          url: `${base}/professionals/compare/${params.slugs}`,
          about: [
            { "@type": "MedicalSpecialty", name: specA.name },
            { "@type": "MedicalSpecialty", name: specB.name },
          ],
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: "Compare" },
          { label: `${specA.name} vs ${specB.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {specA.name} vs. {specB.name} in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Side-by-Side Specialty Comparison
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            A data-driven comparison of{" "}
            <strong>{specA.name}</strong> ({statsA.totalProfessionals.toLocaleString()} professionals)
            and <strong>{specB.name}</strong> ({statsB.totalProfessionals.toLocaleString()} professionals)
            in Dubai&apos;s healthcare system. All data sourced from the DHA Sheryan
            Medical Professional Registry.
          </p>
        </div>
      </div>

      {/* Side-by-Side Stats */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          At a Glance
        </h2>
      </div>
      <div className="overflow-x-auto mb-12">
      <div className="grid grid-cols-3 gap-0 border border-black/[0.06] min-w-[480px]">
        {/* Header Row */}
        <div className="p-4 bg-[#f8f8f6] border-b border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40 font-medium">
            Metric
          </span>
        </div>
        <div className="p-4 bg-[#f8f8f6] border-b border-r border-black/[0.06] text-center">
          <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
            {specA.name}
          </span>
        </div>
        <div className="p-4 bg-[#f8f8f6] border-b border-black/[0.06] text-center">
          <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
            {specB.name}
          </span>
        </div>

        {/* Total Professionals */}
        <div className="p-4 border-b border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">
            Total Professionals
          </span>
        </div>
        <div className="p-4 border-b border-r border-black/[0.06] text-center">
          <span className="text-xl font-bold text-[#006828]">
            {statsA.totalProfessionals.toLocaleString()}
          </span>
        </div>
        <div className="p-4 border-b border-black/[0.06] text-center">
          <span className="text-xl font-bold text-[#006828]">
            {statsB.totalProfessionals.toLocaleString()}
          </span>
        </div>

        {/* FTL Count */}
        <div className="p-4 border-b border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">
            FTL (Full Trade License)
          </span>
        </div>
        <div className="p-4 border-b border-r border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {statsA.ftlCount.toLocaleString()}
          </span>
          <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 ml-1">
            ({statsA.totalProfessionals > 0 ? ((statsA.ftlCount / statsA.totalProfessionals) * 100).toFixed(0) : 0}%)
          </span>
        </div>
        <div className="p-4 border-b border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {statsB.ftlCount.toLocaleString()}
          </span>
          <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 ml-1">
            ({statsB.totalProfessionals > 0 ? ((statsB.ftlCount / statsB.totalProfessionals) * 100).toFixed(0) : 0}%)
          </span>
        </div>

        {/* REG Count */}
        <div className="p-4 border-b border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">
            REG (Registered)
          </span>
        </div>
        <div className="p-4 border-b border-r border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {statsA.regCount.toLocaleString()}
          </span>
          <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 ml-1">
            ({statsA.totalProfessionals > 0 ? ((statsA.regCount / statsA.totalProfessionals) * 100).toFixed(0) : 0}%)
          </span>
        </div>
        <div className="p-4 border-b border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {statsB.regCount.toLocaleString()}
          </span>
          <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 ml-1">
            ({statsB.totalProfessionals > 0 ? ((statsB.regCount / statsB.totalProfessionals) * 100).toFixed(0) : 0}%)
          </span>
        </div>

        {/* Facilities */}
        <div className="p-4 border-b border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">
            Facilities
          </span>
        </div>
        <div className="p-4 border-b border-r border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {statsA.totalFacilities.toLocaleString()}
          </span>
        </div>
        <div className="p-4 border-b border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {statsB.totalFacilities.toLocaleString()}
          </span>
        </div>

        {/* Specialist Count */}
        <div className="p-4 border-b border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">
            Specialists
          </span>
        </div>
        <div className="p-4 border-b border-r border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {levelsA ? levelsA.specialists.toLocaleString() : "N/A"}
          </span>
        </div>
        <div className="p-4 border-b border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {levelsB ? levelsB.specialists.toLocaleString() : "N/A"}
          </span>
        </div>

        {/* Consultant Count */}
        <div className="p-4 border-r border-black/[0.06]">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">
            Consultants
          </span>
        </div>
        <div className="p-4 border-r border-black/[0.06] text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {levelsA ? levelsA.consultants.toLocaleString() : "N/A"}
          </span>
        </div>
        <div className="p-4 text-center">
          <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
            {levelsB ? levelsB.consultants.toLocaleString() : "N/A"}
          </span>
        </div>
      </div>
      </div>

      {/* Top Facilities Comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Facilities by Specialty
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        {/* Specialty A Facilities */}
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            Top Facilities for {specA.name}
          </h3>
          <div className="space-y-0">
            {statsA.topFacilities.slice(0, 5).map((fac, i) => (
              <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
                <Link
                  href={`/professionals/facility/${fac.slug}`}
                  className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
                >
                  {i + 1}. {fac.name}
                </Link>
                <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">
                  {fac.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialty B Facilities */}
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            Top Facilities for {specB.name}
          </h3>
          <div className="space-y-0">
            {statsB.topFacilities.slice(0, 5).map((fac, i) => (
              <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
                <Link
                  href={`/professionals/facility/${fac.slug}`}
                  className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
                >
                  {i + 1}. {fac.name}
                </Link>
                <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">
                  {fac.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* When to See Each Specialty */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Which Specialty Should You See?
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <div className="border border-black/[0.06] p-6">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#006828] tracking-tight mb-3">
            When to see a {specA.name.toLowerCase().replace(/&/g, "and")} specialist
          </h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            {specA.name} specialists focus on conditions related to their area of
            expertise. You would typically be referred by your GP or seek a{" "}
            {specA.name.toLowerCase()} consultation when symptoms are specific to this
            field.
          </p>
          {specA.searchTerms.length > 0 && (
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              <span className="font-medium">Common searches:</span>{" "}
              {specA.searchTerms.join(", ")}
            </p>
          )}
        </div>
        <div className="border border-black/[0.06] p-6">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#006828] tracking-tight mb-3">
            When to see a {specB.name.toLowerCase().replace(/&/g, "and")} specialist
          </h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            {specB.name} specialists focus on conditions related to their area of
            expertise. You would typically be referred by your GP or seek a{" "}
            {specB.name.toLowerCase()} consultation when symptoms are specific to this
            field.
          </p>
          {specB.searchTerms.length > 0 && (
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              <span className="font-medium">Common searches:</span>{" "}
              {specB.searchTerms.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Explore Each Specialty
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {specA.name}
          </h3>
          <div className="space-y-2">
            <Link
              href={`/professionals/${specA.category}/${specA.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Full {specA.name} directory ({statsA.totalProfessionals.toLocaleString()} professionals) &rarr;
            </Link>
            <Link
              href={`/best/doctors/${specA.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Best {specA.name.toLowerCase()} doctors in Dubai &rarr;
            </Link>
          </div>
        </div>
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {specB.name}
          </h3>
          <div className="space-y-2">
            <Link
              href={`/professionals/${specB.category}/${specB.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Full {specB.name} directory ({statsB.totalProfessionals.toLocaleString()} professionals) &rarr;
            </Link>
            <Link
              href={`/best/doctors/${specB.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Best {specB.name.toLowerCase()} doctors in Dubai &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. This
          comparison is for informational purposes only and does not constitute
          medical advice. Consult your GP for referrals to the appropriate
          specialist. Verify professional credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
