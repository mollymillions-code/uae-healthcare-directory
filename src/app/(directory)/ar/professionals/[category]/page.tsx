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
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

const CATEGORY_DESCRIPTIONS_AR: Record<string, string> = {
  physicians: "الأطباء المرخّصون بما في ذلك الممارسون العامون والأخصائيون والاستشاريون في جميع التخصصات الطبية في دبي.",
  dentists: "أخصائيو طب الأسنان المرخّصون بما في ذلك أطباء الأسنان العامون وأخصائيو التقويم وجراحو الفم في دبي.",
  nurses: "الممرضون والممرضات المسجّلون والمساعدون والقابلات المرخّصون من هيئة صحة دبي.",
  "allied-health": "الصيادلة وأخصائيو العلاج الطبيعي وتقنيو المختبرات وأخصائيو البصريات والمهنيون الصحيون المساندون الآخرون في دبي.",
};

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
    title: `${cat.nameAr} في دبي — ${cat.count.toLocaleString("ar-AE")} كادر مرخّص من هيئة صحة دبي`,
    description: `تصفح ${cat.count.toLocaleString("ar-AE")} من ${cat.nameAr} المرخّصين من هيئة صحة دبي. البيانات مصدرها السجل الطبي الرسمي شريان.`,
    alternates: {
      canonical: `${base}/ar/professionals/${cat.slug}`,
      languages: {
        "en-AE": `${base}/professionals/${cat.slug}`,
        "ar-AE": `${base}/ar/professionals/${cat.slug}`,
      },
    },
    openGraph: {
      title: `${cat.nameAr} في دبي — ${cat.count.toLocaleString("ar-AE")} كادر مرخّص من هيئة صحة دبي`,
      description: `${cat.count.toLocaleString("ar-AE")} من ${cat.nameAr} يمارسون مهنهم في دبي، مصدرهم سجل هيئة صحة دبي شريان.`,
      url: `${base}/ar/professionals/${cat.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArabicCategoryPage({ params }: Props) {
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
    <div
      dir="rtl"
      lang="ar"
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${cat.nameAr} في دبي`,
          description: `${cat.count.toLocaleString("ar-AE")} من ${cat.nameAr} المرخّصين من هيئة صحة دبي.`,
          url: `${base}/ar/professionals/${cat.slug}`,
          inLanguage: "ar",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: cat.count,
            itemListElement: specialties.slice(0, 20).map((spec, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: spec.nameAr,
                url: `${base}/ar/professionals/${cat.slug}/${spec.slug}`,
              },
            })),
          },
        }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/` },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر الصحية", url: `${base}/ar/professionals` },
          { name: cat.nameAr },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: cat.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {cat.nameAr} في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {cat.count.toLocaleString("ar-AE")} {ar.professionals.subtitle}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {CATEGORY_DESCRIPTIONS_AR[cat.slug] || cat.description} البيانات مصدرها السجل الطبي المهني لهيئة الصحة بدبي، ويشمل{" "}
            {specialties.length} تخصصاً متابَعاً عبر{" "}
            {Object.keys(facCounts).length.toLocaleString("ar-AE")} منشأة صحية.
          </p>
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.specialties}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {specialties
          .sort((a, b) => b.count - a.count)
          .map((spec) => (
            <Link
              key={spec.slug}
              href={`/ar/professionals/${cat.slug}/${spec.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {spec.nameAr}
              </h3>
              <p className="text-[11px] text-black/40">
                {spec.count.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
              </p>
            </Link>
          ))}
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز المنشآت لـ {cat.nameAr}
        </h2>
      </div>
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                المنشأة
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
              >
                {cat.nameAr}
              </th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
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

      {/* A-Z Professional Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {cat.nameAr} — {ar.professionals.aToZDirectory}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {ar.professionals.showing}{" "}
        {displayLimit < professionals.length
          ? `أول ${displayLimit} ${ar.professionals.of} `
          : ""}
        {professionals.length.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}{" "}
        {ar.professionals.sortedAlphabetically}.
      </p>
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                {ar.professionals.name}
              </th>
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell"
              >
                {ar.professionals.specialty}
              </th>
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
              >
                {ar.professionals.facility}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayProfessionals
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((pro) => (
                <tr key={pro.id} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                      {pro.name}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 hidden sm:table-cell">
                    <span className="text-xs text-black/40">
                      {pro.specialty || cat.nameAr}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-xs text-black/40">
                      {pro.facilityName || "—"}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {professionals.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          عرض جميع {professionals.length.toLocaleString("ar-AE")} من {cat.nameAr} — القوائم
          الكاملة متاحة حسب التخصص أعلاه.
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
