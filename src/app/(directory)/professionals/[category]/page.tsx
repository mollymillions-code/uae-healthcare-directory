import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProfessionalsByCategory } from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  getSpecialtiesByCategory,
  getCategoryBySlug,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string };
}

export function generateStaticParams() {
  return PROFESSIONAL_CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return {};
  const base = getBaseUrl();
  return {
    title: `${cat.name} in Dubai — ${cat.count.toLocaleString()} DHA-Licensed Professionals | Zavis`,
    description: `Browse ${cat.count.toLocaleString()} DHA-licensed ${cat.name.toLowerCase()} in Dubai. ${cat.description} Sourced from the official Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/professionals/${cat.slug}` },
    openGraph: {
      title: `${cat.name} in Dubai — ${cat.count.toLocaleString()} DHA-Licensed Professionals`,
      description: `${cat.count.toLocaleString()} licensed ${cat.name.toLowerCase()} practicing in Dubai, sourced from the DHA Sheryan Registry.`,
      url: `${base}/professionals/${cat.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CategoryPage({ params }: Props) {
  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const specialties = getSpecialtiesByCategory(cat.slug);
  const professionals = getProfessionalsByCategory(cat.slug);
  const displayLimit = 100;
  const displayProfessionals = professionals.slice(0, displayLimit);

  // Compute top facilities for this category
  const facCounts: Record<string, { name: string; count: number }> = {};
  for (const p of professionals) {
    if (p.facilityName) {
      if (!facCounts[p.facilitySlug]) {
        facCounts[p.facilitySlug] = { name: p.facilityName, count: 0 };
      }
      facCounts[p.facilitySlug].count++;
    }
  }
  const topFacilities = Object.entries(facCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, data]) => ({ slug, ...data }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${cat.name} in Dubai`,
          description: `${cat.count.toLocaleString()} DHA-licensed ${cat.name.toLowerCase()} in Dubai.`,
          url: `${base}/professionals/${cat.slug}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: cat.count,
            itemListElement: specialties.slice(0, 20).map((spec, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: spec.name,
                url: `${base}/professionals/${cat.slug}/${spec.slug}`,
              },
            })),
          },
        }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          { name: cat.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: cat.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {cat.name} in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {cat.count.toLocaleString()} DHA-Licensed Professionals
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {cat.description} This data is sourced from the Dubai Health Authority Sheryan
            Medical Registry and covers {specialties.length} tracked specialties across{" "}
            {Object.keys(facCounts).length.toLocaleString()} healthcare facilities.
          </p>
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Specialties
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {specialties
          .sort((a, b) => b.count - a.count)
          .map((spec) => (
            <Link
              key={spec.slug}
              href={`/professionals/${cat.slug}/${spec.slug}`}
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

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Facilities for {cat.name}
        </h2>
      </div>
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Facility</th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{cat.name}</th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
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
                    {fac.count.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* A-Z Professional Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {cat.name} — A-Z Directory
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing {displayLimit < professionals.length ? `first ${displayLimit} of ` : ""}
        {professionals.length.toLocaleString()} licensed {cat.name.toLowerCase()} in Dubai,
        sorted alphabetically.
      </p>
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Name</th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">Specialty</th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">Facility</th>
            </tr>
          </thead>
          <tbody>
            {displayProfessionals
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((pro) => (
                <tr key={pro.id} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                      {pro.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell">
                    <span className="text-xs text-black/40">{pro.specialty || cat.name}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-xs text-black/40">{pro.facilityName || "—"}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {professionals.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          View all {professionals.length.toLocaleString()} {cat.name.toLowerCase()} — full
          listings available by specialty above.
        </p>
      )}

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical Professional
          Registry. This directory is for informational purposes only. Verify professional
          credentials directly with DHA before making healthcare decisions.
        </p>
      </div>
    </div>
  );
}
