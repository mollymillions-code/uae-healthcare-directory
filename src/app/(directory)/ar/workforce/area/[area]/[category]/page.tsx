import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import {
  getProfessionalsByAreaAndCategory,
  getAreaStats,
} from "@/lib/workforce";
import { DUBAI_AREAS } from "@/lib/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { area: string; category: string };
}

export function generateStaticParams() {
  const areas = getAreaStats().filter((a) => a.count >= 10);
  const params: { area: string; category: string }[] = [];
  for (const area of areas) {
    for (const cat of PROFESSIONAL_CATEGORIES) {
      const pros = getProfessionalsByAreaAndCategory(area.slug, cat.slug);
      if (pros.length >= 10) {
        params.push({ area: area.slug, category: cat.slug });
      }
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!areaInfo || !catInfo) return {};

  const pros = getProfessionalsByAreaAndCategory(params.area, params.category);
  const base = getBaseUrl();
  const arabicAreaName = getArabicAreaName(params.area) || areaInfo.name;

  return {
    title: `${catInfo.nameAr} في ${arabicAreaName}، دبي — ${pros.length.toLocaleString("ar-AE")} مهنياً`,
    description: `${pros.length.toLocaleString("ar-AE")} من ${catInfo.nameAr} المرخّصين من هيئة الصحة بدبي في ${arabicAreaName}. تحليل القوى العاملة يشمل توزيع التخصصات وأبرز المنشآت وتوزيع التراخيص.`,
    alternates: {
      canonical: `${base}/ar/workforce/area/${areaInfo.slug}/${catInfo.slug}`,
      languages: {
        "en-AE": `${base}/workforce/area/${areaInfo.slug}/${catInfo.slug}`,
        "ar-AE": `${base}/ar/workforce/area/${areaInfo.slug}/${catInfo.slug}`,
      },
    },
    openGraph: {
      title: `${catInfo.nameAr} في ${arabicAreaName}، دبي`,
      description: `${pros.length.toLocaleString("ar-AE")} من ${catInfo.nameAr} يمارسون مهنتهم في ${arabicAreaName}.`,
      url: `${base}/ar/workforce/area/${areaInfo.slug}/${catInfo.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArAreaCategoryPage({ params }: Props) {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!areaInfo || !catInfo) notFound();

  const pros = getProfessionalsByAreaAndCategory(params.area, params.category);
  if (pros.length === 0) notFound();

  const base = getBaseUrl();
  const arabicAreaName = getArabicAreaName(params.area) || areaInfo.name;

  // توزيع التخصصات
  const specCounts: Record<string, number> = {};
  for (const p of pros) {
    if (p.specialtySlug)
      specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
  }
  const topSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([slug, count]) => {
      const spec = getSpecialtyBySlug(slug);
      return { slug, name: spec?.nameAr || spec?.name || slug, count };
    });

  // توزيع المنشآت
  const facCounts: Record<string, { name: string; count: number }> = {};
  for (const p of pros) {
    if (!p.facilitySlug) continue;
    if (!facCounts[p.facilitySlug])
      facCounts[p.facilitySlug] = { name: p.facilityName, count: 0 };
    facCounts[p.facilitySlug].count++;
  }
  const topFacilities = Object.entries(facCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, { name, count }]) => ({ slug, name, count }));

  // الترخيص
  const ftl = pros.filter((p) => p.licenseType === "FTL").length;
  const ftlPct = pros.length > 0 ? Math.round((ftl / pros.length) * 100) : 0;

  return (
    <div
      dir="rtl"
      lang="ar"
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          {
            name: arabicAreaName,
            url: `${base}/ar/workforce/area/${areaInfo.slug}`,
          },
          { name: catInfo.nameAr },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          {
            label: arabicAreaName,
            href: `/ar/workforce/area/${areaInfo.slug}`,
          },
          { label: catInfo.nameAr },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {catInfo.nameAr} في {arabicAreaName}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {pros.length.toLocaleString("ar-AE")} مهنياً مرخّصاً من هيئة الصحة بدبي
          &middot; {arabicAreaName}، دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يوجد {pros.length.toLocaleString("ar-AE")} من {catInfo.nameAr}{" "}
            المرخّصين من هيئة الصحة بدبي يمارسون مهنتهم في {arabicAreaName}.
            {topSpecialties.length > 0 && (
              <>
                {" "}أكثر التخصصات شيوعاً هي:{" "}
                {topSpecialties
                  .slice(0, 3)
                  .map((s) => s.name)
                  .join("، ")}.
              </>
            )}
            {" "}معدل الترخيص الدائم {ftlPct}%.
          </p>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {pros.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            إجمالي {catInfo.nameAr}
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {topSpecialties.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">التخصصات</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{ftlPct}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">معدل الترخيص الدائم</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {topFacilities.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">المنشآت</p>
        </div>
      </div>

      {/* التخصصات */}
      {topSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              التخصصات
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4">
                    التخصص
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4">
                    العدد
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {topSpecialties.map((spec) => (
                  <tr key={spec.slug} className="border-b border-black/[0.06]">
                    <td className="py-2.5 pe-4">
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                        {spec.name}
                      </span>
                    </td>
                    <td className="py-2.5 pe-4 text-left">
                      <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                        {spec.count.toLocaleString("ar-AE")}
                      </span>
                    </td>
                    <td className="py-2.5 text-left">
                      <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                        {((spec.count / pros.length) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* أبرز المنشآت */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز المنشآت
        </h2>
      </div>
      <div className="mb-12">
        {topFacilities.map((fac, i) => (
          <div
            key={fac.slug}
            className="flex items-center justify-between py-2.5 border-b border-black/[0.06]"
          >
            <Link
              href={`/ar/professionals/facility/${fac.slug}`}
              className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
            >
              {(i + 1).toLocaleString("ar-AE")}. {fac.name}
            </Link>
            <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ms-2 shrink-0">
              {fac.count.toLocaleString("ar-AE")} من {catInfo.nameAr}
            </span>
          </div>
        ))}
      </div>

      {/* روابط مرتبطة */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/ar/workforce/area/${areaInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          الملف الوظيفي الكامل لـ{arabicAreaName} &larr;
        </Link>
        <Link
          href={`/ar/professionals/${catInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          جميع {catInfo.nameAr} في دبي &larr;
        </Link>
        <Link
          href={`/ar/workforce/career/category/${catInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          نظرة عامة على مسار {catInfo.nameAr} المهني &larr;
        </Link>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. هذه الصفحة
          لأغراض معلوماتية فقط.
        </p>
      </div>
    </div>
  );
}
