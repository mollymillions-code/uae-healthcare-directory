import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getFacilitySizeDistribution,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `توزيع أحجام منشآت الرعاية الصحية في دبي — تحليل الموظفين لكل منشأة`,
    description: `ما حجم منشآت الرعاية الصحية في دبي؟ تحليل توزيع أحجام ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة — من المستشفيات الكبرى (500+ موظف) إلى العيادات الصغرى (<5 موظفين). التوسط والمتوسط وتحليل الفئات.`,
    alternates: {
      canonical: `${base}/ar/workforce/benchmarks/staff-per-facility`,
      languages: {
        "en-AE": `${base}/workforce/benchmarks/staff-per-facility`,
        "ar-AE": `${base}/ar/workforce/benchmarks/staff-per-facility`,
      },
    },
    openGraph: {
      title: `توزيع أحجام منشآت الرعاية الصحية في دبي`,
      description: `تحليل فئات حجم ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة رعاية صحية في دبي.`,
      url: `${base}/ar/workforce/benchmarks/staff-per-facility`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArStaffPerFacilityPage() {
  const base = getBaseUrl();
  const dist = getFacilitySizeDistribution();

  const tiers = [
    {
      label: "عملاق",
      description: "500+ موظف مرخص",
      count: dist.mega,
      pct: ((dist.mega / dist.total) * 100).toFixed(1),
      examples: "المستشفيات الحكومية والخاصة الكبرى",
    },
    {
      label: "كبير",
      description: "100-499 موظف مرخص",
      count: dist.large,
      pct: ((dist.large / dist.total) * 100).toFixed(1),
      examples: "مستشفيات متعددة التخصصات وعيادات كبيرة",
    },
    {
      label: "متوسط",
      description: "20-99 موظف مرخص",
      count: dist.mid,
      pct: ((dist.mid / dist.total) * 100).toFixed(1),
      examples: "مراكز التخصص والعيادات المتعددة",
    },
    {
      label: "صغير",
      description: "5-19 موظف مرخص",
      count: dist.small,
      pct: ((dist.small / dist.total) * 100).toFixed(1),
      examples: "عيادات الأحياء وعيادات الأسنان",
    },
    {
      label: "مصغّر",
      description: "أقل من 5 موظفين مرخصين",
      count: dist.micro,
      pct: ((dist.micro / dist.total) * 100).toFixed(1),
      examples: "الممارسات الفردية والمراكز المتخصصة",
    },
  ];

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "توزيع أحجام منشآت الرعاية الصحية — دبي",
          description: `تحليل فئات حجم ${dist.total.toLocaleString("ar-AE")} منشأة رعاية صحية في دبي.`,
          url: `${base}/ar/workforce/benchmarks/staff-per-facility`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.benchmarks, url: `${base}/ar/workforce/benchmarks` },
          { name: ar.workforce.staffPerFacility },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.benchmarks, href: "/ar/workforce/benchmarks" },
          { label: ar.workforce.staffPerFacility },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          معيار التوظيف
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          توزيع أحجام المنشآت — الرعاية الصحية في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {dist.total.toLocaleString("ar-AE")} منشأة &middot; البيانات كما في{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            ما حجم منشآت الرعاية الصحية في دبي؟ يقسّم هذا التحليل{" "}
            {dist.total.toLocaleString("ar-AE")} منشأة إلى خمس فئات حجمية بناءً على عدد
            الموظفين المرخصين من هيئة الصحة بدبي. يبلغ الوسيط {dist.medianStaff} موظفاً
            مرخصاً، فيما يبلغ المتوسط {dist.averageStaff} — وهذا الفارق يعكس الذيل الطويل
            من العيادات الصغيرة إلى جانب عدد محدود من المستشفيات العملاقة.
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: dist.total.toLocaleString("ar-AE"),
            label: "إجمالي المنشآت",
          },
          {
            value: dist.medianStaff.toString(),
            label: "وسيط الموظفين لكل منشأة",
          },
          {
            value: dist.averageStaff.toString(),
            label: "متوسط الموظفين لكل منشأة",
          },
          {
            value: dist.mega.toString(),
            label: "مستشفيات عملاقة (500+)",
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

      {/* Size Tier Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تفصيل فئات الحجم
        </h2>
      </div>

      <div className="mb-8">
        {tiers.map((tier) => (
          <div key={tier.label} className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {tier.label}
                </span>
                <span className="font-['Geist',sans-serif] text-xs text-black/40 mr-2">
                  {tier.description}
                </span>
              </div>
              <div className="text-left">
                <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {tier.count.toLocaleString("ar-AE")}
                </span>
                <span className="font-['Geist_Mono',monospace] text-xs text-black/40 mr-2">
                  ({tier.pct}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-black/[0.04] h-3">
              <div
                className="bg-[#006828] h-3"
                style={{
                  width: `${Math.max(parseFloat(tier.pct), 1)}%`,
                }}
              />
            </div>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/30 mt-1">
              {tier.examples}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جدول ملخص
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                الفئة
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                نطاق الموظفين
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنشآت
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % من الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.label} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                    {tier.label}
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {tier.description}
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {tier.count.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 text-left">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {tier.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analysis */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تحليل التوزيع
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          يميل سوق الرعاية الصحية في دبي بشدة نحو المنشآت الصغيرة والمصغّرة. وبينما تستوعب
          المستشفيات العملاقة الـ {dist.mega} والمنشآت الكبيرة الـ {dist.large} غالبية الموظفين
          المرخصين، فإن الغالبية العظمى من المنشآت ({dist.small + dist.micro} من {dist.total}،
          أي{" "}
          {(((dist.small + dist.micro) / dist.total) * 100).toFixed(0)}%) هي منشآت صغيرة
          أو مصغّرة بأقل من 20 موظفاً مرخصاً.
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          الوسيط البالغ {dist.medianStaff} موظفاً مقابل متوسط {dist.averageStaff} موظفاً
          يُظهر هذا الانحراف — إذ يرفع عدد قليل من أصحاب العمل الكبار المتوسط بشكل ملحوظ
          فوق الوسيط. هذا النمط شائع في أسواق الرعاية الصحية حيث تعمل نخبة من المستشفيات
          الثلاثية كأصحاب عمل رئيسيين بينما تعمل آلاف العيادات الخارجية بفرق صغيرة.
        </p>
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
          href="/ar/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.specialistPerCapita}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            معدلات لكل 100,000 نسمة لكل تخصص
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
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تشمل أعداد المنشآت جميع المنشآت التي
          يضم كادرها مهنياً مرخصاً واحداً على الأقل. تعكس أعداد الموظفين المهنيين المرخصين
          فقط ولا تشمل الموظفين الإداريين أو الداعمين. تحقق من أوراق الاعتماد مباشرة من
          هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
