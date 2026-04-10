import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getWorkforceRatios,
  getLicenseTypeBreakdown,
  getNurseToDoctorRatios,
  getFacilitySizeDistribution,
  getSpecialistPerCapita,
  getSpecialtyConcentration,
  getSpecialtiesWithBothLevels,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "معايير التوظيف الصحي في دبي — النسب والمعايير القياسية",
    description:
      "معايير التوظيف في قطاع الصحة بدبي: نسب الممرضين للأطباء، عدد الكوادر لكل منشأة، معدلات الأخصائيين لكل فرد، تحليل رخص FTL، مسارات الاستشاريين، ومؤشرات التركز الجغرافي للتخصصات.",
    alternates: {
      canonical: `${base}/ar/workforce/benchmarks`,
      languages: {
        "en-AE": `${base}/workforce/benchmarks`,
        "ar-AE": `${base}/ar/workforce/benchmarks`,
      },
    },
    openGraph: {
      title: "معايير التوظيف الصحي في دبي — النسب والمعايير القياسية",
      description:
        "ستة معايير رئيسية لتقييم طاقة القوى العاملة الصحية في دبي وتوزيعها.",
      url: `${base}/ar/workforce/benchmarks`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArBenchmarksPage() {
  const base = getBaseUrl();
  const ratios = getWorkforceRatios();
  const license = getLicenseTypeBreakdown();
  const nurseDoctorData = getNurseToDoctorRatios(20);
  const sizeDist = getFacilitySizeDistribution();
  const perCapita = getSpecialistPerCapita();
  const concentration = getSpecialtyConcentration();
  const pipeline = getSpecialtiesWithBothLevels();

  const benchmarks = [
    {
      title: "نسبة الممرضين إلى الأطباء",
      href: "/ar/workforce/benchmarks/nurse-to-doctor",
      description:
        "نسب الممرضين إلى الأطباء على مستوى المنشآت مقارنةً بمعايير منظمة الصحة العالمية. تحديد المنشآت ذات التوظيف الناقص والزائد.",
      stats: [
        { label: "متوسط النظام", value: `${ratios.nurseToPhysicianRatio}:1` },
        {
          label: "منشآت متابَعة",
          value: nurseDoctorData.length.toLocaleString("ar-AE"),
        },
        { label: "معيار WHO", value: "3:1" },
      ],
    },
    {
      title: "الكوادر لكل منشأة",
      href: "/ar/workforce/benchmarks/staff-per-facility",
      description:
        "توزيع أحجام المنشآت الصحية من المستشفيات العملاقة (500+) إلى العيادات المصغّرة (<5). الوسيط والمتوسط وتوزيع الفئات.",
      stats: [
        {
          label: "وسيط الكوادر",
          value: sizeDist.medianStaff.toLocaleString("ar-AE"),
        },
        {
          label: "متوسط الكوادر",
          value: sizeDist.averageStaff.toLocaleString("ar-AE"),
        },
        {
          label: "منشآت عملاقة",
          value: sizeDist.mega.toLocaleString("ar-AE"),
        },
      ],
    },
    {
      title: "الأخصائيون لكل فرد",
      href: "/ar/workforce/benchmarks/specialist-per-capita",
      description:
        "معدلات لكل 100,000 نسمة لكل تخصص. مقارنة كثافة الأخصائيين في دبي بالمعايير الدولية.",
      stats: [
        { label: "أعلى تخصص", value: perCapita[0]?.name || "—" },
        {
          label: "أعلى معدل",
          value: `${perCapita[0]?.per100K || 0}/100K`,
        },
        {
          label: "تخصصات متابَعة",
          value: perCapita.length.toLocaleString("ar-AE"),
        },
      ],
    },
    {
      title: "تحليل معدل FTL",
      href: "/ar/workforce/benchmarks/ftl-rate",
      description:
        "تغلغل رخصة الوقت الكامل (FTL) مقابل التسجيل (REG) حسب التخصص والمنطقة. يقيس استقرار التوظيف والالتزام المهني.",
      stats: [
        { label: "معدل FTL الكلي", value: `${license.ftlPercent}%` },
        {
          label: "حاملو FTL",
          value: license.ftl.toLocaleString("ar-AE"),
        },
        {
          label: "حاملو REG",
          value: license.reg.toLocaleString("ar-AE"),
        },
      ],
    },
    {
      title: "مسار الاستشاريين",
      href: "/ar/workforce/specialties",
      description:
        "نسبة التقدم من أخصائي إلى استشاري حسب التخصص. تُظهر عمق السنيورية وأنماط التقدم الوظيفي في كل تخصص.",
      stats: [
        {
          label: "تخصصات ذات مسارين",
          value: pipeline.length.toLocaleString("ar-AE"),
        },
        { label: "أعلى مسار", value: pipeline[0]?.name || "—" },
        {
          label: "الاستشاريون",
          value: pipeline
            .reduce((sum, p) => sum + p.consultants, 0)
            .toLocaleString("ar-AE"),
        },
      ],
    },
    {
      title: "تركّز التخصصات",
      href: "/ar/workforce/areas",
      description:
        "مؤشر التركز الجغرافي: ما نسبة كل تخصص المتمركزة في 3 مناطق فقط؟ يحدد التخصصات شديدة التركز وجيدة التوزيع.",
      stats: [
        { label: "الأكثر تركّزاً", value: concentration[0]?.name || "—" },
        {
          label: "حصة أعلى 3 مناطق",
          value: `${concentration[0]?.top3Percent || 0}%`,
        },
        {
          label: "تخصصات متابَعة",
          value: concentration.length.toLocaleString("ar-AE"),
        },
      ],
    },
  ];

  return (
    <div
      dir="rtl"
      lang="ar"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "معايير التوظيف الصحي في دبي",
          description: "ستة معايير توظيف رئيسية لقطاع الصحة في دبي.",
          url: `${base}/ar/workforce/benchmarks`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.benchmarks },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.benchmarks },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          المعايير المرجعية للتوظيف
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          معايير التوظيف الصحي في دبي
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          ستة تحليلات معيارية تقيس طاقة القوى العاملة الصحية في دبي وتوزيعها
          وجودة التوظيف. مبنية على{" "}
          {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} مهنياً مرخّصاً من
          هيئة الصحة بدبي عبر{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة.
        </p>
      </div>

      {/* بطاقات المعايير */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تقارير المعايير
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {benchmarks.map((bm) => (
          <Link
            key={bm.href}
            href={bm.href}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2 group-hover:text-[#006828] transition-colors">
              {bm.title}
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed mb-4">
              {bm.description}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {bm.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828] truncate">
                    {stat.value}
                  </p>
                  <p className="font-['Geist',sans-serif] text-[10px] text-black/30 truncate">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* ملخص النسب الرئيسية */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          النسب الرئيسية على مستوى النظام
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "نسبة الطبيب إلى السكان", value: ratios.physicianToPopulation },
          { label: "نسبة الممرض إلى السكان", value: ratios.nurseToPopulation },
          { label: "نسبة الممرض إلى الطبيب", value: `${ratios.nurseToPhysicianRatio}:1` },
          { label: "معدل FTL (النظام)", value: `${license.ftlPercent}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* كتلة الأسئلة الشائعة */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          ما أبرز معايير التوظيف الصحي في دبي؟
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          تبلغ نسبة الأطباء إلى السكان في دبي {ratios.physicianToPopulation}،
          فيما تبلغ نسبة الممرضين إلى الأطباء على مستوى النظام{" "}
          {ratios.nurseToPhysicianRatio}:1 (أدنى من المعيار المرجعي لمنظمة
          الصحة العالمية البالغ 3:1)، ومعدل FTL {license.ftlPercent}% مما يُشير
          إلى استقرار عالٍ في التوظيف. يضم المتوسط الوسيط للمنشآت{" "}
          {sizeDist.medianStaff.toLocaleString("ar-AE")} كادراً مرخّصاً، مع{" "}
          {sizeDist.mega.toLocaleString("ar-AE")} مستشفيات عملاقة توظّف 500
          مهنياً أو أكثر.
        </p>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تُحسب
          المعايير من أعداد المهنيين المرخّصين فقط. تستخدم التقديرات السكانية
          3,660,000 لدبي (2026). تحقق مع هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
