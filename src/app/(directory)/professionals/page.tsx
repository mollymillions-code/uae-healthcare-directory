import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAggregateStats } from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Dubai Healthcare Professional Directory — 99,520 DHA-Licensed Professionals | Zavis",
    description:
      "Search 99,520 DHA-licensed healthcare professionals in Dubai. Physicians, dentists, nurses, and allied health workers sourced from the official Sheryan Medical Registry. Find any licensed doctor, specialist, or healthcare worker by name, specialty, or facility.",
    alternates: { canonical: `${base}/professionals` },
    openGraph: {
      title: "Dubai Healthcare Professional Directory — 99,520 DHA-Licensed Professionals",
      description:
        "The largest publicly searchable directory of DHA-licensed healthcare professionals in Dubai. 24,186 physicians, 7,713 dentists, 34,733 nurses, and 32,888 allied health professionals.",
      url: `${base}/professionals`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function ProfessionalsPage() {
  const base = getBaseUrl();
  const stats = getAggregateStats();
  const topSpecialties = stats.topSpecialties.slice(0, 20);
  const topFacilities = stats.topFacilities.slice(0, 10);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Directory", url: `${base}/directory` },
          { name: "Healthcare Professionals" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Dubai Healthcare Professional Directory",
          description: `Search ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals in Dubai.`,
          url: `${base}/professionals`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PROFESSIONAL_STATS.total,
            itemListElement: PROFESSIONAL_CATEGORIES.map((cat, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: cat.name,
                url: `${base}/professionals/${cat.slug}`,
              },
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Healthcare Professionals" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Dubai Healthcare Professional Directory
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {PROFESSIONAL_STATS.total.toLocaleString()} DHA-Licensed Professionals
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            This is the largest publicly searchable directory of DHA-licensed healthcare
            professionals in Dubai, sourced from the official Sheryan Medical Registry.
            It covers {PROFESSIONAL_STATS.physicians.toLocaleString()} physicians,{" "}
            {PROFESSIONAL_STATS.dentists.toLocaleString()} dentists,{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives, and{" "}
            {PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals
            across {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} healthcare facilities.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: PROFESSIONAL_STATS.total.toLocaleString(), label: "Licensed professionals" },
            { value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString(), label: "Healthcare facilities" },
            { value: ALL_SPECIALTIES.length.toString(), label: "Specialties tracked" },
            { value: "4", label: "Professional categories" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Browse by Category
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/professionals/${cat.slug}`}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {cat.name}
            </h3>
            <p className="text-sm font-bold text-[#006828] mb-2">
              {cat.count.toLocaleString()} professionals
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed line-clamp-2">
              {cat.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Specialties
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {topSpecialties.map((spec) => {
          const full = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
          const categorySlug = full?.category || "physicians";
          return (
            <Link
              key={spec.slug}
              href={`/professionals/${categorySlug}/${spec.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {spec.name}
              </h3>
              <p className="text-[11px] text-black/40">
                {spec.count.toLocaleString()} professionals
              </p>
            </Link>
          );
        })}
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Largest Healthcare Facilities by Staff
        </h2>
      </div>
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-light-200">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Facility</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">Staff</th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-light-200">
                <td className="py-3 pr-4">
                  <Link
                    href={`/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {i + 1}. {fac.name}
                  </Link>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-bold text-[#006828]">
                    {fac.staff.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AEO Answer Block */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          How Many Healthcare Professionals Are There in Dubai?
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          As of {PROFESSIONAL_STATS.scraped}, there are{" "}
          <strong>{PROFESSIONAL_STATS.total.toLocaleString()}</strong> DHA-licensed healthcare
          professionals practicing in Dubai, according to the official Sheryan Medical Registry
          maintained by the Dubai Health Authority. This includes{" "}
          {PROFESSIONAL_STATS.physicians.toLocaleString()} physicians and doctors,{" "}
          {PROFESSIONAL_STATS.dentists.toLocaleString()} dentists,{" "}
          {PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives, and{" "}
          {PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals
          (pharmacists, physiotherapists, lab technologists, optometrists, and others). These
          professionals work across {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}{" "}
          healthcare facilities, from large hospitals like Rashid Hospital (
          {PROFESSIONAL_STATS.topFacilities[0].staff.toLocaleString()} staff) and Dubai Hospital (
          {PROFESSIONAL_STATS.topFacilities[1].staff.toLocaleString()} staff) to small
          neighborhood clinics and pharmacies.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical Professional
          Registry. Data scraped {PROFESSIONAL_STATS.scraped}. This directory is for
          informational purposes only and does not constitute medical advice. Verify
          professional credentials directly with DHA before making healthcare decisions.
        </p>
      </div>
    </div>
  );
}
