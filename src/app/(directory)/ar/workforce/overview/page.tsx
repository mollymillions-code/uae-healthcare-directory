import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getWorkforceRatios,
  getLicenseTypeBreakdown,
  getAreaStats,
  getAllFacilities,
  getSpecialtiesWithBothLevels,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/workforce";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;

const FAQS = [
  {
    question: "كم عدد الكوادر الصحية المرخّصة في دبي؟",
    answer: `اعتباراً من ${PROFESSIONAL_STATS.scraped}، يبلغ عدد الكوادر الصحية المرخّصة من هيئة صحة دبي ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً. ويشمل ذلك ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً، ${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان، ${PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلة، و${PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} مهنياً صحياً مساندًا.`,
  },
  {
    question: "ما هي نسبة الأطباء إلى السكان في دبي؟",
    answer:
      "تمتلك دبي ما يقارب 661 طبيباً لكل 100,000 نسمة (استناداً إلى تقدير عدد السكان بـ 3.66 مليون نسمة)، وهو معدل يتجاوز الحد الأدنى الموصى به من منظمة الصحة العالمية. يشمل هذا المعدل الأطباء العامين والمتخصصين والاستشاريين في جميع التخصصات الطبية.",
  },
  {
    question: "ما هي نسبة الممرضين إلى الأطباء في دبي؟",
    answer:
      "تبلغ نسبة الممرضين إلى الأطباء في دبي نحو 1.44:1 تقريباً. وعلى الرغم من أن هذا المعدل يُلبّي المتطلبات التشغيلية الأساسية، إلا أنه يقل عن المعيار المرجعي لمنظمة الصحة العالمية البالغ 3:1، مما يشير إلى طلب محتمل في استقطاب الممرضين.",
  },
  {
    question: "ما الفرق بين ترخيص FTL وترخيص REG في هيئة صحة دبي؟",
    answer:
      "يعني الترخيص الدائم (FTL) أن الكادر الصحي يعمل بدوام كامل في منشأته المسجّلة. أما تسجيل الممارسة (REG) فيشير إلى كادر قد يمارس عمله بدوام جزئي أو في عدة منشآت. وعادةً ما يمثّل حاملو الترخيص الدائم النواة الأساسية للكوادر في المنشأة.",
  },
  {
    question: "من أين تأتي بيانات القوى العاملة هذه؟",
    answer: `جميع البيانات مصدرها سجل شريان الطبي المهني التابع لهيئة الصحة بدبي (DHA)، وهو قاعدة البيانات الرسمية لترخيص العاملين في القطاع الصحي بدبي. جُمعت البيانات بتاريخ ${PROFESSIONAL_STATS.scraped}.`,
  },
  {
    question: "كم مرة يتم تحديث بيانات القوى العاملة؟",
    answer:
      "سجل شريان التابع لهيئة صحة دبي قاعدة بيانات حية تُحدَّث باستمرار مع حصول الكوادر على تراخيص جديدة أو تجديدها. تُعيد Zavis فهرسة السجل الكامل دورياً لرصد التغييرات في تركيبة القوى العاملة، والتوظيفات الجديدة، والمغادرات.",
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "نظرة عامة على القوى العاملة الصحية في دبي 2026 — 99,520 كادراً مرخّصاً",
    description:
      "تقرير القوى العاملة الصحية الشامل في دبي: 99,520 كادراً مرخّصاً من هيئة صحة دبي، نسب السكان، توزيع الفئات، أنواع التراخيص، أكبر المنشآت، خط أنابيب المتخصصين، والتوزيع الجغرافي. بيانات من سجل شريان الطبي.",
    alternates: {
      canonical: `${base}/ar/workforce/overview`,
      languages: {
        "en-AE": `${base}/workforce/overview`,
        "ar-AE": `${base}/ar/workforce/overview`,
      },
    },
    openGraph: {
      title: "نظرة عامة على القوى العاملة الصحية في دبي 2026 — 99,520 كادراً مرخّصاً",
      description:
        "تحليل شامل لسوق العمل الصحي في دبي. نسب السكان، تصنيفات أصحاب العمل، توزيع التخصصات، ومعايير القوى العاملة.",
      url: `${base}/ar/workforce/overview`,
      type: "article",
      siteName: ar.siteName,
    },
  };
}

