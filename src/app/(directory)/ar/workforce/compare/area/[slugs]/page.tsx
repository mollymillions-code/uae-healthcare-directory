import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import {
  getAreaWorkforceProfile,
  getTopAreas,
} from "@/lib/workforce";
import { DUBAI_AREAS } from "@/lib/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const top10 = getTopAreas(10);
  const params: { slugs: string }[] = [];
  for (let i = 0; i < top10.length; i++) {
    for (let j = i + 1; j < top10.length; j++) {
      params.push({ slugs: `${top10[i].slug}-vs-${top10[j].slug}` });
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

  const areaA = DUBAI_AREAS.find((a) => a.slug === parsed.slugA);
  const areaB = DUBAI_AREAS.find((a) => a.slug === parsed.slugB);
  if (!areaA || !areaB) return {};

  const base = getBaseUrl();
  const nameA = getArabicAreaName(areaA.slug) || areaA.name;
  const nameB = getArabicAreaName(areaB.slug) || areaB.name;
  return {
    title: `${nameA} مقابل ${nameB} — مقارنة القوى العاملة`,
    description: `قارن القوى العاملة الصحية في ${nameA} و${nameB} بدبي. أعداد الكوادر وتوزيع الفئات وأنواع التراخيص وأبرز التخصصات وترتيب أصحاب العمل جنباً إلى جنب.`,
    alternates: {
      canonical: `${base}/ar/workforce/compare/area/${params.slugs}`,
      languages: {
        "en-AE": `${base}/workforce/compare/area/${params.slugs}`,
        "ar-AE": `${base}/ar/workforce/compare/area/${params.slugs}`,
      },
    },
    openGraph: {
      title: `${nameA} مقابل ${nameB} — مقارنة القوى العاملة`,
      description: `تحليل مقارن للقوى العاملة الصحية في ${nameA} و${nameB} بدبي.`,
      url: `${base}/ar/workforce/compare/area/${params.slugs}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCompareAreaPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const profileA = getAreaWorkforceProfile(parsed.slugA);
  const profileB = getAreaWorkforceProfile(parsed.slugB);
  if (!profileA || !profileB) notFound();

  const base = getBaseUrl();
  const nameA = getArabicAreaName(profileA.slug) || profileA.name;
  const nameB = getArabicAreaName(profileB.slug) || profileB.name;

  const rows: { label: string; a: string; b: string }[] = [
    { label: "إجمالي الكوادر", a: profileA.totalCount.toLocaleString("ar-AE"), b: profileB.totalCount.toLocaleString("ar-AE") },
    { label: "لكل 100,000 نسمة", a: profileA.per100K.toLocaleString("ar-AE"), b: profileB.per100K.toLocaleString("ar-AE") },
    { label: "معدل الترخيص الدائم", a: `${profileA.license.ftlPercent}%`, b: `${profileB.license.ftlPercent}%` },
    { label: "الفئات النشطة", a: profileA.categories.length.toString(), b: profileB.categories.length.toString() },
    { label: "التخصصات المتتبَّعة", a: profileA.topSpecialties.length.toString(), b: profileB.topSpecialties.length.toString() },
    { label: "المنشآت", a: profileA.topFacilities.length.toString(), b: profileB.topFacilities.length.toString() },
  ];

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          مقارنة قوى عاملة المناطق &middot; دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            مقارنة القوى العاملة الصحية في <strong>{nameA}</strong> ({profileA.totalCount.toLocaleString("ar-AE")} كادر)
            و<strong>{nameB}</strong> ({profileB.totalCount.toLocaleString("ar-AE")} كادر).
            البيانات مصدرها سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileA.totalCount.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{nameA}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileB.totalCount.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{nameB}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileA.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{nameA} لكل 100K</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileB.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{nameB} لكل 100K</p>
        </div>
      </div>

      {/* Side-by-Side Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          المؤشرات الرئيسية
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">المؤشر</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">{nameA}</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{nameB}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <span className="font-['Geist',sans-serif] text-sm text-black/60">{row.label}</span>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{row.a}</span>
                </td>
                <td className="py-2.5 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{row.b}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع الفئات المهنية
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameA}
          </h3>
          {profileA.categories.map((cat) => (
            <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold">{cat.count.toLocaleString("ar-AE")}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB}
          </h3>
          {profileB.categories.map((cat) => (
            <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold">{cat.count.toLocaleString("ar-AE")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز التخصصات
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameA}
          </h3>
          {profileA.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB}
          </h3>
          {profileB.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز المنشآت
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameA}
          </h3>
          {profileA.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">{fac.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB}
          </h3>
          {profileB.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">{fac.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/ar/workforce/area/${profileA.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          ملف القوى العاملة في {nameA} &larr;
        </Link>
        <Link href={`/ar/workforce/area/${profileB.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          ملف القوى العاملة في {nameB} &larr;
        </Link>
        <Link href="/ar/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          جميع المقارنات &larr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}.
          هذه المقارنة لأغراض معلوماتية فقط.
        </p>
      </div>
    </div>
  );
}
