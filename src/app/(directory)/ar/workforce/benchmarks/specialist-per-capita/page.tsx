import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getSpecialistPerCapita,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  DUBAI_POPULATION,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `الأخصائيون لكل 100,000 نسمة في دبي — معدلات الرعاية الصحية للفرد | Zavis`,
    description: `معدلات الأخصائيين للفرد في دبي: كل تخصص طبي مصنّف حسب المهنيين لكل 100,000 نسمة. مقارنة معايير منظمة الصحة العالمية وتحليل الفئات عبر ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مرخص.`,
    alternates: {
      canonical: `${base}/ar/workforce/benchmarks/specialist-per-capita`,
      languages: {
        "en-AE": `${base}/workforce/benchmarks/specialist-per-capita`,
        "ar-AE": `${base}/ar/workforce/benchmarks/specialist-per-capita`,
      },
    },
    openGraph: {
      title: `الأخصائيون لكل 100,000 نسمة في دبي`,
      description: `ما مدى توفر كل تخصص طبي في دبي؟ معدلات للفرد لـ ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مهني.`,
      url: `${base}/ar/workforce/benchmarks/specialist-per-capita`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArSpecialistPerCapitaPage() {
  const base = getBaseUrl();
  const specialties = getSpecialistPerCapita();

  const totalPer100K = Math.round(
    (PROFESSIONAL_STATS.total / DUBAI_POPULATION) * 100000
  );
  const physiciansPer100K = Math.round(
    (PROFESSIONAL_STATS.physicians / DUBAI_POPULATION) * 100000
  );

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأخصائيون لكل 100,000 نسمة — الرعاية الصحية في دبي",
          description: `معدلات الأخصائيين للفرد لـ ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي مرخص في دبي.`,
          url: `${base}/ar/workforce/benchmarks/specialist-per-capita`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.benchmarks, url: `${base}/ar/workforce/benchmarks` },
          { name: ar.workforce.specialistPerCapita },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.benchmarks, href: "/ar/workforce/benchmarks" },
          { label: ar.workforce.specialistPerCapita },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          معيار العرض
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          الأخصائيون لكل 100,000 نسمة — دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {specialties.length.toLocaleString("ar-AE")} تخصصاً مصنّفاً &middot; عدد السكان{" "}
          {DUBAI_POPULATION.toLocaleString("ar-AE")} &middot; البيانات كما في{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تقيس معدلات الأخصائيين للفرد مدى توفر كل تخصص طبي للسكان. يُقسّم هذا التحليل
            عدد المهنيين المرخصين من هيئة الصحة بدبي في كل تخصص على التعداد السكاني المُقدَّر
            لدبي البالغ {DUBAI_POPULATION.toLocaleString("ar-AE")} نسمة للحصول على معدل لكل
            100,000 نسمة. المعدلات المرتفعة تشير إلى وصول أفضل، والمنخفضة قد تشير إلى فجوات
            في القوى العاملة أو تخصصات مركّزة في القطاع الخاص.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: totalPer100K.toLocaleString("ar-AE"),
            label: "إجمالي الكوادر لكل 100K",
          },
          {
            value: physiciansPer100K.toLocaleString("ar-AE"),
            label: "الأطباء لكل 100K",
          },
          { value: "WHO: 230", label: "حد منظمة الصحة العالمية للأطباء" },
          {
            value: specialties.length.toString(),
            label: "تخصصات متابَعة",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* WHO Context */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          السياق العالمي
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          تستخدم قائمة دعم وضمانات القوى العاملة الصحية لمنظمة الصحة العالمية حداً يبلغ 44.5
          عاملاً صحياً لكل 10,000 نسمة، أي ما يعادل نحو 445 لكل 100,000 نسمة. يضع المعدل
          الإجمالي لدبي البالغ {totalPer100K} لكل 100,000 الإمارة فوق هذا الحد بكثير، مما يعكس
          الاستثمار الكبير في البنية التحتية للرعاية الصحية.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "حد منظمة الصحة العالمية", value: "445" },
            { label: "متوسط منظمة OECD", value: "~380" },
            { label: "الإمارات (دبي)", value: totalPer100K.toString() },
            { label: "سنغافورة", value: "~350" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
                {value}
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
                {label} لكل 100K
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع التخصصات — المعدل لكل 100K
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">
                #
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                التخصص
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الفئة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                العدد
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                لكل 100K
              </th>
            </tr>
          </thead>
          <tbody>
            {specialties.map((spec, i) => {
              const cat = PROFESSIONAL_CATEGORIES.find(
                (c) => c.slug === spec.category
              );
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                    {(i + 1).toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/specialty/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {spec.nameAr || spec.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4 text-right hidden sm:table-cell">
                    <span className="font-['Geist',sans-serif] text-xs text-black/40">
                      {cat?.nameAr || cat?.name || spec.category}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {spec.count.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {spec.per100K}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Related Benchmarks */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          معايير أخرى
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/ar/workforce/benchmarks/nurse-to-doctor"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.nurseToDoctorRatio}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            نسب التوظيف على مستوى المنشآت مقارنة بمعايير منظمة الصحة العالمية
          </p>
        </Link>
        <Link
          href="/ar/workforce/benchmarks/staff-per-facility"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.staffPerFacility}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            توزيع أحجام المنشآت وتحليل فئات التوظيف
          </p>
        </Link>
        <Link
          href="/ar/workforce/benchmarks/ftl-rate"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.ftlRate}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            انتشار ترخيص الممارسة المستقلة حسب التخصص والمنطقة
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. التعداد السكاني المُقدَّر:{" "}
          {DUBAI_POPULATION.toLocaleString("ar-AE")} (مركز دبي للإحصاء). التخصصات التي تضم أقل
          من 10 مهنيين مستبعدة. معايير منظمة الصحة العالمية ومنظمة OECD هي متوسطات عالمية
          تقريبية. تحقق من أوراق الاعتماد مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
