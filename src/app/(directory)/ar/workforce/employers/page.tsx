import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllFacilities,
  getFacilitySizeDistribution,
  PROFESSIONAL_STATS,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "أكبر أصحاب العمل في قطاع الصحة بدبي — تصنيف المنشآت | Zavis",
    description:
      "قائمة مصنّفة بأكبر المنشآت الصحية في دبي حسب عدد العاملين. بيانات القوى العاملة من سجل شريان الطبي لهيئة الصحة بدبي. تصنيف الأحجام وتوزيع الفئات وعمق التخصصات.",
    alternates: {
      canonical: `${base}/ar/workforce/employers`,
      languages: {
        "en-AE": `${base}/workforce/employers`,
        "ar-AE": `${base}/ar/workforce/employers`,
      },
    },
    openGraph: {
      title: "أكبر أصحاب العمل في قطاع الصحة بدبي",
      description:
        "المنشآت الصحية في دبي مصنّفةً حسب عدد العاملين المرخّصين — من المستشفيات الكبرى إلى العيادات المتخصصة.",
      url: `${base}/ar/workforce/employers`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

function getSizeTierAr(staff: number): string {
  if (staff >= 500) return "عملاق";
  if (staff >= 100) return "كبير";
  if (staff >= 20) return "متوسط";
  return "صغير";
}

function getCategoryLabelAr(categories: Record<string, number>): string {
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "—";
  const topSlug = sorted[0][0];
  const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === topSlug);
  return cat?.nameAr || topSlug;
}

export default function ArEmployersPage() {
  const base = getBaseUrl();
  const facilities = getAllFacilities(5).slice(0, 50);
  const sizeDist = getFacilitySizeDistribution();

  return (
    <div
      dir="rtl"
      lang="ar"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "أكبر أصحاب العمل في قطاع الصحة بدبي",
          description: `أكبر 50 منشأة صحية في دبي مصنّفةً حسب عدد الكوادر المرخّصة من سجل شريان الطبي.`,
          url: `${base}/ar/workforce/employers`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.employers },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.employers },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          تصنيف أصحاب العمل
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          أكبر أصحاب العمل في القطاع الصحي بدبي
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة
          مصنّفة حسب عدد الكوادر المرخّصة من هيئة الصحة بدبي. بيانات من سجل
          شريان الطبي ({PROFESSIONAL_STATS.scraped}).
        </p>

        {/* توزيع فئات الأحجام */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "عملاق (500+)", count: sizeDist.mega },
            { label: "كبير (100-499)", count: sizeDist.large },
            { label: "متوسط (20-99)", count: sizeDist.mid },
            { label: "صغير (5-19)", count: sizeDist.small },
            { label: "مصغّر (<5)", count: sizeDist.micro },
          ].map(({ label, count }) => (
            <div key={label} className="bg-[#f8f8f6] p-3 text-center">
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828]">
                {count.toLocaleString("ar-AE")}
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {sizeDist.total.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
              إجمالي المنشآت
            </p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {sizeDist.medianStaff.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
              الوسيط (عدد الكوادر)
            </p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {sizeDist.averageStaff.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
              متوسط الكوادر
            </p>
          </div>
        </div>
      </div>

      {/* جدول أكبر 50 منشأة */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر 50 صاحب عمل في القطاع الصحي
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-3 w-8">
                #
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4">
                المنشأة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4">
                الكوادر
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4 hidden sm:table-cell">
                أبرز التخصصات
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4 hidden md:table-cell">
                الفئة السائدة
              </th>
              <th className="text-center font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden lg:table-cell">
                الحجم
              </th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 ps-3 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 ps-4">
                  <Link
                    href={`/ar/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 ps-4 text-left font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {fac.totalStaff.toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 ps-4 text-xs text-black/40 text-right hidden sm:table-cell">
                  {fac.topSpecialties[0]?.name || "—"}
                </td>
                <td className="py-2.5 ps-4 text-xs text-black/40 text-right hidden md:table-cell">
                  {getCategoryLabelAr(fac.categories)}
                </td>
                <td className="py-2.5 text-center hidden lg:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30 border border-black/10 px-2 py-0.5">
                    {getSizeTierAr(fac.totalStaff)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* كتلة الأسئلة الشائعة */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          من هم أكبر أصحاب العمل في قطاع الرعاية الصحية بدبي؟
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          أكبر صاحب عمل في قطاع الرعاية الصحية بدبي هو{" "}
          <strong>{facilities[0]?.name}</strong> بواقع{" "}
          {facilities[0]?.totalStaff.toLocaleString("ar-AE")} كادر مرخّص من
          هيئة الصحة بدبي، يليه{" "}
          <strong>{facilities[1]?.name}</strong> (
          {facilities[1]?.totalStaff.toLocaleString("ar-AE")} كادر) ثم{" "}
          <strong>{facilities[2]?.name}</strong> (
          {facilities[2]?.totalStaff.toLocaleString("ar-AE")} كادر). من إجمالي{" "}
          {sizeDist.total.toLocaleString("ar-AE")} منشأة مسجّلة، يتأهل{" "}
          {sizeDist.mega.toLocaleString("ar-AE")} فقط كمنشآت عملاقة (أكثر من 500
          كادر)، فيما يضم{" "}
          {(sizeDist.small + sizeDist.micro).toLocaleString("ar-AE")} منشأة
          أقل من 20 مهنياً مرخّصاً.
        </p>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تعكس أعداد
          الكوادر المهنيين المرخّصين من هيئة الصحة بدبي فقط وقد لا تشمل
          الموظفين غير السريريين. تحقق مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
