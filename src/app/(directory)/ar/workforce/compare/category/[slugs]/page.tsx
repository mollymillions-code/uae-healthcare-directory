import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_CATEGORIES, PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import { getCategoryWorkforceProfile } from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const cats = PROFESSIONAL_CATEGORIES;
  const params: { slugs: string }[] = [];
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      params.push({ slugs: `${cats[i].slug}-vs-${cats[j].slug}` });
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

  const catA = PROFESSIONAL_CATEGORIES.find((c) => c.slug === parsed.slugA);
  const catB = PROFESSIONAL_CATEGORIES.find((c) => c.slug === parsed.slugB);
  if (!catA || !catB) return {};

  const base = getBaseUrl();
  const nameA = catA.nameAr || catA.name;
  const nameB = catB.nameAr || catB.name;
  return {
    title: `${nameA} مقابل ${nameB} — مقارنة فئات القوى العاملة`,
    description: `قارن ${nameA} (${catA.count.toLocaleString("ar-AE")}) و${nameB} (${catB.count.toLocaleString("ar-AE")}) في دبي. المعدلات للفرد والترخيص وأكبر أصحاب العمل والتخصصات والتوزيع الجغرافي.`,
    alternates: {
      canonical: `${base}/ar/workforce/compare/category/${params.slugs}`,
      languages: {
        "en-AE": `${base}/workforce/compare/category/${params.slugs}`,
        "ar-AE": `${base}/ar/workforce/compare/category/${params.slugs}`,
      },
    },
    openGraph: {
      title: `${nameA} مقابل ${nameB} — مقارنة فئات القوى العاملة`,
      description: `تحليل مقارن بين ${nameA} و${nameB} في منظومة الرعاية الصحية بدبي.`,
      url: `${base}/ar/workforce/compare/category/${params.slugs}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCompareCategoryPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const profileA = getCategoryWorkforceProfile(parsed.slugA);
  const profileB = getCategoryWorkforceProfile(parsed.slugB);
  if (!profileA || !profileB) notFound();

  const base = getBaseUrl();
  const catAInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === parsed.slugA);
  const catBInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === parsed.slugB);
  const nameA = catAInfo?.nameAr || profileA.name;
  const nameB = catBInfo?.nameAr || profileB.name;

  const rows: { label: string; a: string; b: string }[] = [
    { label: "إجمالي الكوادر", a: profileA.totalCount.toLocaleString("ar-AE"), b: profileB.totalCount.toLocaleString("ar-AE") },
    { label: "% من إجمالي القوى العاملة", a: `${profileA.percentOfWorkforce}%`, b: `${profileB.percentOfWorkforce}%` },
    { label: "لكل 100,000 نسمة", a: profileA.per100K.toLocaleString("ar-AE"), b: profileB.per100K.toLocaleString("ar-AE") },
    { label: "معدل الترخيص الدائم", a: `${profileA.license.ftlPercent}%`, b: `${profileB.license.ftlPercent}%` },
    { label: "معدل الترخيص العادي", a: `${profileA.license.regPercent}%`, b: `${profileB.license.regPercent}%` },
    { label: "التخصصات النشطة", a: profileA.specialties.length.toString(), b: profileB.specialties.length.toString() },
    { label: "المناطق المغطّاة", a: profileA.areaDistribution.length.toString(), b: profileB.areaDistribution.length.toString() },
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
          مقارنة فئات القوى العاملة &middot; دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            مقارنة بين <strong>{nameA}</strong> ({profileA.totalCount.toLocaleString("ar-AE")} كادر، {profileA.percentOfWorkforce}% من القوى العاملة)
            و<strong>{nameB}</strong> ({profileB.totalCount.toLocaleString("ar-AE")} كادر، {profileB.percentOfWorkforce}% من القوى العاملة)
            في منظومة الرعاية الصحية بدبي.
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

      {/* Metrics Table */}
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

      {/* Top Employers */}
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
          {profileA.topEmployers.slice(0, 8).map((emp, i) => (
            <div key={emp.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${emp.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {emp.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">{emp.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB}
          </h3>
          {profileB.topEmployers.slice(0, 8).map((emp, i) => (
            <div key={emp.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/ar/professionals/facility/${emp.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {emp.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">{emp.count}</span>
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
          {profileA.specialties.slice(0, 10).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count.toLocaleString("ar-AE")}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {nameB}
          </h3>
          {profileB.specialties.slice(0, 10).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count.toLocaleString("ar-AE")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/ar/professionals/${profileA.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          تصفح جميع {nameA} &larr;
        </Link>
        <Link href={`/ar/professionals/${profileB.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          تصفح جميع {nameB} &larr;
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
