import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getSpecialistPerCapita,
  getFTLRateBySpecialty,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  getSpecialtiesByCategory,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "التخصصات الصحية في دبي — تصنيف حجم القوى العاملة",
    description: `جميع التخصصات الصحية الـ ${ALL_SPECIALTIES.length} المتابَعة في دبي مصنّفةً حسب حجم القوى العاملة. معدلات الفرد، ونسب تغلغل الترخيص الدائم، وتوزيع الفئات من سجل شريان الطبي.`,
    alternates: {
      canonical: `${base}/ar/workforce/specialties`,
      languages: {
        "en-AE": `${base}/workforce/specialties`,
        "ar-AE": `${base}/ar/workforce/specialties`,
      },
    },
    openGraph: {
      title: "التخصصات الصحية في دبي — تصنيف القوى العاملة",
      description: `${ALL_SPECIALTIES.length} تخصصاً طبياً مصنّفاً حسب عدد المهنيين المرخّصين. تحليل نسبة الفرد وتوزيع أنواع التراخيص.`,
      url: `${base}/ar/workforce/specialties`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArSpecialtiesPage() {
  const base = getBaseUrl();
  const perCapita = getSpecialistPerCapita();
  const ftlRates = getFTLRateBySpecialty();

  const perCapitaMap = new Map(perCapita.map((s) => [s.slug, s.per100K]));
  const ftlMap = new Map(ftlRates.map((s) => [s.slug, s.ftlRate]));

  const ranked = [...ALL_SPECIALTIES].sort((a, b) => b.count - a.count);

  const categories = [
    {
      slug: "physicians",
      nameAr: "الأطباء وأطباء الباطنية",
      count: PHYSICIAN_SPECIALTIES.length,
      total: PROFESSIONAL_STATS.physicians,
    },
    {
      slug: "dentists",
      nameAr: "أطباء الأسنان",
      count: DENTIST_SPECIALTIES.length,
      total: PROFESSIONAL_STATS.dentists,
    },
    {
      slug: "nurses",
      nameAr: "الممرضون والقابلات",
      count: getSpecialtiesByCategory("nurses").length,
      total: PROFESSIONAL_STATS.nurses,
    },
    {
      slug: "allied-health",
      nameAr: "المهنيون الصحيون المساندون",
      count: getSpecialtiesByCategory("allied-health").length,
      total: PROFESSIONAL_STATS.alliedHealth,
    },
  ];

  return (
    <div
      dir="rtl"
      lang="ar"
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "التخصصات الصحية في دبي — تصنيف القوى العاملة",
          description: `${ALL_SPECIALTIES.length} تخصصاً صحياً مصنّفاً حسب حجم القوى العاملة في دبي.`,
          url: `${base}/ar/workforce/specialties`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.specialtiesHub },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.specialtiesHub },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          تحليل التخصصات
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          التخصصات الصحية في دبي
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          {ALL_SPECIALTIES.length.toLocaleString("ar-AE")} تخصصاً عبر 4 فئات
          مهنية، مصنّفةً حسب عدد الممارسين المرخّصين من هيئة الصحة بدبي.
        </p>

        {/* بطاقات ملخص الفئات */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {categories.map((cat) => (
            <div key={cat.slug} className="bg-[#f8f8f6] p-4">
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
                {cat.nameAr}
              </p>
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828]">
                {cat.count.toLocaleString("ar-AE")} تخصص
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {cat.total.toLocaleString("ar-AE")} مهني
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* جدول التصنيف الكامل — حسب الفئة */}
      {PROFESSIONAL_CATEGORIES.map((cat) => {
        const catSpecs = ranked.filter((s) => s.category === cat.slug);
        if (catSpecs.length === 0) return null;

        let globalRank = 0;
        return (
          <div key={cat.slug} className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {cat.nameAr}
              </h2>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium">
                {catSpecs.length.toLocaleString("ar-AE")} تخصص
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-3 w-8">
                      #
                    </th>
                    <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4">
                      التخصص
                    </th>
                    <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4">
                      العدد
                    </th>
                    <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 ps-4 hidden sm:table-cell">
                      لكل 100 ألف
                    </th>
                    <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                      معدل FTL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catSpecs.map((spec) => {
                    globalRank++;
                    return (
                      <tr
                        key={spec.slug}
                        className="border-b border-black/[0.06]"
                      >
                        <td className="py-2.5 ps-3 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                          {globalRank.toLocaleString("ar-AE")}
                        </td>
                        <td className="py-2.5 ps-4">
                          <Link
                            href={`/ar/workforce/specialty/${spec.slug}`}
                            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                          >
                            {spec.nameAr || spec.name}
                          </Link>
                        </td>
                        <td className="py-2.5 ps-4 text-left font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                          {spec.count.toLocaleString("ar-AE")}
                        </td>
                        <td className="py-2.5 ps-4 text-left font-['Geist_Mono',monospace] text-sm text-black/40 hidden sm:table-cell">
                          {perCapitaMap.get(spec.slug) ?? "—"}
                        </td>
                        <td className="py-2.5 text-left font-['Geist_Mono',monospace] text-sm text-black/40 hidden md:table-cell">
                          {ftlMap.has(spec.slug)
                            ? `${ftlMap.get(spec.slug)}%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* كتلة الأسئلة الشائعة */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          ما أكثر التخصصات الطبية شيوعاً في دبي؟
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          أكبر التخصصات الصحية في دبي من حيث القوى العاملة المرخّصة هي{" "}
          <strong>{ranked[0]?.nameAr || ranked[0]?.name}</strong> (
          {ranked[0]?.count.toLocaleString("ar-AE")})،{" "}
          <strong>{ranked[1]?.nameAr || ranked[1]?.name}</strong> (
          {ranked[1]?.count.toLocaleString("ar-AE")})، و{" "}
          <strong>{ranked[2]?.nameAr || ranked[2]?.name}</strong> (
          {ranked[2]?.count.toLocaleString("ar-AE")}). عبر{" "}
          {ALL_SPECIALTIES.length.toLocaleString("ar-AE")} تخصصاً متابَعاً،
          يضم قطاع الأطباء وحده{" "}
          {PHYSICIAN_SPECIALTIES.length.toLocaleString("ar-AE")} تخصصاً فرعياً
          فيما يضم طب الأسنان{" "}
          {DENTIST_SPECIALTIES.length.toLocaleString("ar-AE")} تخصصاً.
        </p>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تعكس أعداد
          التخصصات المهنيين المرخّصين فقط. تستخدم معدلات الفرد تقديرات سكان
          دبي البالغة 3,660,000 نسمة. تحقق من البيانات مباشرة مع هيئة الصحة
          بدبي.
        </p>
      </div>
    </div>
  );
}
