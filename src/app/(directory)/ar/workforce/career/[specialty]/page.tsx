import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  ALL_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import {
  getSpecialtyWorkforceMetrics,
  getSpecialtySupplyMetrics,
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
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return ALL_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) return {};

  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  const base = getBaseUrl();

  return {
    title: `مسار ${spec.nameAr} المهني في دبي — حجم القوى العاملة وأصحاب العمل والترخيص`,
    description: `معلومات مهنية عن ${spec.nameAr} في دبي. ${metrics?.totalCount.toLocaleString("ar-AE") || spec.count.toLocaleString("ar-AE")} كادر مرخص وأكبر أصحاب العمل والمناطق الأكثر نشاطاً ومعدل الترخيص الدائم مقابل المُسجَّل ومسار الاستشاري. بيانات سجل شريان DHA.`,
    alternates: {
      canonical: `${base}/ar/workforce/career/${spec.slug}`,
      languages: {
        "en-AE": `${base}/workforce/career/${spec.slug}`,
        "ar-AE": `${base}/ar/workforce/career/${spec.slug}`,
      },
    },
    openGraph: {
      title: `مسار ${spec.nameAr} المهني في دبي`,
      description: `الملف المهني لتخصص ${spec.nameAr}: حجم القوى العاملة وأصحاب العمل والمناطق الأكثر نشاطاً والترخيص في دبي.`,
      url: `${base}/ar/workforce/career/${spec.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCareerSpecialtyPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  if (!metrics) notFound();

  const supply = getSpecialtySupplyMetrics(params.specialty);
  const base = getBaseUrl();

  const faqs = [
    {
      question: `كم عدد كوادر ${spec.nameAr} في دبي؟`,
      answer: `يوجد ${metrics.totalCount.toLocaleString("ar-AE")} كادر مرخص في تخصص ${spec.nameAr} في دبي اعتباراً من ${PROFESSIONAL_STATS.scraped}. يعادل ذلك ${metrics.per100K} لكل 100,000 نسمة.`,
    },
    {
      question: `ما أكبر أصحاب العمل لتخصص ${spec.nameAr} في دبي؟`,
      answer: metrics.topFacilities.length > 0
        ? `أكبر أصحاب العمل هم ${metrics.topFacilities.slice(0, 3).map((f) => f.name).join(" و")}. أكبر منشأة توظّف ${metrics.topFacilities[0].count} كادراً في تخصص ${spec.nameAr}.`
        : `بيانات أصحاب العمل متوفرة في سجل شريان لكوادر تخصص ${spec.nameAr}.`,
    },
    {
      question: `ما معدل الترخيص الدائم FTL لتخصص ${spec.nameAr} في دبي؟`,
      answer: `${metrics.license.ftlPercent}% من كوادر ${spec.nameAr} يحملون ترخيصاً تجارياً كاملاً (FTL) مما يعني عملهم بموجب رخصتهم الخاصة. النسبة المتبقية ${metrics.license.regPercent}% مُسجَّلون تحت رخصة منشأة.`,
    },
    {
      question: `أين يتركز كوادر ${spec.nameAr} في دبي؟`,
      answer: metrics.areaDistribution.length > 0
        ? `أبرز المناطق هي ${metrics.areaDistribution.slice(0, 3).map((a) => `${getArabicAreaName(a.slug) || a.name} (${a.count})`).join(" و")}. تستوعب أبرز 3 مناطق ${metrics.concentrationIndex}% من كوادر ${spec.nameAr}.`
        : `بيانات التوزيع الجغرافي متوفرة في سجل شريان.`,
    },
  ];

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.careers, url: `${base}/ar/workforce/careers` },
          { name: spec.nameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.careers, href: "/ar/workforce/careers" },
          { label: spec.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          مسار {spec.nameAr} المهني في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {metrics.totalCount.toLocaleString("ar-AE")} كادر مرخص &middot; {metrics.per100K} لكل 100K
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            توظّف دبي {metrics.totalCount.toLocaleString("ar-AE")} كادراً مرخصاً من هيئة
            الصحة بدبي في تخصص {spec.nameAr} عبر {metrics.areaDistribution.length} منطقة،
            يعملون في {supply?.facilityCount || "عدة"} منشأة.
            {metrics.consultants > 0 && (
              <> نسبة الاستشاريين {metrics.consultantRatio}% — أي أن {metrics.consultants.toLocaleString("ar-AE")} يحملون تعيينات على مستوى الاستشاري.</>
            )}
            {" "}معدل الترخيص الدائم {metrics.license.ftlPercent}%، وهو يعكس نسبة من يعمل
            بموجب رخصة تجارية خاصة.
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.totalCount.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">إجمالي القوى العاملة</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">لكل 100K نسمة</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.license.ftlPercent}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">معدل الترخيص الدائم</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.consultantRatio}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">نسبة الاستشاريين</p>
        </div>
      </div>

      {/* Top Employers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر أصحاب العمل
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        أكبر أصحاب العمل لكوادر {spec.nameAr} في دبي، مصنّفون حسب عدد الموظفين.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">#</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">المنشأة</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">موظفو {spec.nameAr}</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">إجمالي الموظفين</th>
            </tr>
          </thead>
          <tbody>
            {metrics.topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">{(i + 1).toLocaleString("ar-AE")}</td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{fac.count}</span>
                </td>
                <td className="py-2.5 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{fac.totalStaff.toLocaleString("ar-AE")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Geographic Hotspots */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          المناطق الأكثر نشاطاً
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        تستوعب أبرز 3 مناطق {metrics.concentrationIndex}% من كوادر {spec.nameAr} في دبي.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {metrics.areaDistribution.slice(0, 8).map((area) => (
          <Link
            key={area.slug}
            href={`/ar/workforce/area/${area.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {getArabicAreaName(area.slug) || area.name}
            </h3>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
              {area.count.toLocaleString("ar-AE")} كادر
            </p>
          </Link>
        ))}
      </div>

      {/* Employment Model */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نموذج التوظيف
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">FTL (رخصة خاصة)</p>
          <p className="text-2xl font-bold text-[#006828]">{metrics.license.ftl.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{metrics.license.ftlPercent}%</p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">REG (رخصة منشأة)</p>
          <p className="text-2xl font-bold text-[#006828]">{metrics.license.reg.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{metrics.license.regPercent}%</p>
        </div>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          المعدل المرتفع للترخيص الدائم يشير إلى فرص أكثر للممارسة المستقلة والعيادات الخاصة.
          {metrics.license.ftlPercent > 50
            ? ` بمعدل FTL بلغ ${metrics.license.ftlPercent}%، يميل كوادر ${spec.nameAr} في دبي نحو الممارسة المستقلة.`
            : ` بمعدل FTL بلغ ${metrics.license.ftlPercent}%، يعمل معظم كوادر ${spec.nameAr} في دبي تحت تراخيص المنشآت.`}
        </p>
      </div>

      {/* Consultant Pathway */}
      {(metrics.specialists > 0 || metrics.consultants > 0) && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              مسار الأخصائي إلى الاستشاري
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{metrics.specialists.toLocaleString("ar-AE")}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">أخصائيون</p>
            </div>
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{metrics.consultants.toLocaleString("ar-AE")}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">استشاريون</p>
            </div>
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{metrics.consultantRatio}%</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">نسبة الاستشاريين</p>
            </div>
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
          <p className="text-[11px] text-black/40">تصفح {metrics.totalCount.toLocaleString("ar-AE")} كادر</p>
        </Link>
        {spec.relatedDirectoryCategory && (
          <Link
            href={`/ar/best/doctors/${spec.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              أفضل أطباء {spec.nameAr}
            </h3>
            <p className="text-[11px] text-black/40">الأعلى تقييماً في دبي</p>
          </Link>
        )}
        {spec.category === "physicians" && (
          <Link
            href={`/ar/workforce/supply/${spec.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              {ar.workforce.supplyAnalysis}
            </h3>
            <p className="text-[11px] text-black/40">كفاءة العرض والفجوات الجغرافية</p>
          </Link>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. هذا الملف المهني لأغراض
          معلوماتية فقط ولا يُعدّ نصيحة مهنية أو وظيفية.
        </p>
      </div>
    </div>
  );
}
