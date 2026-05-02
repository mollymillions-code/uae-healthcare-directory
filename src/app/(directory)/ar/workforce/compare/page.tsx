import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  PHYSICIAN_SPECIALTIES,
} from "@/lib/constants/professionals";
import {
  getTopAreas,
  getTopFacilities,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `مقارنة القوى العاملة الصحية في دبي — التخصصات والمناطق وأصحاب العمل`,
    description: `مقارنات جنباً إلى جنب عبر ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي في دبي. قارن التخصصات والمناطق وأصحاب العمل والفئات باستخدام بيانات سجل شريان DHA.`,
    alternates: {
      canonical: `${base}/ar/workforce/compare`,
      languages: {
        "en-AE": `${base}/workforce/compare`,
        "ar-AE": `${base}/ar/workforce/compare`,
      },
    },
    openGraph: {
      title: `مقارنة القوى العاملة الصحية في دبي`,
      description: `مقارنات جنباً إلى جنب عبر ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي في دبي.`,
      url: `${base}/ar/workforce/compare`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCompareHubPage() {
  const base = getBaseUrl();
  const topAreas = getTopAreas(10);
  const topFacilities = getTopFacilities(20);

  const topSpecs = [...PHYSICIAN_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.compare },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.compare },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          مقارنات القوى العاملة
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          تحليل جنباً إلى جنب &middot; {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مرخص من DHA
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            قارن التخصصات والمناطق الجغرافية وأصحاب العمل والفئات المهنية جنباً إلى جنب.
            جميع البيانات مصدرها سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي.
          </p>
        </div>
      </div>

      {/* Specialty Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تخصص مقابل تخصص
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        قارن حجم القوى العاملة ومعدلات الترخيص الدائم ونسب الاستشاريين والتركّز وأكبر
        أصحاب العمل بين أي تخصصين طبيين. 105+ صفحة مقارنة من أكبر 15 تخصص طبي.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {topSpecs.slice(0, 3).map((specA, i) => {
          const specB = topSpecs[i + 3];
          if (!specB) return null;
          return (
            <Link
              key={`${specA.slug}-vs-${specB.slug}`}
              href={`/ar/workforce/compare/specialty/${specA.slug}-vs-${specB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {specA.nameAr} مقابل {specB.nameAr}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {specA.count.toLocaleString("ar-AE")} مقابل {specB.count.toLocaleString("ar-AE")} كادر
              </p>
            </Link>
          );
        })}
      </div>

      {/* Area Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          منطقة مقابل منطقة
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        قارن كثافة القوى العاملة الصحية وتوزيع الفئات وأنواع التراخيص وأكبر المنشآت بين
        مناطق دبي. 45 صفحة مقارنة من أكبر 10 مناطق.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {topAreas.slice(0, 3).map((areaA, i) => {
          const areaB = topAreas[i + 3];
          if (!areaB) return null;
          return (
            <Link
              key={`${areaA.slug}-vs-${areaB.slug}`}
              href={`/ar/workforce/compare/area/${areaA.slug}-vs-${areaB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {getArabicAreaName(areaA.slug) || areaA.name} مقابل {getArabicAreaName(areaB.slug) || areaB.name}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {areaA.count.toLocaleString("ar-AE")} مقابل {areaB.count.toLocaleString("ar-AE")} كادر
              </p>
            </Link>
          );
        })}
      </div>

      {/* Employer Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          صاحب عمل مقابل صاحب عمل
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        قارن إجمالي الموظفين ونسب الممرضين إلى الأطباء ومعدلات الترخيص الدائم واتساع
        التخصصات وتوزيع الفئات بين أكبر أصحاب العمل في الرعاية الصحية بدبي. 190 صفحة مقارنة
        من أكبر 20 منشأة.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {topFacilities.slice(0, 3).map((facA, i) => {
          const facB = topFacilities[i + 3];
          if (!facB) return null;
          return (
            <Link
              key={`${facA.slug}-vs-${facB.slug}`}
              href={`/ar/workforce/compare/employer/${facA.slug}-vs-${facB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {facA.name} مقابل {facB.name}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {facA.totalStaff.toLocaleString("ar-AE")} مقابل {facB.totalStaff.toLocaleString("ar-AE")} موظف
              </p>
            </Link>
          );
        })}
      </div>

      {/* Category Comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          فئة مقابل فئة
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        قارن ملفات القوى العاملة بين الفئات المهنية الأربع لهيئة الصحة بدبي: الأطباء
        وأطباء الأسنان والممرضون والمهنيون الصحيون المساندون.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {PROFESSIONAL_CATEGORIES.slice(0, 2).map((catA, i) => {
          const catB = PROFESSIONAL_CATEGORIES[i + 2];
          if (!catB) return null;
          return (
            <Link
              key={`${catA.slug}-vs-${catB.slug}`}
              href={`/ar/workforce/compare/category/${catA.slug}-vs-${catB.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {catA.nameAr} مقابل {catB.nameAr}
              </h3>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {catA.count.toLocaleString("ar-AE")} مقابل {catB.count.toLocaleString("ar-AE")} كادر
              </p>
            </Link>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. جميع المقارنات لأغراض معلوماتية
          فقط ولا تُعدّ نصيحة طبية أو وظيفية.
        </p>
      </div>
    </div>
  );
}
