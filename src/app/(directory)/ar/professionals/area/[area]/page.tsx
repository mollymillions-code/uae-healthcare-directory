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
import { ar, getArabicAreaName } from "@/lib/i18n";

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
      title: "الكوادر الصحية حسب المنطقة",
      description: "تصفح الكوادر الصحية المرخّصة من هيئة الصحة بدبي حسب المنطقة.",
    };
  }
  const arabicAreaName = getArabicAreaName(params.area);
  const professionals = getProfessionalsByArea(params.area);
  const count = professionals.length;
  const base = getBaseUrl();
  return {
    title: `الكوادر الصحية في ${arabicAreaName}، دبي — ${count.toLocaleString("ar-AE")} كادر مرخّص`,
    description: `تصفح ${count.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً من هيئة الصحة بدبي في ${arabicAreaName}. أطباء وأطباء أسنان وممرضون ومهنيون صحيون مساندون حسب التخصص والمنشأة. مصدره السجل الطبي الرسمي شريان.`,
    alternates: {
      canonical: `${base}/ar/professionals/area/${areaInfo.slug}`,
      languages: {
        "en-AE": `${base}/professionals/area/${areaInfo.slug}`,
        "ar-AE": `${base}/ar/professionals/area/${areaInfo.slug}`,
      },
    },
    openGraph: {
      title: `الكوادر الصحية في ${arabicAreaName}، دبي`,
      description: `${count.toLocaleString("ar-AE")} كادر صحي مرخّص يعمل في ${arabicAreaName}.`,
      url: `${base}/ar/professionals/area/${areaInfo.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArAreaProfessionalsPage({ params }: Props) {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  if (!areaInfo) notFound();

  const arabicAreaName = getArabicAreaName(params.area);
  const professionals = getProfessionalsByArea(params.area);
  if (professionals.length === 0) notFound();

  const base = getBaseUrl();

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const p of professionals) {
    categoryCounts[p.categorySlug] = (categoryCounts[p.categorySlug] || 0) + 1;
  }
  const categoryBreakdown = PROFESSIONAL_CATEGORIES.map((cat) => ({
    name: cat.nameAr || cat.name,
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
      return { slug, name: spec?.nameAr || spec?.name || slug, count };
    })
    .filter((s) => s.count >= 3);

  // Staff listing — first 100, sorted alphabetically
  const displayLimit = 100;
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
          { name: arabicAreaName },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `الكوادر الصحية في ${arabicAreaName}، دبي`,
          description: `${professionals.length.toLocaleString("ar-AE")} كادر صحي مرخّص من هيئة الصحة بدبي في ${arabicAreaName}.`,
          url: `${base}/ar/professionals/area/${areaInfo.slug}`,
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
          { label: "الرئيسية", href: "/" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: arabicAreaName },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          الكوادر الصحية في {arabicAreaName}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {professionals.length.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}{" "}
          في {arabicAreaName}، دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تضم منطقة {arabicAreaName}{" "}
            {professionals.length.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً
            من هيئة الصحة بدبي، يشمل{" "}
            {categoryBreakdown
              .map((c) => `${c.count.toLocaleString("ar-AE")} ${c.name}`)
              .join("، ")}
            {". "}
            تغطي المنطقة{" "}
            {topSpecialties.length > 0
              ? `${topSpecialties.length} تخصصاً طبياً`
              : "تخصصات طبية متعددة"}
            {topSpecialties.length > 0
              ? `، مع أعلى تركيز في تخصصات ${topSpecialties
                  .slice(0, 3)
                  .map((s) => s.name)
                  .join("، ")}`
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
              أبرز التخصصات في {arabicAreaName}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {topSpecialties.map((spec) => (
              <Link
                key={spec.slug}
                href={`/ar/professionals/area/${areaInfo.slug}/${spec.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                  {spec.name}
                </h3>
                <p className="text-[11px] text-black/40">
                  {spec.count.toLocaleString("ar-AE")} كادر
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Staff Listing Table */}
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
        {professionals.length.toLocaleString("ar-AE")} كادر مرخّص في {arabicAreaName}{" "}
        ({ar.professionals.sortedAlphabetically}).
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
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden lg:table-cell">
                {ar.professionals.licenseType}
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                {ar.professionals.facility}
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
                <td className="py-2.5 pl-4 hidden lg:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
                <td className="py-2.5">
                  {pro.facilitySlug ? (
                    <Link
                      href={`/ar/professionals/facility/${pro.facilitySlug}`}
                      className="text-xs text-black/40 hover:text-[#006828] transition-colors"
                    >
                      {pro.facilityName}
                    </Link>
                  ) : (
                    <span className="text-xs text-black/40">
                      {pro.facilityName || "—"}
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
          {ar.professionals.showing} {displayLimit} {ar.professionals.of}{" "}
          {professionals.length.toLocaleString("ar-AE")} كادر. تصفح حسب التخصص أعلاه لعرض القائمة الكاملة.
        </p>
      )}

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/ar/directory/dubai/${areaInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          استعرض المنشآت الصحية في {arabicAreaName} &rarr;
        </Link>
        <Link
          href="/ar/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          العودة إلى دليل الكوادر الصحية &rarr;
        </Link>
        <Link
          href={`/professionals/area/${areaInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View in English &rarr;
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
