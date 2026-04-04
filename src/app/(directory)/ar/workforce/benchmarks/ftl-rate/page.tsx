import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getFTLRateBySpecialty,
  getFTLRateByArea,
  getLicenseTypeBreakdown,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `تحليل معدل الترخيص الدائم FTL في دبي — الممارسة المستقلة حسب التخصص والمنطقة | Zavis`,
    description: `تحليل معدل الترخيص الدائم (FTL) للرعاية الصحية في دبي: أي التخصصات والمناطق تسجّل أعلى معدلات ممارسة مستقلة؟ جداول مصنّفة عبر ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مرخص.`,
    alternates: {
      canonical: `${base}/ar/workforce/benchmarks/ftl-rate`,
      languages: {
        "en-AE": `${base}/workforce/benchmarks/ftl-rate`,
        "ar-AE": `${base}/ar/workforce/benchmarks/ftl-rate`,
      },
    },
    openGraph: {
      title: `تحليل معدل الترخيص الدائم FTL في دبي`,
      description: `انتشار تراخيص الممارسة المستقلة عبر القوى العاملة الصحية في دبي.`,
      url: `${base}/ar/workforce/benchmarks/ftl-rate`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArFTLRatePage() {
  const base = getBaseUrl();
  const bySpecialty = getFTLRateBySpecialty();
  const byArea = getFTLRateByArea();
  const license = getLicenseTypeBreakdown();

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "تحليل معدل الترخيص الدائم FTL — الرعاية الصحية في دبي",
          description: `معدلات تراخيص الممارسة المستقلة عبر ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مرخص في دبي.`,
          url: `${base}/ar/workforce/benchmarks/ftl-rate`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.benchmarks, url: `${base}/ar/workforce/benchmarks` },
          { name: ar.workforce.ftlRate },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.benchmarks, href: "/ar/workforce/benchmarks" },
          { label: ar.workforce.ftlRate },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          معيار الترخيص
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          تحليل معدل الترخيص الدائم — الممارسة المستقلة في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {bySpecialty.length.toLocaleString("ar-AE")} تخصصاً &middot;{" "}
          {byArea.length.toLocaleString("ar-AE")} منطقة &middot; البيانات كما في{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تُصدر هيئة الصحة بدبي نوعين رئيسيين من التراخيص: <strong>FTL</strong> (ترخيص
            تجاري كامل) للمهنيين الذين يعملون بموجب رخصتهم التجارية الخاصة، و<strong>REG</strong>{" "}
            (مُسجَّل) للمهنيين الموظفين تحت رخصة منشأة. يشير معدل FTL المرتفع إلى انتشار
            الممارسة المستقلة، وهو شائع في التخصصات الخارجية كالأمراض الجلدية وطب الأسنان.
            المعدل المنخفض يُلمح إلى هيمنة التوظيف في المستشفيات.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: `${license.ftlPercent}%`,
            label: "معدل FTL الإجمالي",
          },
          {
            value: license.ftl.toLocaleString("ar-AE"),
            label: "مهنيون بترخيص FTL",
          },
          {
            value: license.reg.toLocaleString("ar-AE"),
            label: "مهنيون بترخيص REG",
          },
          {
            value: bySpecialty.length > 0
              ? `${bySpecialty[0].ftlRate}%`
              : "--",
            label: "أعلى معدل FTL تخصصي",
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

      {/* FTL by Specialty */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          معدل FTL حسب التخصص
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        التخصصات التي تضم 20+ كادراً مرخصاً، مصنّفةً حسب نسبة حاملي ترخيص FTL. المعدلات
        المرتفعة تشير إلى انتشار أكبر للممارسة المستقلة.
      </p>
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
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                معدل FTL
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                FTL
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {bySpecialty.map((spec, i) => (
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
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {spec.ftlRate}%
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {spec.ftl.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {spec.total.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FTL by Area */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          معدل FTL حسب المنطقة
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        مناطق دبي مصنّفةً حسب انتشار الترخيص الدائم بين الكوادر الصحية المرخصة. المناطق ذات
        معدلات FTL المرتفعة تميل إلى احتضان عيادات ومراكز تخصصية مستقلة أكثر.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">
                #
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنطقة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                معدل FTL
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                FTL
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {byArea.map((area, i) => (
              <tr key={area.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/area/${area.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {getArabicAreaName(area.slug) || area.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {area.ftlRate}%
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {area.ftl.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {area.total.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
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
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. يشير الترخيص الدائم FTL إلى مهني
          يعمل بموجب رخصته التجارية الخاصة. يشير الترخيص المُسجَّل REG إلى موظف تحت رخصة
          منشأة. يعكس نوع الترخيص طبيعة التوظيف لا مستوى المهارة. التخصصات التي تضم أقل من 20
          مهنياً مستبعدة. تحقق من أوراق الاعتماد مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
