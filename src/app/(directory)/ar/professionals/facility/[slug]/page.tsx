import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacility,
  getFacilityProfile,
  getAllFacilitySlugs,
} from "@/lib/professionals";
import { PROFESSIONAL_CATEGORIES, getSpecialtyBySlug } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllFacilitySlugs(20).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  if (!profile) {
    return {
      title: "الكوادر الصحية في المنشأة",
      description: "استعرض دليل الكوادر الصحية المرخّصة لهذه المنشأة الصحية في دبي.",
    };
  }
  const base = getBaseUrl();
  return {
    title: `الكوادر الصحية في ${profile.name} — ${profile.totalStaff.toLocaleString("ar-AE")} كادر`,
    description: `استعرض الدليل الكامل لكوادر ${profile.name} في دبي. ${profile.totalStaff.toLocaleString("ar-AE")} كادر صحي مرخّص من هيئة الصحة بدبي. مصدره السجل الطبي الرسمي شريان.`,
    alternates: {
      canonical: `${base}/ar/professionals/facility/${profile.slug}`,
      languages: {
        "en-AE": `${base}/professionals/facility/${profile.slug}`,
        "ar-AE": `${base}/ar/professionals/facility/${profile.slug}`,
      },
    },
    openGraph: {
      title: `الكوادر الصحية في ${profile.name}`,
      description: `${profile.totalStaff.toLocaleString("ar-AE")} كادر صحي مرخّص من هيئة الصحة بدبي في ${profile.name}.`,
      url: `${base}/ar/professionals/facility/${profile.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArFacilityStaffPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  const professionals = getProfessionalsByFacility(params.slug);
  const base = getBaseUrl();

  if (!profile || professionals.length === 0) {
    notFound();
  }

  // Category breakdown
  const categoryBreakdown = PROFESSIONAL_CATEGORIES.map((cat) => ({
    name: cat.nameAr || cat.name,
    slug: cat.slug,
    count: profile.categories[cat.slug] || 0,
  })).filter((c) => c.count > 0);

  // Specialties with 3+ professionals
  const qualifyingSpecialties = profile.topSpecialties.filter((s) => s.count >= 3);

  // Staff table — show first 50
  const displayLimit = 50;
  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const displayProfessionals = sortedProfessionals.slice(0, displayLimit);

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر الصحية", url: `${base}/ar/professionals` },
          { name: profile.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: profile.name,
          url: `${base}/ar/professionals/facility/${profile.slug}`,
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: profile.totalStaff,
          },
          description: `${profile.name} يضم ${profile.totalStaff.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً من هيئة الصحة بدبي.`,
          areaServed: {
            "@type": "City",
            name: "Dubai",
            addressCountry: "AE",
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: profile.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {profile.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalStaff.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يضم {profile.name} {profile.totalStaff.toLocaleString("ar-AE")} كادراً صحياً
            مرخّصاً من هيئة الصحة بدبي، يشمل{" "}
            {categoryBreakdown
              .map((c) => `${c.count.toLocaleString("ar-AE")} ${c.name}`)
              .join("، ")}
            {qualifyingSpecialties.length > 0
              ? ` في ${qualifyingSpecialties.length} تخصصاً طبياً`
              : ""}
            . جميع البيانات مصدرها السجل الطبي الرسمي شريان التابع لهيئة الصحة بدبي.
          </p>
        </div>

        {/* Category stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {categoryBreakdown.map(({ name, count }) => (
            <div key={name} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {count.toLocaleString("ar-AE")}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Specialties */}
      {qualifyingSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              التخصصات في {profile.name}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {qualifyingSpecialties.map((spec) => (
              <Link
                key={spec.slug}
                href={`/ar/professionals/facility/${profile.slug}/${spec.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                  {getSpecialtyBySlug(spec.slug)?.nameAr || spec.name}
                </h3>
                <p className="text-[11px] text-black/40">
                  {spec.count.toLocaleString("ar-AE")} كادر
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Full Staff Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.professionals.aToZDirectory}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {ar.professionals.showing}{" "}
        {displayLimit < professionals.length
          ? `أول ${displayLimit} ${ar.professionals.of} `
          : ""}
        {professionals.length.toLocaleString("ar-AE")} كادر مرخّص في {profile.name}
        {" "}({ar.professionals.sortedAlphabetically}).
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                {ar.professionals.name}
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الفئة
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden md:table-cell">
                {ar.professionals.specialty}
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                {ar.professionals.licenseType}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayProfessionals.map((pro) => (
              <tr key={pro.id} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {pro.name}
                  </span>
                </td>
                <td className="py-2.5 pl-4 hidden sm:table-cell">
                  <span className="text-xs text-black/40">{pro.category}</span>
                </td>
                <td className="py-2.5 pl-4 hidden md:table-cell">
                  <span className="text-xs text-black/40">
                    {pro.specialty || "—"}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {professionals.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          {ar.professionals.showing} {displayLimit} {ar.professionals.of}{" "}
          {professionals.length.toLocaleString("ar-AE")} كادر. تصفح حسب التخصص أعلاه لعرض القائمة الكاملة.
        </p>
      )}

      {/* Cross-link to English version */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/professionals/facility/${profile.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View in English &rarr;
        </Link>
        <Link
          href={`/ar/directory/dubai?q=${encodeURIComponent(profile.name)}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          استعرض {profile.name} في دليل المنشآت &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> {ar.professionals.disclaimer}
        </p>
      </div>
    </div>
  );
}
