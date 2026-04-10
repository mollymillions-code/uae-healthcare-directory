import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllFacilities,
  PROFESSIONAL_STATS,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي حسب عدد الموظفين`,
    description: `أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي مصنّفين حسب عدد الموظفين المرخصين من هيئة الصحة بدبي. من مستشفى راشد إلى العيادات الخاصة — إجمالي الموظفين والتخصص الأبرز وبيانات القوى العاملة لكل منشأة.`,
    alternates: {
      canonical: `${base}/ar/workforce/rankings/top-employers`,
      languages: {
        "en-AE": `${base}/workforce/rankings/top-employers`,
        "ar-AE": `${base}/ar/workforce/rankings/top-employers`,
      },
    },
    openGraph: {
      title: `أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي`,
      description: `أكبر أصحاب العمل في قطاع الرعاية الصحية بدبي. ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مهني عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة.`,
      url: `${base}/ar/workforce/rankings/top-employers`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArTopEmployersPage() {
  const base = getBaseUrl();
  const facilities = getAllFacilities(1).slice(0, 50);

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي",
          description: `أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي حسب عدد الموظفين المرخصين.`,
          url: `${base}/ar/workforce/rankings/top-employers`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.rankings, url: `${base}/ar/workforce/rankings` },
          { name: ar.workforce.topEmployers },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.rankings, href: "/ar/workforce/rankings" },
          { label: ar.workforce.topEmployers },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          تصنيفات أصحاب العمل
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          مصنّفون حسب إجمالي الموظفين المرخصين &middot; البيانات كما في{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            أكبر 50 صاحب عمل في قطاع الرعاية الصحية بدبي، مصنّفون حسب عدد المهنيين المرخصين
            من هيئة الصحة بدبي. انقر على أي منشأة لعرض ملفها الكامل للقوى العاملة بما يشمل
            تفصيل الفئات والتخصصات الأبرز ومعايير التوظيف.
          </p>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="flex flex-wrap gap-3 mb-8">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/ar/workforce/rankings/top-employers/${cat.slug}`}
            className="border border-black/[0.06] px-4 py-2 hover:border-[#006828]/15 transition-colors group"
          >
            <span className="font-['Geist',sans-serif] text-xs text-black/60 group-hover:text-[#006828] transition-colors">
              أكبر {cat.nameAr}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مصنّفون حسب إجمالي الموظفين
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
                إجمالي الموظفين
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                التخصص الأبرز
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                التخصصات
              </th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.totalStaff.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-right hidden sm:table-cell">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {fac.topSpecialties[0]?.name || "--"}
                    {fac.topSpecialties[0]
                      ? ` (${fac.topSpecialties[0].count})`
                      : ""}
                  </span>
                </td>
                <td className="py-2.5 text-left hidden md:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {Object.keys(fac.specialties).length}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تعكس أعداد الموظفين المهنيين
          المرخصين من هيئة الصحة بدبي فقط وقد لا تشمل الموظفين الإداريين أو الداعمين. تحقق
          من أوراق الاعتماد مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
