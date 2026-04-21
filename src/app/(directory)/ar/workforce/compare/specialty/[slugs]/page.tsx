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
  getSpecialtyWorkforceMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const top15 = [...PHYSICIAN_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const params: { slugs: string }[] = [];
  for (let i = 0; i < top15.length; i++) {
    for (let j = i + 1; j < top15.length; j++) {
      params.push({ slugs: `${top15[i].slug}-vs-${top15[j].slug}` });
    }
  }
  return params;
}

function parseSlugs(slugs: string): { slugA: string; slugB: string } | null {
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) return null;
  return { slugA: parts[0], slugB: parts[1] };
}

export function generateMetadata({ params }: Props): Metadata {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) return {};

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) return {};

  const base = getBaseUrl();
  const nameA = specA.nameAr || specA.name;
  const nameB = specB.nameAr || specB.name;
  return {
    title: `${nameA} مقابل ${nameB} — مقارنة القوى العاملة`,
    description: `قارن ${nameA} (${specA.count.toLocaleString("ar-AE")}) و${nameB} (${specB.count.toLocaleString("ar-AE")}) من مقاييس القوى العاملة في دبي. المعدلات للفرد ونسب الترخيص الدائم ونسب الاستشاريين وتركّز أصحاب العمل والتوزيع الجغرافي.`,
    alternates: {
      canonical: `${base}/ar/workforce/compare/specialty/${params.slugs}`,
      languages: {
        "en-AE": `${base}/workforce/compare/specialty/${params.slugs}`,
        "ar-AE": `${base}/ar/workforce/compare/specialty/${params.slugs}`,
      },
    },
    openGraph: {
      title: `${nameA} مقابل ${nameB} — مقارنة القوى العاملة`,
      description: `تحليل مقارن للقوى العاملة: ${specA.count.toLocaleString("ar-AE")} ${nameA} مقابل ${specB.count.toLocaleString("ar-AE")} ${nameB} في دبي.`,
      url: `${base}/ar/workforce/compare/specialty/${params.slugs}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCompareSpecialtyPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) notFound();

  const metricsA = getSpecialtyWorkforceMetrics(parsed.slugA);
  const metricsB = getSpecialtyWorkforceMetrics(parsed.slugB);
  if (!metricsA || !metricsB) notFound();

  const base = getBaseUrl();
  const nameA = specA.nameAr || specA.name;
  const nameB = specB.nameAr || specB.name;

  const rows: { label: string; a: string; b: string }[] = [
    { label: "إجمالي الكوادر", a: metricsA.totalCount.toLocaleString("ar-AE"), b: metricsB.totalCount.toLocaleString("ar-AE") },
    { label: "لكل 100,000 نسمة", a: metricsA.per100K.toLocaleString("ar-AE"), b: metricsB.per100K.toLocaleString("ar-AE") },
    { label: "معدل الترخيص الدائم", a: `${metricsA.license.ftlPercent}%`, b: `${metricsB.license.ftlPercent}%` },
    { label: "نسبة الاستشاريين", a: `${metricsA.consultantRatio}%`, b: `${metricsB.consultantRatio}%` },
    { label: "المتخصصون", a: metricsA.specialists.toLocaleString("ar-AE"), b: metricsB.specialists.toLocaleString("ar-AE") },
    { label: "الاستشاريون", a: metricsA.consultants.toLocaleString("ar-AE"), b: metricsB.consultants.toLocaleString("ar-AE") },
    { label: "تركّز أكبر 3 مناطق", a: `${metricsA.concentrationIndex}%`, b: `${metricsB.concentrationIndex}%` },
    { label: "المناطق المغطّاة", a: metricsA.areaDistribution.length.toString(), b: metricsB.areaDistribution.length.toString() },
  ];

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.compare, url: `${base}/ar/workforce/compare` },
          { name: `${nameA} مقابل ${nameB}` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.compare, href: "/ar/workforce/compare" },
          { label: `${nameA} مقابل ${nameB}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {nameA} مقابل {nameB}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          مقارنة قوى عاملة التخصصات &middot; دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            مقارنة مبنية على البيانات بين <strong>{nameA}</strong> ({metricsA.totalCount.toLocaleString("ar-AE")} كادر)
            و<strong>{nameB}</strong> ({metricsB.totalCount.toLocaleString("ar-AE")} كادر)
            في قطاع الرعاية الصحية بدبي. جميع البيانات مصدرها سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي.
          </p>
        </div>
      </div>

      {/* Side-by-Side Metrics */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نظرة عامة
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المؤشر
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                {nameA}
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                {nameB}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <span className="font-['Geist',sans-serif] text-sm text-black/60">
                    {row.label}
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {row.a}
                  </span>
                </td>
                <td className="py-2.5 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {row.b}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر أصحاب العمل
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameA}
          </h3>
          {metricsA.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">
                {fac.count}
              </span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB}
          </h3>
          {metricsB.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">
                {fac.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التوزيع الجغرافي
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameA} — أبرز المناطق
          </h3>
          {metricsA.areaDistribution.slice(0, 5).map((area) => (
            <div key={area.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/ar/workforce/area/${area.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {getArabicAreaName(area.slug) || area.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40 mr-2 shrink-0">
                {area.count}
              </span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB} — أبرز المناطق
          </h3>
          {metricsB.areaDistribution.slice(0, 5).map((area) => (
            <div key={area.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/ar/workforce/area/${area.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {getArabicAreaName(area.slug) || area.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40 mr-2 shrink-0">
                {area.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          استكشف المزيد
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {nameA}
          </h3>
          <div className="space-y-2">
            <Link href={`/ar/professionals/${specA.category}/${specA.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              الدليل الكامل ({metricsA.totalCount.toLocaleString("ar-AE")} كادر) &larr;
            </Link>
            <Link href={`/ar/workforce/career/${specA.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              الملف الوظيفي &larr;
            </Link>
            <Link href={`/ar/workforce/supply/${specA.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              تحليل العرض &larr;
            </Link>
          </div>
        </div>
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {nameB}
          </h3>
          <div className="space-y-2">
            <Link href={`/ar/professionals/${specB.category}/${specB.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              الدليل الكامل ({metricsB.totalCount.toLocaleString("ar-AE")} كادر) &larr;
            </Link>
            <Link href={`/ar/workforce/career/${specB.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              الملف الوظيفي &larr;
            </Link>
            <Link href={`/ar/workforce/supply/${specB.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              تحليل العرض &larr;
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}.
          هذه المقارنة لأغراض معلوماتية فقط ولا تُعدّ نصيحة طبية أو وظيفية.
        </p>
      </div>
    </div>
  );
}
