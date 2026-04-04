import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import {
  getAreaWorkforceProfile,
  getAreaStats,
} from "@/lib/workforce";
import { DUBAI_AREAS } from "@/lib/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { area: string };
}

export function generateStaticParams() {
  return getAreaStats()
    .filter((a) => a.count >= 10)
    .map((a) => ({ area: a.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  if (!areaInfo) return {};

  const profile = getAreaWorkforceProfile(params.area);
  if (!profile) return {};

  const base = getBaseUrl();
  const arabicName = getArabicAreaName(params.area) || areaInfo.name;

  return {
    title: `الملف الوظيفي لمنطقة ${arabicName} — ${profile.totalCount.toLocaleString("ar-AE")} مهنياً | Zavis`,
    description: `معلومات القوى العاملة الصحية في ${arabicName}، دبي. ${profile.totalCount.toLocaleString("ar-AE")} مهنياً مرخّصاً من هيئة الصحة بدبي، توزيع الفئات، أنواع التراخيص، أبرز التخصصات والمنشآت.`,
    alternates: {
      canonical: `${base}/ar/workforce/area/${areaInfo.slug}`,
      languages: {
        "en-AE": `${base}/workforce/area/${areaInfo.slug}`,
        "ar-AE": `${base}/ar/workforce/area/${areaInfo.slug}`,
      },
    },
    openGraph: {
      title: `الملف الوظيفي لمنطقة ${arabicName}`,
      description: `${profile.totalCount.toLocaleString("ar-AE")} مهنياً صحياً في ${arabicName}، دبي.`,
      url: `${base}/ar/workforce/area/${areaInfo.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArAreaWorkforcePage({ params }: Props) {
  const profile = getAreaWorkforceProfile(params.area);
  if (!profile) notFound();

  const base = getBaseUrl();
  const arabicName = getArabicAreaName(params.area) || profile.name;
  const categoriesWithEnough = profile.categories.filter((c) => c.count >= 10);

  // Arabic category name map
  const catNameAr: Record<string, string> = {
    physicians: "الأطباء",
    dentists: "أطباء الأسنان",
    nurses: "الممرضون والقابلات",
    "allied-health": "المهنيون الصحيون المساندون",
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.areas, url: `${base}/ar/workforce/areas` },
          { name: arabicName },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.areas, href: "/ar/workforce/areas" },
          { label: arabicName },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {arabicName} — الملف الوظيفي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalCount.toLocaleString("ar-AE")} مهنياً مرخّصاً من هيئة الصحة بدبي &middot;{" "}
          {profile.per100K} لكل 100 ألف نسمة
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تضم منطقة {arabicName} {profile.totalCount.toLocaleString("ar-AE")} مهنياً
            صحياً مرخّصاً من هيئة الصحة بدبي، وهو ما يمثّل نحو{" "}
            {((profile.totalCount / PROFESSIONAL_STATS.total) * 100).toFixed(1)}%
            من إجمالي القوى العاملة الصحية في دبي. تبلغ كثافة المنطقة من
            المهنيين الصحيين {profile.per100K} لكل 100,000 مقيم.
          </p>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {profile.totalCount.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">إجمالي المهنيين</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">لكل 100 ألف نسمة</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.license.ftlPercent}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">معدل الترخيص الدائم</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {profile.topFacilities.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">منشآت نشطة</p>
        </div>
      </div>

      {/* توزيع الفئات */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع الفئات
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {profile.categories.map((cat) => {
          const pct = ((cat.count / profile.totalCount) * 100).toFixed(1);
          return (
            <div key={cat.slug} className="border border-black/[0.06] p-4">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
                {catNameAr[cat.slug] || cat.name}
              </h3>
              <p className="text-xl font-bold text-[#006828] mb-1">
                {cat.count.toLocaleString("ar-AE")}
              </p>
              <div className="w-full bg-black/[0.04] h-1.5 mb-1">
                <div className="bg-[#006828] h-1.5" style={{ width: `${pct}%` }} />
              </div>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {pct}% من قوى عمل المنطقة
              </p>
            </div>
          );
        })}
      </div>

      {/* توزيع التراخيص */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع التراخيص
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            FTL (ترخيص دائم)
          </p>
          <p className="text-2xl font-bold text-[#006828]">
            {profile.license.ftl.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            {profile.license.ftlPercent}% من قوى عمل المنطقة
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            REG (مسجّل)
          </p>
          <p className="text-2xl font-bold text-[#006828]">
            {profile.license.reg.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            {profile.license.regPercent}% من قوى عمل المنطقة
          </p>
        </div>
      </div>

      {/* أبرز التخصصات */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز التخصصات
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4 w-10">
                #
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4">
                التخصص
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4">
                العدد
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % من المنطقة
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.topSpecialties.map((spec, i) => (
              <tr key={spec.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pe-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 pe-4">
                  <Link
                    href={`/ar/professionals/area/${profile.slug}/${spec.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {spec.name}
                  </Link>
                </td>
                <td className="py-2.5 pe-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {spec.count.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 text-left">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {((spec.count / profile.totalCount) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* أبرز المنشآت */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز المنشآت في {arabicName}
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4 w-10">
                #
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pe-4">
                المنشأة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                الكوادر
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pe-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 pe-4">
                  <Link
                    href={`/ar/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.count.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* استعرض حسب الفئة */}
      {categoriesWithEnough.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              استعرض حسب الفئة
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
            {categoriesWithEnough.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ar/workforce/area/${profile.slug}/${cat.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {catNameAr[cat.slug] || cat.name}
                </h3>
                <p className="text-[11px] text-black/40">
                  {cat.count.toLocaleString("ar-AE")} مهنياً
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* روابط مرتبطة */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/ar/professionals/area/${profile.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          استعرض جميع المهنيين في {arabicName} &larr;
        </Link>
        <Link
          href={`/ar/directory/dubai/${profile.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          المنشآت الصحية في {arabicName} &larr;
        </Link>
        <Link
          href="/ar/workforce/areas"
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          مقارنة المناطق &larr;
        </Link>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. هذه الصفحة
          لأغراض معلوماتية فقط. تحقق من الاعتماد المهني مباشرة مع هيئة الصحة
          بدبي.
        </p>
      </div>
    </div>
  );
}