export default function ArabicWorkforceOverviewPage() {
  const base = getBaseUrl();
  const ratios = getWorkforceRatios();
  const license = getLicenseTypeBreakdown();
  const topFacilities = getAllFacilities(100).slice(0, 20);
  const sortedSpecialties = [...ALL_SPECIALTIES].sort(
    (a, b) => b.count - a.count
  );
  const topSpecialties = sortedSpecialties.slice(0, 20);
  const pipeline = getSpecialtiesWithBothLevels().slice(0, 15);
  const areas = getAreaStats().slice(0, 15);

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
          name: "نظرة عامة على القوى العاملة الصحية في دبي 2026",
          description: `تقرير شامل للقوى العاملة يغطي ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً من هيئة صحة دبي.`,
          url: `${base}/ar/workforce/overview`,
          inLanguage: "ar",
          mainEntity: {
            "@type": "Dataset",
            name: "إحصاء القوى العاملة الصحية في دبي 2026",
            description: `إحصاء شامل لـ ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة.`,
            creator: {
              "@type": "Organization",
              name: "هيئة صحة دبي",
            },
            temporalCoverage: PROFESSIONAL_STATS.scraped,
          },
        }}
      />
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/` },
          { name: "معلومات القوى العاملة الصحية", url: `${base}/ar/workforce` },
          { name: "نظرة عامة" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "معلومات القوى العاملة الصحية", href: "/ar/workforce" },
          { label: "نظرة عامة" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          التقرير الرئيسي للقوى العاملة
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          نظرة عامة على القوى العاملة الصحية في دبي 2026
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
          نُشر بتاريخ {PROFESSIONAL_STATS.scraped} | المصدر: سجل شريان الطبي — هيئة صحة دبي
        </p>
      </div>

      {/* Executive Summary */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          الملخص التنفيذي
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          يُوظّف قطاع الرعاية الصحية في دبي{" "}
          <strong>{PROFESSIONAL_STATS.total.toLocaleString("ar-AE")}</strong> كادراً صحياً
          مرخّصاً من هيئة صحة دبي عبر{" "}
          <strong>
            {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")}
          </strong>{" "}
          منشأة، مما يجعله أحد أكبر وأكثر أسواق العمل الصحي تنوعاً في منطقة الشرق الأوسط.
          أبرز النتائج:
        </p>
        <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed list-disc list-inside space-y-1">
          <li>
            تُشكّل فئة الممرضين والقابلات أكبر الفئات بعدد{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} (
            {Math.round(
              (PROFESSIONAL_STATS.nurses / PROFESSIONAL_STATS.total) * 100
            )}
            %)، تليها المهن الصحية المساندة بعدد{" "}
            {PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} (
            {Math.round(
              (PROFESSIONAL_STATS.alliedHealth / PROFESSIONAL_STATS.total) * 100
            )}
            %)
          </li>
          <li>
            تبلغ كثافة الأطباء {ratios.physiciansPer100K.toLocaleString("ar-AE")} لكل 100,000 نسمة —
            وهي نسبة تتخطى الحد الأدنى الموصى به من منظمة الصحة العالمية
          </li>
          <li>
            تبقى نسبة الممرضين إلى الأطباء البالغة {ratios.nurseToPhysicianRatio}:1
            دون المعيار المرجعي لمنظمة الصحة العالمية البالغ 3:1
          </li>
          <li>
            {license.ftlPercent}% من جميع التراخيص هي تراخيص دائمة (FTL)، فيما يحمل{" "}
            {license.regPercent}% تسجيل ممارسة (REG)
          </li>
        </ul>
      </div>

      {/* Population Ratios */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نسب السكان
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
        استناداً إلى التعداد السكاني المُقدَّر لدبي:{" "}
        {ratios.population.toLocaleString("ar-AE")} نسمة (2026)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[
          {
            label: "طبيب لكل 100,000",
            value: ratios.physiciansPer100K.toLocaleString("ar-AE"),
            benchmark: "الحد الأدنى (WHO): 100",
          },
          {
            label: "ممرض لكل 100,000",
            value: ratios.nursesPer100K.toLocaleString("ar-AE"),
            benchmark: "الحد الأدنى (WHO): 300",
          },
          {
            label: "طبيب أسنان لكل 100,000",
            value: ratios.dentistsPer100K.toLocaleString("ar-AE"),
            benchmark: "المتوسط العالمي: ~30",
          },
          {
            label: "مهني صحي مساند لكل 100,000",
            value: ratios.alliedHealthPer100K.toLocaleString("ar-AE"),
            benchmark: "",
          },
          {
            label: "الإجمالي لكل 100,000",
            value: ratios.totalPer100K.toLocaleString("ar-AE"),
            benchmark: "",
          },
        ].map(({ label, value, benchmark }) => (
          <div key={label} className="bg-[#f8f8f6] p-4">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/60 mt-1">
              {label}
            </p>
            {benchmark && (
              <p className="font-['Geist_Mono',monospace] text-[10px] text-black/30 mt-1">
                {benchmark}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="border border-black/[0.06] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
            {ratios.physicianToPopulation}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            طبيب لكل عدد من السكان
          </p>
        </div>
        <div className="border border-black/[0.06] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
            {ratios.nurseToPopulation}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            ممرض لكل عدد من السكان
          </p>
        </div>
        <div className="border border-black/[0.06] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
            {ratios.nurseToPhysicianRatio}:1
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {ar.workforce.nurseToDoctorRatio}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          القوى العاملة حسب الفئة
        </h2>
      </div>
      <div className="space-y-3 mb-8">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const pct = Math.round(
            (cat.count / PROFESSIONAL_STATS.total) * 100
          );
          return (
            <div key={cat.slug} className="border border-black/[0.06] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {cat.nameAr}
                </p>
                <p className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {cat.count.toLocaleString("ar-AE")}
                </p>
              </div>
              <div className="h-2 bg-[#f8f8f6] overflow-hidden mb-1">
                <div
                  className="h-full bg-[#006828]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="font-['Geist_Mono',monospace] text-[10px] text-black/30">
                {pct}% من إجمالي القوى العاملة
              </p>
            </div>
          );
        })}
      </div>

      {/* License Type Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع أنواع التراخيص
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {license.ftl.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] mt-1">
            الترخيص الدائم (FTL)
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            {license.ftlPercent}% — مخصّص لمنشأة واحدة
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#1c1c1c]">
            {license.reg.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] mt-1">
            تسجيل الممارسة (REG)
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            {license.regPercent}% — قد يمارس في عدة منشآت
          </p>
        </div>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/60 leading-relaxed mb-8">
        يرتبط حاملو الترخيص الدائم بمنشأة واحدة ويُشكّلون النواة الأساسية للكوادر السريرية. أما
        حاملو تسجيل الممارسة فقد يعملون بدوام جزئي أو بالإنابة أو في مواقع متعددة. تُشير نسبة
        الترخيص الدائم المرتفعة في المنشأة إلى استقرار التوظيف فيها.
      </p>

      {/* Top 20 Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر 20 منشأة من حيث عدد الموظفين
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                #
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنشأة
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                الموظفون
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                أبرز التخصصات
              </th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
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
                <td className="py-2.5 pl-4 text-left font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {fac.totalStaff.toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 text-xs text-black/40 hidden sm:table-cell text-right">
                  {fac.topSpecialties[0]?.name || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
        <Link
          href="/ar/workforce/employers"
          className="text-[#006828] hover:underline"
        >
          عرض جميع {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة مرتّبةً حسب عدد الموظفين ←
        </Link>
      </p>

      {/* Top 20 Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر 20 تخصصاً من حيث حجم القوى العاملة
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                #
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                التخصص
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الفئة
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                المهنيون
              </th>
            </tr>
          </thead>
          <tbody>
            {topSpecialties.map((spec, i) => (
              <tr key={spec.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/specialty/${spec.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {spec.nameAr}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-xs text-black/40 hidden sm:table-cell capitalize text-right">
                  {PROFESSIONAL_CATEGORIES.find((c) => c.slug === spec.category)?.nameAr || spec.category}
                </td>
                <td className="py-2.5 text-left font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {spec.count.toLocaleString("ar-AE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
        <Link
          href="/ar/workforce/specialties"
          className="text-[#006828] hover:underline"
        >
          عرض جميع التخصصات الـ {ALL_SPECIALTIES.length} مرتّبةً ←
        </Link>
      </p>

      {/* Specialist vs Consultant Pipeline */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          خط أنابيب الأخصائيين والاستشاريين
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
        التخصصات التي يتوفر فيها كل من مسمّى &quot;أخصائي&quot; و&quot;استشاري&quot;، مما يُظهر التدرّج الوظيفي في الأقدمية.
      </p>
      <div className="overflow-x-auto mb-8">
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
                % الاستشاريين
              </th>
            </tr>
          </thead>
          <tbody>
            {pipeline.map((spec) => {
              const total = spec.specialists + spec.consultants;
              const pct =
                total > 0
                  ? Math.round((spec.consultants / total) * 100)
                  : 0;
              return (
                <tr
                  key={spec.slug}
                  className="border-b border-black/[0.06]"
                >
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/specialty/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {spec.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4 text-left font-['Geist_Mono',monospace] text-sm text-black/60">
                    {spec.specialists.toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 pl-4 text-left font-['Geist_Mono',monospace] text-sm text-[#006828] font-bold">
                    {spec.consultants.toLocaleString("ar-AE")}
                  </td>
                  <td className="py-2.5 text-left font-['Geist_Mono',monospace] text-sm text-black/40">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Geographic Concentration */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التركّز الجغرافي
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
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
            {areas.map((area) => (
              <tr key={area.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/area/${area.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {getArabicAreaName(area.slug) || area.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {area.count.toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 text-xs text-black/40 hidden sm:table-cell text-right">
                  {area.topSpecialties[0]?.name || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
        <Link
          href="/ar/workforce/areas"
          className="text-[#006828] hover:underline"
        >
          عرض جميع المناطق مع التحليل الجغرافي ←
        </Link>
      </p>

      {/* FAQs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          الأسئلة الشائعة
        </h2>
      </div>
      <div className="space-y-6 mb-8">
        {FAQS.map((faq) => (
          <div key={faq.question}>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل شريان الطبي المهني التابع لهيئة الصحة بدبي (DHA). جُمعت
          البيانات بتاريخ {PROFESSIONAL_STATS.scraped}. هذا التقرير لأغراض إرشادية فحسب ولا يُعدّ
          استشارةً طبيةً أو مهنيةً. تحقق من أوراق الاعتماد مباشرةً من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
