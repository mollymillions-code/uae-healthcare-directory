import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProfessionalsBySpecialty, getSpecialtyStats } from "@/lib/professionals";
import {
  ALL_SPECIALTIES,
  getCategoryBySlug,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string; specialty: string };
}

export function generateStaticParams() {
  return ALL_SPECIALTIES.map((s) => ({
    category: s.category,
    specialty: s.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) return {};
  const base = getBaseUrl();
  const count = spec.count;
  return {
    title: `ابحث عن ${spec.nameAr} في دبي — ${count.toLocaleString("ar-AE")} كادر مرخّص | Zavis`,
    description: `يوجد ${count.toLocaleString("ar-AE")} كادر صحي مرخّص في تخصص ${spec.nameAr} يمارسون في دبي. تصفح القائمة الكاملة مع نوع الترخيص وتفاصيل المنشأة، مصدرها السجل الطبي شريان التابع لهيئة صحة دبي.`,
    alternates: {
      canonical: `${base}/ar/professionals/${params.category}/${spec.slug}`,
      languages: {
        "en-AE": `${base}/professionals/${params.category}/${spec.slug}`,
        "ar-AE": `${base}/ar/professionals/${params.category}/${spec.slug}`,
      },
    },
    openGraph: {
      title: `ابحث عن ${spec.nameAr} في دبي — ${count.toLocaleString("ar-AE")} كادر مرخّص`,
      description: `${count.toLocaleString("ar-AE")} كادر صحي مرخّص في تخصص ${spec.nameAr} في دبي. دليل شامل مصدره هيئة صحة دبي.`,
      url: `${base}/ar/professionals/${params.category}/${spec.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArSpecialtyPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) notFound();

  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const professionals = getProfessionalsBySpecialty(spec.slug);
  const stats = getSpecialtyStats(spec.slug);

  const displayLimit = 200;
  const displayProfessionals = [...professionals]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, displayLimit);

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${spec.nameAr} في دبي`,
          description: `${stats.totalProfessionals.toLocaleString("ar-AE")} كادر صحي مرخّص في تخصص ${spec.nameAr} في دبي.`,
          url: `${base}/ar/professionals/${params.category}/${spec.slug}`,
          mainContentOfPage: {
            "@type": "WebPageElement",
            cssSelector: ".professional-listing",
          },
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
        }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: ar.professionals.title, url: `${base}/ar/professionals` },
          { name: cat.nameAr, url: `${base}/ar/professionals/${cat.slug}` },
          { name: spec.nameAr },
        ])}
      />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: cat.nameAr, href: `/ar/professionals/${cat.slug}` },
          { label: spec.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.nameAr} في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {stats.totalProfessionals.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
        </p>

        {/* Editorial intro */}
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يوجد {stats.totalProfessionals.toLocaleString("ar-AE")} كادر صحي مرخّص في تخصص {spec.nameAr}{" "}
            يمارسون في دبي، موزّعون على {stats.totalFacilities.toLocaleString("ar-AE")}{" "}
            منشأة صحية. من بينهم، {stats.ftlCount.toLocaleString("ar-AE")} يحملون ترخيصاً دائماً
            (FTL) و{stats.regCount.toLocaleString("ar-AE")} مسجّلون (REG). أكبر جهة مُشغِّلة هي{" "}
            {stats.topFacilities[0]?.name || "—"} بواقع {stats.topFacilities[0]?.count.toLocaleString("ar-AE") || "0"}{" "}
            كادر صحي في تخصص {spec.nameAr}. جميع البيانات مصدرها السجل الطبي المهني شريان التابع لهيئة صحة دبي.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { value: stats.totalProfessionals.toLocaleString("ar-AE"), label: "إجمالي الكوادر" },
            { value: stats.totalFacilities.toLocaleString("ar-AE"), label: ar.professionals.healthcareFacilities },
            { value: stats.ftlCount.toLocaleString("ar-AE"), label: "ترخيص دائم" },
            { value: stats.regCount.toLocaleString("ar-AE"), label: "مسجّل" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related directory category */}
      {spec.relatedDirectoryCategory && (
        <div className="mb-10 border border-black/[0.06] p-4">
          <Link
            href={`/ar/directory/dubai/${spec.relatedDirectoryCategory}`}
            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
          >
            {ar.professionals.findClinics} {spec.nameAr} {ar.professionals.inDubai} &larr;
          </Link>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            تصفح منشآت {spec.relatedDirectoryCategory.replace(/-/g, " ")} في دليل الرعاية الصحية المفتوح بالإمارات.
          </p>
        </div>
      )}

      {/* Top Facilities for this Specialty */}
      {stats.topFacilities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أبرز المنشآت لتخصص {spec.nameAr}
            </h2>
          </div>
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">{ar.professionals.facility}</th>
                  <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{spec.nameAr}</th>
                </tr>
              </thead>
              <tbody>
                {stats.topFacilities.map((fac, i) => (
                  <tr key={fac.slug} className="border-b border-black/[0.06]">
                    <td className="py-3 pl-4">
                      <Link
                        href={`/ar/professionals/facility/${fac.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {i + 1}. {fac.name}
                      </Link>
                    </td>
                    <td className="py-3 text-left">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString("ar-AE")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Full Professional Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع كوادر {spec.nameAr}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {ar.professionals.showing}{" "}
        {displayProfessionals.length < professionals.length
          ? `${displayProfessionals.length.toLocaleString("ar-AE")} ${ar.professionals.of} `
          : ""}
        {stats.totalProfessionals.toLocaleString("ar-AE")} كادر مرخّص في {spec.nameAr}، {ar.professionals.sortedAlphabetically}.
      </p>
      <div className="mb-8 professional-listing">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">{ar.professionals.name}</th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">{ar.professionals.licenseType}</th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{ar.professionals.facility}</th>
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
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
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
          {ar.professionals.showing} {displayLimit} {ar.professionals.of} {professionals.length.toLocaleString("ar-AE")} كادر.
          تصفح جميع كوادر {spec.nameAr} حسب المنشأة باستخدام جدول أبرز المنشآت أعلاه.
        </p>
      )}

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>{ar.professionals.source}:</strong> {ar.professionals.disclaimer}
        </p>
      </div>
    </div>
  );
}
