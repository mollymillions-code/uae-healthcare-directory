import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_STATS, PROFESSIONAL_CATEGORIES } from "@/lib/constants/professionals";
import {
  getFacilityBenchmarks,
  getTopFacilities,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const top20 = getTopFacilities(20);
  const params: { slugs: string }[] = [];
  for (let i = 0; i < top20.length; i++) {
    for (let j = i + 1; j < top20.length; j++) {
      params.push({ slugs: `${top20[i].slug}-vs-${top20[j].slug}` });
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

  const benchA = getFacilityBenchmarks(parsed.slugA);
  const benchB = getFacilityBenchmarks(parsed.slugB);
  if (!benchA || !benchB) return {};

  const base = getBaseUrl();
  return {
    title: `${benchA.name} مقابل ${benchB.name} — مقارنة أصحاب العمل`,
    description: `قارن ${benchA.name} (${benchA.totalStaff.toLocaleString("ar-AE")} موظف) و${benchB.name} (${benchB.totalStaff.toLocaleString("ar-AE")} موظف) في دبي. حجم الكوادر ونسبة الممرضين إلى الأطباء ومعدل الترخيص الدائم واتساع التخصصات وتوزيع الفئات.`,
    alternates: {
      canonical: `${base}/ar/workforce/compare/employer/${params.slugs}`,
      languages: {
        "en-AE": `${base}/workforce/compare/employer/${params.slugs}`,
        "ar-AE": `${base}/ar/workforce/compare/employer/${params.slugs}`,
      },
    },
    openGraph: {
      title: `${benchA.name} مقابل ${benchB.name} — مقارنة أصحاب العمل`,
      description: `تحليل مقارن لأصحاب العمل في الرعاية الصحية بدبي.`,
      url: `${base}/ar/workforce/compare/employer/${params.slugs}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

function sizeTierLabelAr(tier: string): string {
  const labels: Record<string, string> = {
    mega: "عملاق (500+ موظف)",
    large: "كبير (100-499)",
    mid: "متوسط (20-99)",
    small: "صغير (5-19)",
    micro: "مصغّر (أقل من 5)",
  };
  return labels[tier] || tier;
}

export default function ArCompareEmployerPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const benchA = getFacilityBenchmarks(parsed.slugA);
  const benchB = getFacilityBenchmarks(parsed.slugB);
  if (!benchA || !benchB) notFound();

  const base = getBaseUrl();

  const rows: { label: string; a: string; b: string }[] = [
    { label: "إجمالي الموظفين", a: benchA.totalStaff.toLocaleString("ar-AE"), b: benchB.totalStaff.toLocaleString("ar-AE") },
    { label: "فئة الحجم", a: sizeTierLabelAr(benchA.sizeTier), b: sizeTierLabelAr(benchB.sizeTier) },
    { label: "الأطباء", a: benchA.physicians.toLocaleString("ar-AE"), b: benchB.physicians.toLocaleString("ar-AE") },
    { label: "أطباء الأسنان", a: benchA.dentists.toLocaleString("ar-AE"), b: benchB.dentists.toLocaleString("ar-AE") },
    { label: "الممرضون", a: benchA.nurses.toLocaleString("ar-AE"), b: benchB.nurses.toLocaleString("ar-AE") },
    { label: "الكوادر الصحية المساندة", a: benchA.alliedHealth.toLocaleString("ar-AE"), b: benchB.alliedHealth.toLocaleString("ar-AE") },
    { label: "نسبة الممرضين إلى الأطباء", a: benchA.nurseToDoctorRatio.toFixed(2), b: benchB.nurseToDoctorRatio.toFixed(2) },
    { label: "معدل الترخيص الدائم", a: `${benchA.ftlRate}%`, b: `${benchB.ftlRate}%` },
    { label: "اتساع التخصصات", a: `${benchA.specialtyBreadth} تخصصاً`, b: `${benchB.specialtyBreadth} تخصصاً` },
  ];

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.compare, url: `${base}/ar/workforce/compare` },
          { name: `${benchA.name} مقابل ${benchB.name}` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.compare, href: "/ar/workforce/compare" },
          { label: `${benchA.name} مقابل ${benchB.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {benchA.name} مقابل {benchB.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          مقارنة قوى عاملة أصحاب العمل &middot; دبي
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            مقارنة بين <strong>{benchA.name}</strong> ({benchA.totalStaff.toLocaleString("ar-AE")} كادر مرخص)
            و<strong>{benchB.name}</strong> ({benchB.totalStaff.toLocaleString("ar-AE")} كادر مرخص).
            تشمل المؤشرات مستويات التوظيف ونسب الممرضين إلى الأطباء وأنماط الترخيص وتغطية التخصصات.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchA.totalStaff.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchA.name}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchB.totalStaff.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchB.name}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchA.nurseToDoctorRatio.toFixed(2)}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchA.name} نسبة م:ط</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchB.nurseToDoctorRatio.toFixed(2)}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchB.name} نسبة م:ط</p>
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
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">{benchA.name}</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{benchB.name}</th>
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

      {/* Category Composition */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تكوين الفئات المهنية
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {benchA.name}
          </h3>
          {PROFESSIONAL_CATEGORIES.map((cat) => {
            const count = benchA.categories[cat.slug] || 0;
            if (count === 0) return null;
            const pct = benchA.totalStaff > 0 ? ((count / benchA.totalStaff) * 100).toFixed(1) : "0";
            return (
              <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
                <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.nameAr || cat.name}</span>
                <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{count.toLocaleString("ar-AE")} ({pct}%)</span>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {benchB.name}
          </h3>
          {PROFESSIONAL_CATEGORIES.map((cat) => {
            const count = benchB.categories[cat.slug] || 0;
            if (count === 0) return null;
            const pct = benchB.totalStaff > 0 ? ((count / benchB.totalStaff) * 100).toFixed(1) : "0";
            return (
              <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
                <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.nameAr || cat.name}</span>
                <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{count.toLocaleString("ar-AE")} ({pct}%)</span>
              </div>
            );
          })}
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
            {benchA.name}
          </h3>
          {benchA.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {benchB.name}
          </h3>
          {benchB.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/ar/professionals/facility/${benchA.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          ملف منشأة {benchA.name} &larr;
        </Link>
        <Link href={`/ar/professionals/facility/${benchB.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          ملف منشأة {benchB.name} &larr;
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
          هذه المقارنة لأغراض معلوماتية فقط ولا تُعدّ نصيحة وظيفية.
        </p>
      </div>
    </div>
  );
}
