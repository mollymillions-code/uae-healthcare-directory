import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAllFacilities,
  getAllProfessionals,
  getAreaStats,
  getSpecialtiesWithBothLevels,
} from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import { DUBAI_POPULATION } from "@/lib/workforce";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;

const FAQS = [
  {
    question: "كم عدد الكوادر الصحية المرخّصة في دبي؟",
    answer: `اعتباراً من ${PROFESSIONAL_STATS.scraped}، يبلغ عدد الكوادر الصحية المرخّصة من هيئة الصحة بدبي (DHA) ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} مهنياً صحياً. ويشمل ذلك ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً، و${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان، و${PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلة، و${PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً صحياً مساندaً.`,
  },
  {
    question: "ما هي نسبة الأطباء إلى السكان في دبي؟",
    answer: `مع وجود ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً مرخّصاً لخدمة تعداد سكاني يُقدّر بـ${(DUBAI_POPULATION / 1_000_000).toFixed(2)} مليون نسمة، تبلغ نسبة الأطباء في دبي طبيباً واحداً لكل ${Math.round(DUBAI_POPULATION / PROFESSIONAL_STATS.physicians).toLocaleString("ar-AE")} مقيم. وتُعدّ هذه من أعلى النسب في منطقة الشرق الأوسط وشمال أفريقيا.`,
  },
  {
    question: "كم عدد المنشآت الصحية في دبي؟",
    answer: `يوجد ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة صحية تضم موظفين مرخّصين في دبي وفقاً للسجل الطبي المهني شريان التابع لهيئة الصحة بدبي. وتتراوح هذه المنشآت بين المستشفيات الحكومية الكبرى كمستشفى راشد (${PROFESSIONAL_STATS.topFacilities[0].staff.toLocaleString("ar-AE")} موظفاً) وحتى العيادات المتخصصة والصيدليات.`,
  },
  {
    question: "ما هو أكبر مستشفى في دبي من حيث عدد الموظفين؟",
    answer: `مستشفى راشد هو أكبر منشأة صحية في دبي من حيث عدد الموظفين المرخّصين، إذ يضم ${PROFESSIONAL_STATS.topFacilities[0].staff.toLocaleString("ar-AE")} مهنياً مرخّصاً من هيئة الصحة بدبي. يليه مستشفى دبي (${PROFESSIONAL_STATS.topFacilities[1].staff.toLocaleString("ar-AE")} موظفاً) ثم مستشفى أمريكان دبي (${PROFESSIONAL_STATS.topFacilities[2].staff.toLocaleString("ar-AE")} موظفاً).`,
  },
  {
    question: "ما هي أكثر التخصصات الطبية شيوعاً في دبي؟",
    answer: "أكثر التخصصات شيوعاً بين الكوادر الصحية في دبي هي: الطبيب العام، والممرض المسجّل، والصيدلاني، وطبيب الأسنان العام، والمعالج الفيزيائي. وبين التخصصات الطبية تحديداً، تأتي الطب العام وأمراض النساء والتوليد وطب الأطفال وطب الأسرة والأمراض الجلدية في مقدمة القائمة.",
  },
  {
    question: "من أين تأتي بيانات القوى العاملة الصحية هذه؟",
    answer: `جميع البيانات الواردة في هذا التقرير مصدرها سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA)، وهو قاعدة البيانات الرسمية لترخيص الكوادر الصحية في دبي. تاريخ آخر استخراج للبيانات: ${PROFESSIONAL_STATS.scraped}.`,
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `إحصائيات القوى العاملة الصحية في دبي`,
    description: `إحصائيات شاملة للقوى العاملة الصحية في دبي: ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي مرخّص عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة. تفاصيل حسب الفئة والتخصص والمنشأة والمنطقة الجغرافية.`,
    alternates: {
      canonical: `${base}/ar/professionals/stats`,
      languages: {
        "en-AE": `${base}/professionals/stats`,
        "ar-AE": `${base}/ar/professionals/stats`,
      },
    },
    openGraph: {
      title: `إحصائيات القوى العاملة الصحية في دبي — ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مرخّص`,
      description: `تحليل بيانات القوى العاملة الصحية في دبي: ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً، ${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان، ${PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً، ${PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً مساندaً.`,
      url: `${base}/ar/professionals/stats`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArStatsPage() {
  const base = getBaseUrl();
  const facilities = getAllFacilities(100).slice(0, 20);
  const areaStats = getAreaStats();
  const bothLevels = getSpecialtiesWithBothLevels();

  const allProfessionals = getAllProfessionals();
  let ftlTotal = 0;
  let regTotal = 0;
  for (const p of allProfessionals) {
    if (p.licenseType === "FTL") ftlTotal++;
    else if (p.licenseType === "REG") regTotal++;
  }
  const otherLicense = allProfessionals.length - ftlTotal - regTotal;

  const topSpecialties = [...ALL_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const physicianRatio = Math.round(DUBAI_POPULATION / PROFESSIONAL_STATS.physicians);

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر المهنية", url: `${base}/ar/professionals` },
          { name: "الإحصائيات" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "إحصائيات القوى العاملة الصحية في دبي",
          description: `${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي مرخّص عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة في دبي.`,
          url: `${base}/ar/professionals/stats`,
          mainEntity: {
            "@type": "Dataset",
            name: "إحصائيات القوى العاملة الصحية في دبي",
            description: `بيانات القوى العاملة لـ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي مرخّص من هيئة الصحة بدبي.`,
            creator: { "@type": "Organization", name: "Zavis", url: base },
            distribution: {
              "@type": "DataDownload",
              contentUrl: `${base}/ar/professionals/stats`,
              encodingFormat: "text/html",
            },
            temporalCoverage: "2026",
            spatialCoverage: { "@type": "Place", name: "Dubai, United Arab Emirates" },
            variableMeasured: [
              "إجمالي الكوادر الصحية المرخّصة",
              "الكوادر حسب الفئة",
              "الكوادر حسب التخصص",
              "الكوادر حسب المنشأة",
              "توزيع أنواع التراخيص",
            ],
          },
        }}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر المهنية", href: "/ar/professionals" },
          { label: "الإحصائيات" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          القوى العاملة الصحية في دبي — بالأرقام
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مرخّص من هيئة الصحة بدبي
          &middot; البيانات حتى {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            نظرة إحصائية شاملة على القوى العاملة الصحية في دبي، مصدرها سجل المهنيين الطبيين الرسمي
            شريان التابع لهيئة الصحة بدبي. تشمل هذه الصفحة التفاصيل حسب الفئة والتخصص والمنشأة
            وتوزيع التراخيص والتحليل الجغرافي ونسب الأخصائيين والاستشاريين.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: PROFESSIONAL_STATS.total.toLocaleString("ar-AE"),
            label: "إجمالي الكوادر المرخّصة",
          },
          {
            value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE"),
            label: "منشآت صحية",
          },
          {
            value: `1:${physicianRatio.toLocaleString("ar-AE")}`,
            label: "نسبة الأطباء إلى السكان",
          },
          {
            value: ALL_SPECIALTIES.length.toString(),
            label: "تخصصات متابَعة",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[#006828]">{value}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          القوى العاملة حسب الفئة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const pct = ((cat.count / PROFESSIONAL_STATS.total) * 100).toFixed(1);
          return (
            <Link
              key={cat.slug}
              href={`/ar/professionals/${cat.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {cat.nameAr}
              </h3>
              <p className="text-2xl font-bold text-[#006828] mb-1">
                {cat.count.toLocaleString("ar-AE")}
              </p>
              <div className="w-full bg-black/[0.04] h-1.5 mb-2">
                <div className="bg-[#006828] h-1.5" style={{ width: `${pct}%` }} />
              </div>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {pct}% من إجمالي القوى العاملة
              </p>
            </Link>
          );
        })}
      </div>

      {/* Top 20 Specialties Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز 20 تخصصاً حسب عدد الكوادر
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">
                #
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                التخصص
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الفئة
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                العدد
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % من الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {topSpecialties.map((spec, i) => {
              const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === spec.category);
              const pct = ((spec.count / PROFESSIONAL_STATS.total) * 100).toFixed(1);
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/professionals/${spec.category}/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {spec.nameAr || spec.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4 hidden sm:table-cell text-right">
                    <span className="font-['Geist',sans-serif] text-xs text-black/40">
                      {cat?.nameAr || cat?.name || spec.category}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {spec.count.toLocaleString("ar-AE")}
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

      {/* Top 20 Facilities Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر 20 منشأة من حيث عدد الموظفين
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">
                #
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنشأة
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                إجمالي الموظفين
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                التخصص الأبرز
              </th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {i + 1}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/professionals/facility/${fac.slug}`}
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
                <td className="py-2.5 hidden sm:table-cell text-right">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {fac.topSpecialties[0] ? (getSpecialtyBySlug(fac.topSpecialties[0].slug)?.nameAr || fac.topSpecialties[0].name) : "--"}
                    {fac.topSpecialties[0] ? ` (${fac.topSpecialties[0].count})` : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* License Type Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع أنواع التراخيص
        </h2>
      </div>
      <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          تُصدر هيئة الصحة بدبي نوعين رئيسيين من التراخيص: <strong>FTL</strong> (الترخيص التجاري الكامل)
          للمهنيين العاملين بموجب ترخيصهم الخاص، و<strong>REG</strong> (المسجّل) للمهنيين العاملين
          تحت ترخيص منشأة. يعكس نوع الترخيص ترتيب التوظيف لا مستوى الكفاءة.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
        {[
          {
            label: "FTL (ترخيص تجاري كامل)",
            value: ftlTotal,
            pct: ((ftlTotal / allProfessionals.length) * 100).toFixed(1),
          },
          {
            label: "REG (مسجّل)",
            value: regTotal,
            pct: ((regTotal / allProfessionals.length) * 100).toFixed(1),
          },
          ...(otherLicense > 0
            ? [
                {
                  label: "أخرى",
                  value: otherLicense,
                  pct: ((otherLicense / allProfessionals.length) * 100).toFixed(1),
                },
              ]
            : []),
        ].map(({ label, value, pct }) => (
          <div key={label} className="bg-[#f8f8f6] p-5">
            <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
              {label}
            </p>
            <p className="text-2xl font-bold text-[#006828]">
              {value.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {pct}% من الإجمالي
            </p>
          </div>
        ))}
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التوزيع الجغرافي حسب المنطقة
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        رُسمت الكوادر الصحية على مناطق دبي استناداً إلى موقع المنشأة. لا تُعرض المناطق التي يقل عدد مهنييها عن 10.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنطقة
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                الكوادر المهنية
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                أبرز التخصصات
              </th>
            </tr>
          </thead>
          <tbody>
            {areaStats.map((area) => (
              <tr key={area.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/professionals/area/${area.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {getArabicAreaName(area.slug) || area.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {area.count.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 hidden sm:table-cell text-right">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {area.topSpecialties.slice(0, 3).map((s) => getSpecialtyBySlug(s.slug)?.nameAr || s.name).join("، ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specialist vs Consultant */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنة الأخصائيين والاستشاريين
        </h2>
      </div>
      <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          في نظام هيئة الصحة بدبي، <strong>الأخصائيون</strong> هم أطباء أتمّوا تدريبهم التخصصي
          وحصلوا على شهادة البورد. أما <strong>الاستشاريون</strong> فهم أخصائيون من كبار الأطباء
          ذوو خبرة إضافية تبلغ عادةً 5 سنوات أو أكثر بعد شهادة التخصص. يعرض الجدول أدناه التخصصات
          التي تضم المستويين معاً.
        </p>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                التخصص
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                أخصائيون
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                استشاريون
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                النسبة (أخ:است)
              </th>
            </tr>
          </thead>
          <tbody>
            {bothLevels.slice(0, 25).map((spec) => {
              const ratio =
                spec.consultants > 0
                  ? (spec.specialists / spec.consultants).toFixed(1)
                  : "--";
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 text-right">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                      {getSpecialtyBySlug(spec.slug)?.nameAr || spec.name}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {spec.specialists.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-left">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {spec.consultants.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5 text-left">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {ratio}:1
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FAQs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أسئلة شائعة
        </h2>
      </div>
      <div className="space-y-6 mb-12">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          استكشف الدليل
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/ar/professionals/${cat.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              {cat.nameAr}
            </h3>
            <p className="text-[11px] text-black/40">
              {cat.count.toLocaleString("ar-AE")} كادر مهني
            </p>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تاريخ استخراج البيانات: {PROFESSIONAL_STATS.scraped}. تقديرات السكان مستندة إلى بيانات
          مركز دبي للإحصاء. هذه الصفحة لأغراض معلوماتية فقط ولا تمثّل نصيحة طبية. يُرجى التحقق
          من أوراق اعتماد المهنيين مباشرة من هيئة الصحة بدبي قبل اتخاذ أي قرار صحي.
        </p>
      </div>
    </div>
  );
}
