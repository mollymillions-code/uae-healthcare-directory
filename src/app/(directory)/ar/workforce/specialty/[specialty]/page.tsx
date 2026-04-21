import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";
import {
  getSpecialtyWorkforceMetrics,
  getSpecialtySupplyMetrics,
  getLicenseTypeBySpecialty,
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  DUBAI_POPULATION,
  DUBAI_AREAS,
} from "@/lib/workforce";
import {
  getSpecialtyBySlug,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return ALL_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { specialty: string };
}): Metadata {
  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  if (!metrics) return {};
  const spec = getSpecialtyBySlug(params.specialty);
  const base = getBaseUrl();
  const nameAr = spec?.nameAr || metrics.name;

  return {
    title: `تحليل القوى العاملة — ${nameAr} في دبي`,
    description: `ملف سوق العمل لـ ${metrics.totalCount.toLocaleString("ar-AE")} من متخصصي ${nameAr} في دبي. معدل FTL ${metrics.license.ftlPercent}%، ${metrics.areaDistribution.length} منطقة، أبرز المنشآت والفجوات الجغرافية. بيانات DHA شريان.`,
    alternates: {
      canonical: `${base}/ar/workforce/specialty/${params.specialty}`,
      languages: {
        "en-AE": `${base}/workforce/specialty/${params.specialty}`,
        "ar-AE": `${base}/ar/workforce/specialty/${params.specialty}`,
      },
    },
    openGraph: {
      title: `تحليل القوى العاملة — ${nameAr} في دبي`,
      description: `${metrics.totalCount.toLocaleString("ar-AE")} من ${nameAr}. ${metrics.per100K} لكل 100,000 نسمة، ${metrics.concentrationIndex}% مركّزون في أعلى 3 مناطق.`,
      url: `${base}/ar/workforce/specialty/${params.specialty}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

// ─── تقييم العرض لكل تخصص ────────────────────────────────────────────────────

const OECD_SPECIALTY_BENCHMARKS: Record<string, number> = {
  "general-practitioner": 120,
  "pediatrics": 25,
  "obstetrics-gynecology": 20,
  "cardiology": 15,
  "orthopedic-surgery": 15,
  "psychiatry": 18,
  "anesthesia": 20,
  "general-surgery": 20,
  "ophthalmology": 12,
  "dermatology": 10,
  "neurology": 10,
  "general-dentist": 60,
  "registered-nurse": 800,
  "pharmacist": 80,
  "physiotherapist": 50,
};

function getSupplyAssessmentAr(
  slug: string,
  per100K: number,
  areasCovered: number,
  totalAreas: number
): string {
  const benchmark = OECD_SPECIALTY_BENCHMARKS[slug];
  const coverageRatio = areasCovered / totalAreas;
  const parts: string[] = [];

  if (benchmark) {
    if (per100K < benchmark * 0.5) {
      parts.push(
        `بمعدل ${per100K} لكل 100,000 نسمة، يبدو هذا التخصص في نقص واضح مقارنةً بمتوسط OECD البالغ نحو ${benchmark} لكل 100,000. قد يعني هذا الفارق وجود فرص توظيف أو طلب غير ممتثَل.`
      );
    } else if (per100K < benchmark * 0.8) {
      parts.push(
        `بمعدل ${per100K} لكل 100,000 مقابل متوسط OECD البالغ نحو ${benchmark}، قد يكون هناك نقص معتدل في العرض. يُعوّض جزئياً عن هذا الفارق الهرمُ السكاني الشاب في دبي.`
      );
    } else if (per100K > benchmark * 1.3) {
      parts.push(
        `بمعدل ${per100K} لكل 100,000، يتجاوز هذا التخصص متوسط OECD البالغ نحو ${benchmark}، مما يعكس دور دبي مركزاً طبياً إقليمياً ووجهةً للسياحة الطبية.`
      );
    } else {
      parts.push(
        `بمعدل ${per100K} لكل 100,000، يتوافق مستوى العرض مع متوسط OECD البالغ نحو ${benchmark}، مع مراعاة الخصائص الديموغرافية الفريدة لدبي في أي مقارنة مباشرة.`
      );
    }
  } else {
    parts.push(
      `بوجود ${per100K} كادر لكل 100,000 نسمة، ينبغي تفسير مستوى عرض هذا التخصص في ضوء التركيبة الديموغرافية لدبي وأنماط الاستخدام الصحي.`
    );
  }

  if (coverageRatio < 0.3) {
    parts.push(
      `التغطية الجغرافية محدودة لـ ${areasCovered} من أصل ${totalAreas} منطقة مرصودة، مما يشير إلى فجوات وصول كبيرة في الأحياء الأقل خدمةً.`
    );
  } else if (coverageRatio < 0.6) {
    parts.push(
      `تغطية المناطق ${areasCovered} من أصل ${totalAreas} منطقة، مع مجال للتوسع نحو المجتمعات الأقل خدمةً.`
    );
  }

  return parts.join(" ");
}

export default function ArabicSpecialtyWorkforcePage({
  params,
}: {
  params: { specialty: string };
}) {
  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  if (!metrics) notFound();

  const supply = getSpecialtySupplyMetrics(params.specialty);
  const license = getLicenseTypeBySpecialty(params.specialty);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const nameAr = spec.nameAr || metrics.name;

  const base = getBaseUrl();
  const category = PROFESSIONAL_CATEGORIES.find(
    (c) => c.slug === metrics.category
  );
  const categoryNameAr = category?.nameAr || metrics.category;

  // Related specialties in same category (excluding self)
  const relatedSpecialties = getSpecialtiesByCategory(metrics.category)
    .filter((s) => s.slug !== params.specialty)
    .slice(0, 6);

  const hasConsultantData =
    metrics.specialists > 0 || metrics.consultants > 0;
  const totalAreas = DUBAI_AREAS.length;

  const supplyAssessment = supply
    ? getSupplyAssessmentAr(
        params.specialty,
        metrics.per100K,
        supply.areasCovered,
        totalAreas
      )
    : null;

  return (
    <div
      dir="rtl"
      lang="ar"
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* JSON-LD */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce/overview` },
          {
            name: categoryNameAr,
            url: `${base}/ar/workforce/category/${metrics.category}`,
          },
          { name: nameAr },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `تحليل القوى العاملة — ${nameAr} في دبي`,
          description: `بيانات سوق العمل لـ ${metrics.totalCount.toLocaleString()} من متخصصي ${nameAr} المرخّصين من هيئة صحة دبي.`,
          url: `${base}/ar/workforce/specialty/${params.specialty}`,
          inLanguage: "ar",
          about: {
            "@type": "MedicalSpecialty",
            name: metrics.name,
          },
          mainEntity: {
            "@type": "Dataset",
            name: `بيانات القوى العاملة — ${nameAr} في دبي`,
            description: `مقاييس القوى العاملة لـ ${metrics.totalCount.toLocaleString()} من متخصصي ${nameAr} المرخّصين من DHA.`,
            creator: {
              "@type": "Organization",
              name: "Zavis",
              url: base,
            },
            temporalCoverage: "2026",
            spatialCoverage: {
              "@type": "Place",
              name: "دبي، الإمارات العربية المتحدة",
            },
          },
        }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce/overview" },
          {
            label: categoryNameAr,
            href: `/ar/workforce/category/${metrics.category}`,
          },
          { label: nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40 uppercase tracking-wider mb-1">
          {categoryNameAr}
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {nameAr}: ملف القوى العاملة
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {metrics.totalCount.toLocaleString("ar-AE")} كادر مرخّص &middot;{" "}
          {metrics.per100K} لكل 100,000 &middot;{" "}
          {metrics.areaDistribution.length} منطقة مغطّاة
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            معلومات القوى العاملة لمتخصصي {nameAr} في دبي. يتناول هذا الملف
            كثافة العرض، أنماط الترخيص، توزيع مستوى الأقدمية، تركّز أصحاب
            العمل، والوصول الجغرافي. جميع البيانات من السجل الطبي المهني
            لهيئة صحة دبي (شريان).
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {[
          {
            value: metrics.totalCount.toLocaleString("ar-AE"),
            label: "إجمالي المرخّصين",
          },
          {
            value: metrics.per100K.toString(),
            label: ar.workforce.perCapita,
          },
          {
            value: `${license.ftlPercent}%`,
            label: ar.workforce.ftlRate,
          },
          {
            value: hasConsultantData ? `${metrics.consultantRatio}%` : "غ.م",
            label: "نسبة الاستشاريين",
          },
          {
            value: metrics.areaDistribution.length.toString(),
            label: "المناطق المغطّاة",
          },
          {
            value: `${metrics.concentrationIndex}%`,
            label: "تركّز أعلى 3 مناطق",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl sm:text-2xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Supply Assessment */}
      {supplyAssessment && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              تقييم مستوى العرض
            </h2>
          </div>
          <div className="bg-[#f8f8f6] border-r-4 border-[#006828] py-5 px-6 mb-12">
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {supplyAssessment}
            </p>
          </div>
        </>
      )}

      {/* License Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع أنواع التراخيص
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          حاملو رخصة <strong>FTL</strong> (ترخيص تجاري كامل) يعملون تحت
          ترخيصهم الخاص وهم عادةً ممارسون مستقلون. أما{" "}
          <strong>REG</strong> (المسجّلون) فيعملون تحت ترخيص منشأة طبية.{" "}
          {license.ftlPercent > 40
            ? `نسبة FTL البالغة ${license.ftlPercent}% مرتفعة، مما يشير إلى أن كثيراً من متخصصي ${nameAr} يعملون باستقلالية أو يديرون عيادات خاصة.`
            : `نسبة FTL البالغة ${license.ftlPercent}% تدل على أن معظم متخصصي ${nameAr} موظّفون في منشآت طبية لا ممارسون مستقلون.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            FTL — ترخيص تجاري كامل
          </p>
          <p className="text-2xl font-bold text-[#006828]">
            {license.ftl.toLocaleString("ar-AE")}
          </p>
          <div className="w-full bg-black/[0.04] h-1.5 mt-2 mb-1">
            <div
              className="bg-[#006828] h-1.5"
              style={{ width: `${license.ftlPercent}%` }}
            />
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {license.ftlPercent}%
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            REG — مسجّل
          </p>
          <p className="text-2xl font-bold text-[#1c1c1c]">
            {license.reg.toLocaleString("ar-AE")}
          </p>
          <div className="w-full bg-black/[0.04] h-1.5 mt-2 mb-1">
            <div
              className="bg-[#1c1c1c] h-1.5"
              style={{ width: `${license.regPercent}%` }}
            />
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {license.regPercent}%
          </p>
        </div>
      </div>

      {/* Specialist vs Consultant */}
      {hasConsultantData &&
        (metrics.specialists > 0 || metrics.consultants > 0) && (
          <>
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                الأخصائيون مقابل الاستشاريون
              </h2>
            </div>
            <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
              <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                في نظام هيئة صحة دبي، يحمل <strong>الأخصائيون</strong>{" "}
                شهادة البورد في مجالهم، فيما يُعدّ{" "}
                <strong>الاستشاريون</strong> أخصائيين بالغ الخبرة بخبرة
                لا تقل عن 5 سنوات بعد حصولهم على شهادة البورد. تعكس نسبة
                الاستشاريين نضج مسار المهنة — كلما ارتفعت النسبة دلّ ذلك
                على قوة عاملة ذات أقدمية عالية.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-12">
              <div className="bg-[#f8f8f6] p-5 text-center">
                <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
                  الأخصائيون
                </p>
                <p className="text-2xl font-bold text-[#006828]">
                  {metrics.specialists.toLocaleString("ar-AE")}
                </p>
              </div>
              <div className="bg-[#f8f8f6] p-5 text-center">
                <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
                  الاستشاريون
                </p>
                <p className="text-2xl font-bold text-[#1c1c1c]">
                  {metrics.consultants.toLocaleString("ar-AE")}
                </p>
              </div>
              <div className="bg-[#f8f8f6] p-5 text-center">
                <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
                  نسبة الاستشاريين
                </p>
                <p className="text-2xl font-bold text-[#1c1c1c]">
                  {metrics.consultantRatio}%
                </p>
                <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
                  {metrics.consultantRatio > 40
                    ? "قوة عاملة ناضجة ذات أقدمية عالية"
                    : metrics.consultantRatio > 20
                      ? "توازن في مسار الأقدمية"
                      : "غلبة للكوادر حديثة التخرج"}
                </p>
              </div>
            </div>
          </>
        )}

      {/* Top 10 Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز المنشآت لتخصص {nameAr}
        </h2>
      </div>
      {supply && supply.topFacilityShare > 0 && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          يستوعب أكبر صاحب عمل {supply.topFacilityShare}% من جميع متخصصي{" "}
          {nameAr} في دبي.
          {supply.topFacilityShare > 20
            ? " يُشير هذا التركّز المرتفع إلى هيمنة عدد محدود من المنشآت على سوق هذا التخصص."
            : " العرض موزّع بشكل معقول على المنشآت المختلفة."}
        </p>
      )}
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10"
              >
                #
              </th>
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                المنشأة
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                عدد {nameAr}
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
              >
                إجمالي الموظفين
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {i + 1}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.count.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {fac.totalStaff.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التوزيع الجغرافي
        </h2>
      </div>

      {/* Concentration Index Callout */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-4 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          <strong>{ar.workforce.concentrationIndex}:</strong>{" "}
          <span className="font-['Geist_Mono',monospace] font-bold text-[#1c1c1c]">
            {metrics.concentrationIndex}%
          </span>{" "}
          من متخصصي {nameAr} يتمركزون في أعلى 3 مناطق
          {metrics.areaDistribution.length >= 3 && (
            <>
              {" "}
              (
              {metrics.areaDistribution
                .slice(0, 3)
                .map((a) => getArabicAreaName(a.slug))
                .join("، ")}
              )
            </>
          )}
          .{" "}
          {metrics.concentrationIndex > 70
            ? "هذا التركّز المرتفع قد يُشكّل عائقاً أمام وصول المرضى في المناطق الطرفية."
            : metrics.concentrationIndex > 50
              ? "تركّز معتدل مع مجال لتوزيع أكثر توازناً."
              : "العرض موزّع بشكل معقول عبر المناطق."}
        </p>
      </div>

      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                المنطقة
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                العدد
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
              >
                % من التخصص
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.areaDistribution.map((area) => {
              const pct = (
                (area.count / metrics.totalCount) *
                100
              ).toFixed(1);
              return (
                <tr key={area.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {getArabicAreaName(area.slug)}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {area.count.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Geographic Gaps */}
      {supply && supply.geographicGaps.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              الفجوات الجغرافية
            </h2>
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
            مناطق دبي التي تخلو من أي كادر مرخّص في تخصص {nameAr}. تمثّل
            هذه المناطق فجوات وصول محتملة للمقيمين الذين يحتاجون هذا التخصص.
          </p>
          <div className="flex flex-wrap gap-2 mb-12">
            {supply.geographicGaps.map((gap) => (
              <span
                key={gap}
                className="bg-[#f8f8f6] border border-black/[0.06] px-3 py-1.5 font-['Geist',sans-serif] text-xs text-black/50"
              >
                {gap}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          صفحات ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <Link
          href={`/ar/professionals/${metrics.category}/${params.specialty}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            تصفّح دليل {nameAr}
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            ابحث عن متخصصي {nameAr} بشكل فردي
          </p>
        </Link>
        {spec.relatedDirectoryCategory && (
          <Link
            href={`/ar/best/doctors/${params.specialty}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              أفضل {nameAr} في دبي
            </h3>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
              المتخصصون الأعلى تقييماً من قِبل المرضى
            </p>
          </Link>
        )}
        <Link
          href={`/ar/workforce/category/${metrics.category}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            نظرة عامة على قوى {categoryNameAr}
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            جميع {categoryNameAr} في دبي
          </p>
        </Link>
        <Link
          href="/ar/workforce/overview"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.title}
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            النظرة الشاملة على القوى العاملة الصحية في دبي
          </p>
        </Link>
      </div>

      {/* Related Specialties */}
      {relatedSpecialties.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-12">
          {relatedSpecialties.map((rs) => (
            <Link
              key={rs.slug}
              href={`/ar/workforce/specialty/${rs.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
            >
              <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {rs.nameAr || rs.name}
              </p>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/30 mt-0.5">
                {rs.count.toLocaleString("ar-AE")}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* DHA Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> السجل الطبي المهني لهيئة صحة دبي (DHA) —
          شريان. تاريخ الجمع: {PROFESSIONAL_STATS.scraped}. تقدير الحجم السكاني:{" "}
          {DUBAI_POPULATION.toLocaleString("ar-AE")} نسمة (مركز دبي للإحصاء).
          معايير OECD تقديرية للسياق ولا تُقارَن مباشرةً نظراً للاختلافات
          في نطاق الترخيص والتركيبة السكانية. هذه الصفحة لأغراض تحليل سوق
          العمل المعلوماتية فحسب.
        </p>
      </div>
    </div>
  );
}
