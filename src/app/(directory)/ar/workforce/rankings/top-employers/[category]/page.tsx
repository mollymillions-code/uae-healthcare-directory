import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getTopEmployersByCategory,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string };
}

const CATEGORY_SLUGS = ["physicians", "dentists", "nurses", "allied-health"];

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

function getCategoryMeta(slug: string) {
  return PROFESSIONAL_CATEGORIES.find((c) => c.slug === slug);
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryMeta(params.category);
  if (!cat) {
    return {
      title: "أكبر أصحاب العمل حسب الفئة",
      description: "أكبر أصحاب العمل في الرعاية الصحية بدبي حسب الفئة المهنية.",
    };
  }
  const base = getBaseUrl();
  return {
    title: `أكبر أصحاب عمل ${cat.nameAr} في دبي — ${cat.count.toLocaleString("ar-AE")} كادر مرخص`,
    description: `منشآت دبي مصنّفةً حسب عدد ${cat.nameAr} المرخصين. ${cat.count.toLocaleString("ar-AE")} كادر مهني عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة.`,
    alternates: {
      canonical: `${base}/ar/workforce/rankings/top-employers/${cat.slug}`,
      languages: {
        "en-AE": `${base}/workforce/rankings/top-employers/${cat.slug}`,
        "ar-AE": `${base}/ar/workforce/rankings/top-employers/${cat.slug}`,
      },
    },
    openGraph: {
      title: `أكبر أصحاب عمل ${cat.nameAr} في دبي`,
      description: `أي منشآت دبي توظّف أكبر عدد من ${cat.nameAr}؟ مصنّفةً حسب عدد الموظفين المرخصين.`,
      url: `${base}/ar/workforce/rankings/top-employers/${cat.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArTopEmployersByCategoryPage({ params }: Props) {
  const cat = getCategoryMeta(params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const employers = getTopEmployersByCategory(cat.slug, 50);

  if (employers.length === 0) notFound();

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `أكبر أصحاب عمل ${cat.nameAr} في دبي`,
          description: `منشآت دبي مصنّفةً حسب عدد ${cat.nameAr} المرخصين.`,
          url: `${base}/ar/workforce/rankings/top-employers/${cat.slug}`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.rankings, url: `${base}/ar/workforce/rankings` },
          {
            name: ar.workforce.topEmployers,
            url: `${base}/ar/workforce/rankings/top-employers`,
          },
          { name: cat.nameAr },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.rankings, href: "/ar/workforce/rankings" },
          { label: ar.workforce.topEmployers, href: "/ar/workforce/rankings/top-employers" },
          { label: cat.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          تصنيفات أصحاب العمل حسب الفئة
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أكبر أصحاب عمل {cat.nameAr} في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {cat.count.toLocaleString("ar-AE")} {cat.nameAr} مرخص &middot; البيانات كما في{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            منشآت الرعاية الصحية بدبي مصنّفةً حسب عدد {cat.nameAr} المرخصين من هيئة الصحة
            بدبي. {cat.description}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {cat.count.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            إجمالي {cat.nameAr}
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {Math.round((cat.count / PROFESSIONAL_STATS.total) * 100)}%
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            حصة من القوى العاملة
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {employers.length}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            منشآت مُصنَّفة
          </p>
        </div>
      </div>

      {/* Other Categories */}
      <div className="flex flex-wrap gap-3 mb-8">
        {PROFESSIONAL_CATEGORIES.filter((c) => c.slug !== cat.slug).map(
          (c) => (
            <Link
              key={c.slug}
              href={`/ar/workforce/rankings/top-employers/${c.slug}`}
              className="border border-black/[0.06] px-4 py-2 hover:border-[#006828]/15 transition-colors group"
            >
              <span className="font-['Geist',sans-serif] text-xs text-black/60 group-hover:text-[#006828] transition-colors">
                أكبر {c.nameAr}
              </span>
            </Link>
          )
        )}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          المنشآت مصنّفةً حسب عدد {cat.nameAr}
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
                المنشأة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                {cat.nameAr}
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                إجمالي الموظفين
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                % من الموظفين
              </th>
            </tr>
          </thead>
          <tbody>
            {employers.map((emp, i) => {
              const pct =
                emp.totalStaff > 0
                  ? ((emp.count / emp.totalStaff) * 100).toFixed(1)
                  : "0.0";
              return (
                <tr key={emp.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                    {(i + 1).toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/employer/${emp.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {emp.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {emp.count.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left hidden sm:table-cell">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {emp.totalStaff.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5 text-left hidden md:table-cell">
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

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تعكس أعداد الموظفين المهنيين
          المرخصين فقط. تحقق من أوراق الاعتماد مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
