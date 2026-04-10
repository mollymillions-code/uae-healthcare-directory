import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PHYSICIAN_SPECIALTIES,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import {
  getSpecialtySupplyMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

function getSupplyAssessment(per100K: number): { label: string; labelAr: string; color: string } {
  if (per100K >= 15) return { label: "Abundant", labelAr: "وفير", color: "text-[#006828]" };
  if (per100K >= 5) return { label: "Adequate", labelAr: "كافٍ", color: "text-[#006828]/70" };
  if (per100K >= 2) return { label: "Moderate", labelAr: "متوسط", color: "text-amber-600" };
  return { label: "Limited", labelAr: "محدود", color: "text-red-600" };
}

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `تحليل عرض الرعاية الصحية في دبي — تقرير كفاءة التخصصات`,
    description: `تحليل عرض التخصصات في القوى العاملة الصحية بدبي. المعدلات للفرد والتغطية الجغرافية وتركّز أصحاب العمل وفجوات العرض عبر ${PHYSICIAN_SPECIALTIES.length} تخصص طبي. مصدره سجل شريان DHA.`,
    alternates: {
      canonical: `${base}/ar/workforce/supply`,
      languages: {
        "en-AE": `${base}/workforce/supply`,
        "ar-AE": `${base}/ar/workforce/supply`,
      },
    },
    openGraph: {
      title: `تحليل عرض الرعاية الصحية في دبي`,
      description: `كفاءة عرض التخصصات عبر ${PHYSICIAN_SPECIALTIES.length} تخصص طبي في دبي.`,
      url: `${base}/ar/workforce/supply`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArSupplyHubPage() {
  const base = getBaseUrl();

  const supplyData = PHYSICIAN_SPECIALTIES
    .map((spec) => {
      const metrics = getSpecialtySupplyMetrics(spec.slug);
      if (!metrics) return null;
      const assessment = getSupplyAssessment(metrics.per100K);
      return {
        slug: spec.slug,
        name: spec.name,
        nameAr: spec.nameAr,
        count: metrics.totalCount,
        per100K: metrics.per100K,
        facilityCount: metrics.facilityCount,
        areasCovered: metrics.areasCovered,
        topFacilityShare: metrics.topFacilityShare,
        assessment,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => b.per100K - a.per100K);

  const abundant = supplyData.filter((d) => d.assessment.label === "Abundant").length;
  const adequate = supplyData.filter((d) => d.assessment.label === "Adequate").length;
  const moderate = supplyData.filter((d) => d.assessment.label === "Moderate").length;
  const limited = supplyData.filter((d) => d.assessment.label === "Limited").length;

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.supplyAnalysis },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.supplyAnalysis },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          تحليل عرض الرعاية الصحية
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          تقرير كفاءة التخصصات &middot; {PHYSICIAN_SPECIALTIES.length} تخصصاً طبياً &middot; دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تحليل لكفاءة عرض تخصصات الأطباء في دبي، يقيس المعدلات للفرد والتغطية الجغرافية
            وتوافر المنشآت وتركّز أصحاب العمل. فئات تقييم العرض مبنية على عدد الكوادر لكل
            100,000 نسمة: وفير (15+)، كافٍ (5-14)، متوسط (2-4)، محدود (أقل من 2).
          </p>
        </div>
      </div>

      {/* Supply Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{abundant}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">عرض وفير</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]/70">{adequate}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">عرض كافٍ</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{moderate}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">عرض متوسط</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{limited}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">عرض محدود</p>
        </div>
      </div>

      {/* Supply Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نظرة عامة على عرض تخصصات الأطباء
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                التخصص
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                العدد
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                لكل 100K
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                المنشآت
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden md:table-cell">
                المناطق
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden lg:table-cell">
                % أكبر منشأة
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                التقييم
              </th>
            </tr>
          </thead>
          <tbody>
            {supplyData.map((row) => (
              <tr key={row.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/supply/${row.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {row.nameAr || row.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">{row.count.toLocaleString("ar-AE")}</span>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{row.per100K}</span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{row.facilityCount}</span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden md:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{row.areasCovered}</span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden lg:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{row.topFacilityShare}%</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className={`font-['Geist_Mono',monospace] text-xs font-medium ${row.assessment.color}`}>
                    {row.assessment.labelAr}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Methodology */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          المنهجية
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          تُبنى تقييمات العرض على عدد الكوادر المرخصة من هيئة الصحة بدبي لكل 100,000 نسمة
          (التعداد السكاني المُقدَّر لدبي: 3.66 مليون نسمة). الحدود هي:
        </p>
        <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed space-y-1 list-disc pr-5">
          <li><strong>وفير</strong> (15+ لكل 100K) — عرض قوي مع خيارات متعددة للمزود</li>
          <li><strong>كافٍ</strong> (5-14 لكل 100K) — تغطية كافية لمعظم الاحتياجات</li>
          <li><strong>متوسط</strong> (2-4 لكل 100K) — تحديات محتملة في الوصول ببعض المناطق</li>
          <li><strong>محدود</strong> (أقل من 2 لكل 100K) — قد تستلزم الرعاية المتخصصة إحالة أو سفر</li>
        </ul>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href="/ar/professionals/stats" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          إحصائيات القوى العاملة الكاملة &larr;
        </Link>
        <Link href="/ar/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          مقارنة التخصصات &larr;
        </Link>
        <Link href="/ar/professionals" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          دليل الكوادر المهنية &larr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تقييمات العرض تقديرية مبنية على
          المعدلات للفرد ولأغراض معلوماتية فقط. يعتمد الوصول الفعلي للرعاية الصحية على عوامل
          عديدة تتجاوز مجرد العدد.
        </p>
      </div>
    </div>
  );
}
