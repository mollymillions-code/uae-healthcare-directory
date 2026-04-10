import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const count = ALL_SPECIALTIES.filter((s) => s.count >= 10).length;
  return {
    title: `جميع التخصصات الطبية الـ ${count} في دبي مصنّفةً حسب الحجم`,
    description: `كل تخصص طبي تتابعه هيئة الصحة بدبي مصنّفاً حسب عدد الكوادر المرخصة. من الأطباء العامين (${ALL_SPECIALTIES[0]?.count.toLocaleString("ar-AE")}) إلى التخصصات الدقيقة. معدلات للفرد وتوزيع الفئات.`,
    alternates: {
      canonical: `${base}/ar/workforce/rankings/largest-specialties`,
      languages: {
        "en-AE": `${base}/workforce/rankings/largest-specialties`,
        "ar-AE": `${base}/ar/workforce/rankings/largest-specialties`,
      },
    },
    openGraph: {
      title: `جميع التخصصات الطبية في دبي مصنّفةً حسب الحجم`,
      description: `التصنيف الكامل للتخصصات لـ ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي مرخص في دبي.`,
      url: `${base}/ar/workforce/rankings/largest-specialties`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

const DUBAI_POPULATION = 3_660_000;

export default function ArLargestSpecialtiesPage() {
  const base = getBaseUrl();
  const specialties = [...ALL_SPECIALTIES]
    .filter((s) => s.count >= 10)
    .sort((a, b) => b.count - a.count);

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "جميع التخصصات الطبية في دبي مصنّفةً حسب الحجم",
          description: `${specialties.length} تخصصاً طبياً مصنّفاً حسب عدد الكوادر المرخصة من هيئة الصحة بدبي.`,
          url: `${base}/ar/workforce/rankings/largest-specialties`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.rankings, url: `${base}/ar/workforce/rankings` },
          { name: ar.workforce.largestSpecialties },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.rankings, href: "/ar/workforce/rankings" },
          { label: ar.workforce.largestSpecialties },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          تصنيفات التخصصات
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          جميع التخصصات الطبية في دبي — مصنّفةً حسب الحجم
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {specialties.length.toLocaleString("ar-AE")} تخصصاً &middot;{" "}
          {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} إجمالي الكوادر &middot; البيانات
          كما في {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            كل تخصص طبي يتابعه سجل شريان التابع لهيئة الصحة بدبي، مصنّفاً حسب عدد الكوادر
            المرخصة. يشمل هذا الجدول الفئات الأربع للقوى العاملة — الأطباء وأطباء الأسنان
            والممرضون والمهنيون الصحيون المساندون — مع معدلات للفرد بناءً على التعداد السكاني
            المُقدَّر لدبي البالغ {DUBAI_POPULATION.toLocaleString("ar-AE")} نسمة.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const catSpecs = specialties.filter((s) => s.category === cat.slug);
          return (
            <div key={cat.slug} className="bg-[#f8f8f6] p-4 text-center">
              <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
                {catSpecs.length}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
                تخصصات {cat.nameAr}
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع التخصصات مصنّفةً
        </h2>
      </div>
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
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الفئة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                العدد
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden md:table-cell">
                لكل 100K
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % من الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {specialties.map((spec, i) => {
              const cat = PROFESSIONAL_CATEGORIES.find(
                (c) => c.slug === spec.category
              );
              const pct = (
                (spec.count / PROFESSIONAL_STATS.total) *
                100
              ).toFixed(1);
              const per100K = (
                (spec.count / DUBAI_POPULATION) *
                100000
              ).toFixed(1);
              return (
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
                  <td className="py-2.5 pl-4 text-right hidden sm:table-cell">
                    <span className="font-['Geist',sans-serif] text-xs text-black/40">
                      {cat?.nameAr || cat?.name || spec.category}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {spec.count.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left hidden md:table-cell">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {per100K}
                    </span>
                  </td>
                  <td className="py-2.5 text-left">
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

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تحليلات ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/ar/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.specialistPerCapita}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            الأخصائيون لكل 100,000 نسمة مع مقارنات منظمة الصحة العالمية
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
            معدلات تراخيص الممارسة المستقلة عبر جميع التخصصات
          </p>
        </Link>
        <Link
          href="/ar/workforce/rankings/top-employers"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.topEmployers}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            أكبر المنشآت الصحية مصنّفةً حسب عدد الموظفين
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. التخصصات التي تضم أقل من 10 مهنيين
          مرخصين مستبعدة. التعداد السكاني المُقدَّر: {DUBAI_POPULATION.toLocaleString("ar-AE")}{" "}
          (مركز دبي للإحصاء). تحقق من أوراق الاعتماد مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
