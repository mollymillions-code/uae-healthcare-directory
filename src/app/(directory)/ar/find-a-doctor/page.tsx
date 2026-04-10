import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAggregateStats, getAllFacilities } from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  ALL_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

const FAQS = [
  {
    question: "كيف أتحقق من ترخيص DHA لطبيب؟",
    answer:
      "يمكنك التحقق من ترخيص أي كادر صحي من هيئة الصحة بدبي عبر بوابة شريان الرسمية (sheryan.dha.gov.ae). ابحث باسم المهني أو رقم الترخيص لتأكيد مؤهلاته وتخصصه وحالته الراهنة. ويُدرج دليل مهنيي Zavis نوع الترخيص (FTL أو REG) لكل مهني مستقاةً مباشرة من سجل شريان.",
  },
  {
    question: "ما الفرق بين الأخصائي والاستشاري في دبي؟",
    answer:
      "في نظام هيئة الصحة بدبي، الأخصائي طبيب أتمّ تدريبه التخصصي وحصل على مؤهل أخصائي معتمد. أما الاستشاري فهو درجة أرفع تستلزم سنوات إضافية من الخبرة بعد مرحلة التخصص (عادةً 8 سنوات أو أكثر). يحق للاستشاريين الإشراف على الأخصائيين وغالباً ما يتولّون إدارة الأقسام. يستلزم كلا المستويين ترخيصاً منفصلاً من هيئة الصحة بدبي.",
  },
  {
    question: "كم عدد الأطباء في دبي؟",
    answer: `اعتباراً من ${PROFESSIONAL_STATS.scraped}، يبلغ عدد الأطباء المرخّصين من هيئة الصحة بدبي ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً وفق السجل الطبي الرسمي شريان. يضاف إليهم ${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان مرخّص و${PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلة و${PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً صحياً مساندaً، ليبلغ الإجمالي ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً.`,
  },
  {
    question: "ما فئات الكوادر الصحية المرخّصة من هيئة الصحة بدبي؟",
    answer:
      "تُرخّص هيئة الصحة بدبي أربع فئات رئيسية: الأطباء (الممارسون العامون والأخصائيون والاستشاريون)، وأطباء الأسنان (الأسنان العام والتخصصات السنّية)، والممرضون والقابلات (الممرضون المسجّلون والمساعدون والقابلات)، والمهنيون الصحيون المساندون (الصيادلة والمعالجون الفيزيائيون وتقنيو المختبرات وأخصائيو البصريات وعلماء النفس وغيرهم). يجب على كل مهني اجتياز امتحانات هيئة الصحة بدبي واستيفاء متطلبات التأهيل.",
  },
  {
    question: "كيف أجد طبيبة في دبي؟",
    answer:
      "لا يُدرج سجل شريان الخاص بهيئة الصحة بدبي جنس الكوادر الصحية علناً. للعثور على طبيبة، اتصل بالمنشأة مباشرةً واطلب طبيبة. تُتيح كثير من العيادات والمستشفيات في دبي خيار مراجعة طبيبة، لا سيما في تخصصات النساء والتوليد وطب الأطفال وطب الأسرة.",
  },
  {
    question: "ما الفرق بين ترخيصَي FTL وREG؟",
    answer:
      "يُشير ترخيص FTL (الترخيص التجاري الكامل) إلى كادر صحي مرخّص للعمل في منشأة خاصة. أما REG (المسجّل) فيشير إلى كادر مسجّل للعمل في منشأة حكومية أو شبه حكومية كمستشفيات هيئة الصحة بدبي. يؤكد كلا الترخيصين أن المهني استوفى متطلبات هيئة الصحة بدبي.",
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `ابحث عن طبيب في دبي — أكثر من 99,000 كادر صحي مرخّص`,
    description: `ابحث بين ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً من هيئة الصحة بدبي عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة في دبي. ابحث عن الأطباء وأطباء الأسنان والممرضين والمهنيين الصحيين المساندين حسب التخصص أو المنشأة.`,
    alternates: {
      canonical: `${base}/ar/find-a-doctor`,
      languages: {
        "en-AE": `${base}/find-a-doctor`,
        "ar-AE": `${base}/ar/find-a-doctor`,
      },
    },
    openGraph: {
      title: `ابحث عن طبيب في دبي — ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")}+ كادر مرخّص`,
      description: `ابحث في أكبر دليل للكوادر الصحية المرخّصة من هيئة الصحة بدبي. ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً، ${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان، ${PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً، ${PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً مساندaً.`,
      url: `${base}/ar/find-a-doctor`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArFindADoctorPage() {
  const base = getBaseUrl();
  const stats = getAggregateStats();
  const topFacilities = getAllFacilities(100).slice(0, 15);

  const topSpecialtiesByCategory = PROFESSIONAL_CATEGORIES.map((cat) => {
    const specs = getSpecialtiesByCategory(cat.slug)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { category: cat, specialties: specs };
  });

  const categoryDescriptions: Record<string, string> = {
    physicians:
      "الممارسون العامون والأخصائيون والاستشاريون في جميع التخصصات الطبية بما فيها أمراض القلب وجراحة العظام وطب الأعصاب وسواها.",
    dentists:
      "أطباء الأسنان العام وأخصائيو التقويم وعلاج الجذور والتركيبات وجراحة الفم المرخّصون في دبي.",
    nurses:
      "الممرضون المسجّلون والمساعدون والعمليون والقابلات العاملون في مستشفيات دبي وعياداتها.",
    "allied-health":
      "الصيادلة والمعالجون الفيزيائيون وتقنيو المختبرات وأخصائيو البصريات وعلماء النفس وأخصائيو التغذية وسائر مهنيي الصحة المساندين.",
  };

  return (
    <div dir="rtl" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "ابحث عن طبيب في دبي",
          description: `ابحث بين ${PROFESSIONAL_STATS.total.toLocaleString()} كادراً صحياً مرخّصاً من هيئة الصحة بدبي.`,
          url: `${base}/ar/find-a-doctor`,
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
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "ابحث عن طبيب" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "ابحث عن طبيب" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          ابحث عن طبيب في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          ابحث بين {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")}+ كادر صحي مرخّص من هيئة الصحة
          بدبي عبر {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")}+ منشأة
        </p>
        <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تصفّح أكبر دليل قابل للبحث للكوادر الصحية المرخّصة من هيئة الصحة بدبي، مصدره
            السجل الطبي الرسمي شريان. يضم هذا الدليل{" "}
            {PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً،{" "}
            {PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان،{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلة،
            و{PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً صحياً مساندaً.
            ابحث حسب الفئة أو التخصص أو المنشأة لإيجاد الكادر الصحي المناسب.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.total.toLocaleString("ar-AE"),
              label: "كادر صحي مرخّص",
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE"),
              label: "منشآت صحية",
            },
            {
              value: ALL_SPECIALTIES.length.toString(),
              label: "تخصصات متابَعة",
            },
            { value: "4", label: "فئات مهنية" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تصفح حسب الفئة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/ar/professionals/${cat.slug}`}
            className="border border-black/[0.06] p-6 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Geist_Mono',monospace] text-[10px] text-black/30 tracking-wider uppercase mb-2">
              {cat.icon}
            </p>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {cat.nameAr}
            </h3>
            <p className="text-sm font-bold text-[#006828] mb-3">
              {cat.count.toLocaleString("ar-AE")} كادر مهني
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {categoryDescriptions[cat.slug] || cat.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Popular Specialties by Category */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز التخصصات
        </h2>
      </div>
      <div className="mb-12">
        {topSpecialtiesByCategory.map(({ category, specialties }) => (
          <div key={category.slug} className="mb-8">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
              {category.nameAr}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {specialties.map((spec) => (
                <Link
                  key={spec.slug}
                  href={`/ar/professionals/${spec.category}/${spec.slug}`}
                  className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
                >
                  <h4 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                    {spec.nameAr || spec.name}
                  </h4>
                  <p className="text-[11px] text-black/40">
                    {spec.count.toLocaleString("ar-AE")} كادر مهني
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top Hospitals */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر المستشفيات والمنشآت من حيث عدد الموظفين
        </h2>
      </div>
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنشأة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                الموظفون
              </th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-3 pl-4 text-right">
                  <Link
                    href={`/ar/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {i + 1}. {fac.name}
                  </Link>
                </td>
                <td className="py-3 text-left">
                  <span className="text-sm font-bold text-[#006828]">
                    {fac.totalStaff.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ Section */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أسئلة شائعة
        </h2>
      </div>
      <div className="mb-12">
        {FAQS.map((faq) => (
          <div key={faq.question} className="border-b border-black/[0.06] py-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* CTA to full directory */}
      <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2">
          استكشف دليل المهنيين الكامل
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          تصفّح {stats.totalProfessionals.toLocaleString("ar-AE")} كادراً صحياً عبر{" "}
          {stats.totalSpecialties} تخصصاً و{stats.totalFacilities.toLocaleString("ar-AE")} منشأة.
        </p>
        <Link
          href="/ar/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] font-medium hover:underline"
        >
          انتقل إلى دليل المهنيين &larr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تاريخ استخراج البيانات: {PROFESSIONAL_STATS.scraped}. هذا الدليل لأغراض معلوماتية فقط
          ولا يمثّل نصيحة طبية. يُرجى التحقق من أوراق اعتماد المهنيين مباشرة من هيئة الصحة بدبي
          قبل اتخاذ أي قرار صحي.
        </p>
      </div>
    </div>
  );
}
