import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAggregateStats } from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

const CATEGORY_DESCRIPTIONS_AR: Record<string, string> = {
  physicians: "الأطباء المرخّصون بما في ذلك الممارسون العامون والأخصائيون والاستشاريون في جميع التخصصات الطبية في دبي.",
  dentists: "أخصائيو طب الأسنان المرخّصون بما في ذلك أطباء الأسنان العامون وأخصائيو التقويم وجراحو الفم في دبي.",
  nurses: "الممرضون والممرضات المسجّلون والمساعدون والقابلات المرخّصون من هيئة صحة دبي.",
  "allied-health": "الصيادلة وأخصائيو العلاج الطبيعي وتقنيو المختبرات وأخصائيو البصريات والمهنيون الصحيون المساندون الآخرون في دبي.",
};

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "دليل الكوادر الصحية في دبي — 99,520 كادر مرخّص من هيئة صحة دبي",
    description:
      "ابحث بين 99,520 كادراً صحياً مرخّصاً من هيئة صحة دبي. أطباء وأطباء أسنان وممرضون ومهنيون صحيون مساندون من السجل الطبي الرسمي شريان.",
    alternates: {
      canonical: `${base}/ar/professionals`,
      languages: {
        "en-AE": `${base}/professionals`,
        "ar-AE": `${base}/ar/professionals`,
      },
    },
    openGraph: {
      title: "دليل الكوادر الصحية في دبي — 99,520 كادر مرخّص من هيئة صحة دبي",
      description:
        "أكبر دليل بحث عام للكوادر الصحية المرخّصة من هيئة صحة دبي. 24,186 طبيباً، 7,713 طبيب أسنان، 34,733 ممرضاً، و32,888 مهنياً صحياً مساندًا.",
      url: `${base}/ar/professionals`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArabicProfessionalsPage() {
  const base = getBaseUrl();
  const stats = getAggregateStats();
  const topSpecialties = stats.topSpecialties.slice(0, 20);
  const topFacilities = stats.topFacilities.slice(0, 10);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/` },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر الصحية" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "دليل الكوادر الصحية في دبي",
          description: `ابحث بين ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً من هيئة صحة دبي.`,
          url: `${base}/ar/professionals`,
          inLanguage: "ar",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PROFESSIONAL_STATS.total,
            itemListElement: PROFESSIONAL_CATEGORIES.map((cat, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: cat.nameAr,
                url: `${base}/ar/professionals/${cat.slug}`,
              },
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {ar.professionals.title}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} {ar.professionals.subtitle}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {ar.professionals.description} يشمل الدليل{" "}
            {PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً،{" "}
            {PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان،{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلة، و{" "}
            {PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً صحياً مساندًا عبر{" "}
            {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة صحية.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.total.toLocaleString("ar-AE"),
              label: ar.professionals.licensedProfessionals,
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE"),
              label: ar.professionals.healthcareFacilities,
            },
            {
              value: ALL_SPECIALTIES.length.toString(),
              label: ar.professionals.specialtiesTracked,
            },
            { value: "4", label: ar.professionals.professionalCategories },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.professionals.browseByCategory}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/ar/professionals/${cat.slug}`}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {cat.nameAr}
            </h3>
            <p className="text-sm font-bold text-[#006828] mb-2">
              {cat.count.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed line-clamp-2">
              {CATEGORY_DESCRIPTIONS_AR[cat.slug] || cat.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.professionals.topSpecialties}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {topSpecialties.map((spec) => {
          const full = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
          const categorySlug = full?.category || "physicians";
          const nameAr = full?.nameAr || spec.name;
          return (
            <Link
              key={spec.slug}
              href={`/ar/professionals/${categorySlug}/${spec.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {nameAr}
              </h3>
              <p className="text-[11px] text-black/40">
                {spec.count.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.professionals.topFacilities}
        </h2>
      </div>
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                المنشأة
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
              >
                {ar.professionals.staff}
              </th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-3 pl-4">
                  <Link
                    href={`/ar/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {i + 1}. {fac.name}
                  </Link>
                </td>
                <td className="py-3 text-left">
                  <span className="text-sm font-bold text-[#006828]">
                    {fac.staff.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AEO Answer Block */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.professionals.howManyProfessionals}
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          اعتباراً من {PROFESSIONAL_STATS.scraped}، يبلغ عدد الكوادر الصحية المرخّصة من هيئة
          صحة دبي{" "}
          <strong>{PROFESSIONAL_STATS.total.toLocaleString("ar-AE")}</strong> كادراً مرخّصاً يمارسون
          مهنهم في دبي، وفق السجل الطبي الرسمي شريان التابع لهيئة الصحة بدبي. ويشمل ذلك{" "}
          {PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً وجراحاً،{" "}
          {PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان،{" "}
          {PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلة، و{" "}
          {PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً صحياً مساندًا
          (صيادلة، معالجون فيزيائيون، تقنيو مختبرات، أخصائيو بصريات، وغيرهم). يعمل هؤلاء
          المهنيون في{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة صحية، تتراوح بين
          المستشفيات الكبرى كمستشفى راشد (
          {PROFESSIONAL_STATS.topFacilities[0].staff.toLocaleString("ar-AE")} موظفاً) ومستشفى دبي (
          {PROFESSIONAL_STATS.topFacilities[1].staff.toLocaleString("ar-AE")} موظفاً) وحتى العيادات
          الصغيرة والصيدليات.
        </p>
      </div>

      {/* Explore More */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {ar.professionals.exploreMore}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Link
          href="/ar/professionals/stats"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.professionals.workforceStats}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            بيانات إجمالية للقوى العاملة وتوزيع الفئات وأنواع التراخيص
          </p>
        </Link>
        <Link
          href="/ar/professionals/guide/how-to-verify-doctor-license-dubai"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.professionals.editorialGuides}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            كيفية التحقق من ترخيص الطبيب واختيار المتخصص والتنقل في منظومة الرعاية الصحية بدبي
          </p>
        </Link>
        <Link
          href="/ar/find-a-doctor"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.professionals.findDoctor}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            ابحث عن أطباء مرخّصين من هيئة صحة دبي بالاسم أو التخصص أو المنشأة
          </p>
        </Link>
        <Link
          href="/ar/best/doctors"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.professionals.bestDoctors}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            أفضل الأطباء والمتخصصين مرتّبين حسب آراء المرضى والمؤهلات
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>{ar.professionals.source}:</strong> {ar.professionals.disclaimer}
        </p>
      </div>
    </div>
  );
}
