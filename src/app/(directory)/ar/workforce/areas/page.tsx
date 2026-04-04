import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAreaStats,
  getAreaWorkforceProfile,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "القوى العاملة الصحية حسب المنطقة في دبي — التوزيع الجغرافي | Zavis",
    description:
      "التوزيع الجغرافي للمهنيين الصحيين عبر أحياء دبي ومناطقها الطبية. أعداد القوى العاملة على مستوى المناطق وتركّزات التخصصات وكثافة التوظيف من سجل شريان.",
    alternates: {
      canonical: `${base}/ar/workforce/areas`,
      languages: {
        "en-AE": `${base}/workforce/areas`,
        "ar-AE": `${base}/ar/workforce/areas`,
      },
    },
    openGraph: {
      title: "القوى العاملة الصحية حسب المنطقة في دبي",
      description:
        "أين يتمركز المهنيون الصحيون في دبي؟ تحليل القوى العاملة منطقةً بمنطقة من سجل شريان.",
      url: `${base}/ar/workforce/areas`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArAreasPage() {
  const base = getBaseUrl();
  const areas = getAreaStats();

  const areaProfiles = areas.map((area) => {
    const profile = getAreaWorkforceProfile(area.slug);
    const physicians =
      profile?.categories.find((c) => c.slug === "physicians")?.count || 0;
    const nurses =
      profile?.categories.find((c) => c.slug === "nurses")?.count || 0;
    return {
      ...area,
      physicians,
      nurses,
    };
  });

  const totalMapped = areas.reduce((sum, a) => sum + a.count, 0);

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
          name: "القوى العاملة الصحية حسب المنطقة في دبي",
          description: `التوزيع الجغرافي للمهنيين الصحيين عبر ${areas.length} منطقة مرسومة في دبي.`,
          url: `${base}/ar/workforce/areas`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.areas },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.areas },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          التوزيع الجغرافي
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          القوى العاملة الصحية حسب المنطقة
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          {areas.length.toLocaleString("ar-AE")} منطقة تضم 10 مهنيين صحيين أو
          أكثر، مرسومة من عناوين المنشآت. تغطي{" "}
          {totalMapped.toLocaleString("ar-AE")} مهنياً (
          {Math.round((totalMapped / PROFESSIONAL_STATS.total) * 100)}% من
          إجمالي القوى العاملة).
        </p>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {areas.length.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              مناطق مرسومة
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {getArabicAreaName(areas[0]?.slug) || areas[0]?.name || "—"}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              أكبر تجمع ({areas[0]?.count.toLocaleString("ar-AE")})
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {totalMapped.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              مهنيون مرسومون
            </p>
          </div>
        </div>
      </div>

      {/* جدول المناطق */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع المناطق مصنّفةً حسب حجم القوى العاملة
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4">
                المنطقة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4">
                الإجمالي
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4 hidden sm:table-cell">
                الأطباء
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4 hidden sm:table-cell">
                الممرضون
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                أبرز التخصصات
              </th>
            </tr>
          </thead>
          <tbody>
            {areaProfiles.map((area) => {
              const barWidth = areas[0]
                ? Math.round((area.count / areas[0].count) * 100)
                : 0;
              const arabicName = getArabicAreaName(area.slug) || area.name;
              return (
                <tr key={area.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pe-4">
                    <Link
                      href={`/ar/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {arabicName}
                    </Link>
                    <div className="h-1 bg-[#f8f8f6] mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[#006828]/30"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 ps-4 text-left font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {area.count.toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 ps-4 text-left font-['Geist_Mono',monospace] text-sm text-black/40 hidden sm:table-cell">
                    {area.physicians.toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 ps-4 text-left font-['Geist_Mono',monospace] text-sm text-black/40 hidden sm:table-cell">
                    {area.nurses.toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 text-xs text-black/40 text-right hidden md:table-cell">
                    {area.topSpecialties[0]?.name || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* كتلة الأسئلة الشائعة */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          أين يتمركز المهنيون الصحيون في دبي؟
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          يتركّز المهنيون الصحيون في دبي بشكل أكبر في{" "}
          <strong>
            {getArabicAreaName(areas[0]?.slug) || areas[0]?.name}
          </strong>{" "}
          ({areas[0]?.count.toLocaleString("ar-AE")} مهنياً)، يليها{" "}
          <strong>
            {getArabicAreaName(areas[1]?.slug) || areas[1]?.name}
          </strong>{" "}
          ({areas[1]?.count.toLocaleString("ar-AE")}) و{" "}
          <strong>
            {getArabicAreaName(areas[2]?.slug) || areas[2]?.name}
          </strong>{" "}
          ({areas[2]?.count.toLocaleString("ar-AE")}). تمثّل أكبر 3 مناطق{" "}
          {Math.round(
            ((areas[0]?.count + areas[1]?.count + areas[2]?.count) /
              totalMapped) *
              100
          )}
          % من إجمالي المهنيين الصحيين المرسومين جغرافياً، مما يعكس هيمنة
          مدينة دبي الطبية وكبرى مجمعات المستشفيات.
        </p>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. يستند تعيين
          المناطق إلى مطابقة أسماء المنشآت وقد لا يشمل جميع المهنيين. لا يمكن
          رسم جميع المنشآت جغرافياً لمنطقة محددة. تحقق مع هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
