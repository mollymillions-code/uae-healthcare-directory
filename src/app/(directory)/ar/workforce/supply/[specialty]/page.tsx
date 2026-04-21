import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PHYSICIAN_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import {
  getSpecialtySupplyMetrics,
  getSpecialtyWorkforceMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { specialty: string };
}

export function generateStaticParams() {
  return PHYSICIAN_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

function getSupplyAssessment(per100K: number): { label: string; labelAr: string; description: string; descriptionAr: string } {
  if (per100K >= 15) return {
    label: "Abundant", labelAr: "وفير",
    description: "Strong supply with multiple provider options across most areas.",
    descriptionAr: "عرض قوي مع خيارات متعددة للمزودين في معظم المناطق.",
  };
  if (per100K >= 5) return {
    label: "Adequate", labelAr: "كافٍ",
    description: "Sufficient coverage for most patient needs.",
    descriptionAr: "تغطية كافية لمعظم احتياجات المرضى.",
  };
  if (per100K >= 2) return {
    label: "Moderate", labelAr: "متوسط",
    description: "Potential access challenges in some geographic areas.",
    descriptionAr: "تحديات محتملة في الوصول ببعض المناطق الجغرافية.",
  };
  return {
    label: "Limited", labelAr: "محدود",
    description: "Specialized care may require referral, longer wait times, or travel.",
    descriptionAr: "قد تستلزم الرعاية المتخصصة إحالة أو انتظار أطول أو سفراً.",
  };
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) return {};

  const supply = getSpecialtySupplyMetrics(params.specialty);
  const base = getBaseUrl();

  return {
    title: `تحليل عرض ${spec.nameAr} في دبي`,
    description: `تحليل عرض ${spec.nameAr} في دبي: ${supply?.totalCount.toLocaleString("ar-AE") || spec.count.toLocaleString("ar-AE")} كادر مرخص، ${supply?.per100K || 0} لكل 100K نسمة، ${supply?.facilityCount || 0} منشأة، التغطية الجغرافية والفجوات.`,
    alternates: {
      canonical: `${base}/ar/workforce/supply/${spec.slug}`,
      languages: {
        "en-AE": `${base}/workforce/supply/${spec.slug}`,
        "ar-AE": `${base}/ar/workforce/supply/${spec.slug}`,
      },
    },
    openGraph: {
      title: `تحليل عرض ${spec.nameAr} في دبي`,
      description: `تحليل كفاءة عرض ${spec.nameAr} في دبي.`,
      url: `${base}/ar/workforce/supply/${spec.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArSupplySpecialtyPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const supply = getSpecialtySupplyMetrics(params.specialty);
  if (!supply) notFound();

  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  const base = getBaseUrl();
  const assessment = getSupplyAssessment(supply.per100K);

  const faqs = [
    {
      question: `كم عدد كوادر ${spec.nameAr} في دبي؟`,
      answer: `يوجد ${supply.totalCount.toLocaleString("ar-AE")} كادر مرخص من هيئة الصحة بدبي في تخصص ${spec.nameAr}، يعملون في ${supply.facilityCount} منشأة بـ ${supply.areasCovered} منطقة.`,
    },
    {
      question: `هل عرض ${spec.nameAr} كافٍ في دبي؟`,
      answer: `بمعدل ${supply.per100K} كادر لكل 100,000 نسمة، يُصنَّف عرض ${spec.nameAr} في دبي بـ"${assessment.labelAr}". ${assessment.descriptionAr}`,
    },
    {
      question: `أين الفجوات الجغرافية لتخصص ${spec.nameAr} في دبي؟`,
      answer: supply.geographicGaps.length > 0
        ? `المناطق التي تفتقر إلى كوادر ${spec.nameAr} تشمل ${supply.geographicGaps.slice(0, 5).map((g) => getArabicAreaName(g) || g).join(" و")}. قد يحتاج السكان في هذه المناطق إلى التنقل إلى أحياء مجاورة.`
        : `يتوزع كوادر ${spec.nameAr} عبر جميع مناطق دبي الرئيسية دون فجوات جغرافية تُذكر.`,
    },
  ];

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.supplyAnalysis, url: `${base}/ar/workforce/supply` },
          { name: spec.nameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.supplyAnalysis, href: "/ar/workforce/supply" },
          { label: spec.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.nameAr} — تحليل العرض
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {supply.totalCount.toLocaleString("ar-AE")} كادر &middot; {supply.per100K} لكل 100K &middot; دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يوجد في دبي {supply.totalCount.toLocaleString("ar-AE")} كادراً مرخصاً من هيئة
            الصحة بدبي في تخصص {spec.nameAr}، بمعدل {supply.per100K} لكل 100,000 نسمة.
            يمارسون عملهم في {supply.facilityCount} منشأة بـ {supply.areasCovered} منطقة.
            تقييم العرض: <strong>{assessment.labelAr}</strong>.
          </p>
        </div>
      </div>

      {/* Key Supply Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.totalCount.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">إجمالي الكوادر</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">لكل 100K نسمة</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.facilityCount}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">المنشآت</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.areasCovered}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">المناطق المغطاة</p>
        </div>
      </div>

      {/* Supply Assessment */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تقييم العرض
        </h2>
      </div>
      <div className="border border-black/[0.06] p-6 mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828] uppercase tracking-wider">
            {assessment.labelAr}
          </span>
          <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
            {supply.per100K} لكل 100K
          </span>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-4">
          {assessment.descriptionAr}
        </p>
        <div className="w-full bg-black/[0.04] h-2">
          <div
            className="bg-[#006828] h-2"
            style={{ width: `${Math.min(supply.per100K * 3, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">0</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">محدود</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">متوسط</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">كافٍ</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">وفير</span>
        </div>
      </div>

      {/* Employer Concentration */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تركّز أصحاب العمل
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          أكبر صاحب عمل يستوعب <strong>{supply.topFacilityShare}%</strong> من إجمالي كوادر{" "}
          {spec.nameAr} في دبي.
          {supply.topFacilityShare > 30
            ? " يشير ذلك إلى تركّز عالٍ لدى صاحب عمل واحد مما قد يؤثر على المنافسة والتنقل الوظيفي."
            : " يشير ذلك إلى توزيع نسبي لأصحاب العمل مع تنقل وظيفي جيد."}
        </p>
      </div>
      {metrics && metrics.topFacilities.length > 0 && (
        <div className="mb-12">
          {metrics.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">
                {fac.count} ({supply.totalCount > 0 ? ((fac.count / supply.totalCount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Geographic Coverage */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التغطية الجغرافية
        </h2>
      </div>
      {metrics && metrics.areaDistribution.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#1c1c1c]">
                <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">المنطقة</th>
                <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">العدد</th>
                <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">% من الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {metrics.areaDistribution.slice(0, 10).map((area) => (
                <tr key={area.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {getArabicAreaName(area.slug) || area.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{area.count.toLocaleString("ar-AE")}</span>
                  </td>
                  <td className="py-2.5 text-left">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {supply.totalCount > 0 ? ((area.count / supply.totalCount) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Geographic Gaps */}
      {supply.geographicGaps.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              الفجوات الجغرافية
            </h2>
          </div>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
            المناطق التالية لا تضم كوادر {spec.nameAr} مرخصين من هيئة الصحة بدبي. قد يحتاج
            السكان في هذه المناطق إلى التنقل إلى أحياء مجاورة للحصول على رعاية {spec.nameAr}.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {supply.geographicGaps.map((gap) => (
              <div key={gap} className="bg-[#f8f8f6] p-3">
                <p className="font-['Geist',sans-serif] text-sm text-black/60">
                  {getArabicAreaName(gap) || gap}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAQs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          الأسئلة الشائعة
        </h2>
      </div>
      <div className="space-y-6 mb-12">
        {faqs.map((faq, i) => (
          <div key={i}>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          صفحات ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <Link
          href={`/ar/professionals/${spec.category}/${spec.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            دليل {spec.nameAr}
          </h3>
          <p className="text-[11px] text-black/40">تصفح جميع الكوادر</p>
        </Link>
        <Link
          href={`/ar/workforce/career/${spec.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            الملف المهني
          </h3>
          <p className="text-[11px] text-black/40">أصحاب العمل والمناطق الأبرز والترخيص</p>
        </Link>
        <Link
          href="/ar/workforce/supply"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            جميع التخصصات
          </h3>
          <p className="text-[11px] text-black/40">مركز تحليل العرض</p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تقييمات العرض تقديرية مبنية على
          المعدلات للفرد ولأغراض معلوماتية فقط. يعتمد الوصول الفعلي على عوامل عديدة تتجاوز
          مجرد العدد.
        </p>
      </div>
    </div>
  );
}
