import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllFacilities,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `تصنيفات القوى العاملة الصحية في دبي — أكبر أصحاب العمل والتخصصات | Zavis`,
    description: `تصنيفات وجداول ترتيب للقوى العاملة الصحية في دبي: أكبر أصحاب العمل، أكبر التخصصات، نسب الممرضين للأطباء، معدلات FTL. ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} مهنياً عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة.`,
    alternates: {
      canonical: `${base}/ar/workforce/rankings`,
      languages: {
        "en-AE": `${base}/workforce/rankings`,
        "ar-AE": `${base}/ar/workforce/rankings`,
      },
    },
    openGraph: {
      title: "تصنيفات القوى العاملة الصحية في دبي",
      description: `جداول ترتيب للقوى العاملة الصحية في دبي — ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} مهنياً مرخّصاً.`,
      url: `${base}/ar/workforce/rankings`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArRankingsHubPage() {
  const base = getBaseUrl();
  const topFacilities = getAllFacilities(20);
  const topEmployerCount = Math.min(topFacilities.length, 50);
  const specialtyCount = ALL_SPECIALTIES.filter((s) => s.count >= 10).length;

  const RANKING_CARDS = [
    {
      title: "أكبر 50 صاحب عمل",
      href: "/ar/workforce/rankings/top-employers",
      description:
        "أكبر 50 صاحب عمل في القطاع الصحي بدبي مصنّفين حسب إجمالي عدد الكوادر المرخّصة من هيئة الصحة بدبي.",
      stat: `${topEmployerCount.toLocaleString("ar-AE")} منشأة`,
    },
    {
      title: "أكبر أصحاب العمل — الأطباء",
      href: "/ar/workforce/rankings/top-employers/physicians",
      description:
        "المنشآت التي توظّف أكبر عدد من الأطباء في دبي.",
      stat: `${PROFESSIONAL_CATEGORIES[0].count.toLocaleString("ar-AE")} طبيباً`,
    },
    {
      title: "أكبر أصحاب العمل — الممرضون",
      href: "/ar/workforce/rankings/top-employers/nurses",
      description:
        "المنشآت التي لديها أكبر فرق تمريض وقبالة في دبي.",
      stat: `${PROFESSIONAL_CATEGORIES[2].count.toLocaleString("ar-AE")} ممرضاً`,
    },
    {
      title: "أكبر أصحاب العمل — أطباء الأسنان",
      href: "/ar/workforce/rankings/top-employers/dentists",
      description:
        "عيادات الأسنان والمستشفيات مصنّفةً حسب عدد أطباء الأسنان المرخّصين.",
      stat: `${PROFESSIONAL_CATEGORIES[1].count.toLocaleString("ar-AE")} طبيب أسنان`,
    },
    {
      title: "أكبر أصحاب العمل — المهنيون المساندون",
      href: "/ar/workforce/rankings/top-employers/allied-health",
      description:
        "الصيادلة والمعالجون الطبيعيون والمختبريون وغيرهم من المهنيين الصحيين المساندين حسب صاحب العمل.",
      stat: `${PROFESSIONAL_CATEGORIES[3].count.toLocaleString("ar-AE")} مهنياً مساندًا`,
    },
    {
      title: "أكبر التخصصات",
      href: "/ar/workforce/rankings/largest-specialties",
      description:
        "جميع التخصصات الطبية مصنّفةً حسب عدد المهنيين المرخّصين ومعدلات الفرد.",
      stat: `${specialtyCount.toLocaleString("ar-AE")} تخصصاً`,
    },
    {
      title: "معايير التوظيف",
      href: "/ar/workforce/benchmarks/nurse-to-doctor",
      description:
        "نسب الممرضين للأطباء، توزيع الكوادر لكل منشأة، معدلات الأخصائيين لكل فرد، وتحليل FTL.",
      stat: "4 معايير",
    },
  ];

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
          name: "تصنيفات القوى العاملة الصحية في دبي",
          description: `تصنيفات القوى العاملة الصحية في دبي — ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} مهنياً مرخّصاً.`,
          url: `${base}/ar/workforce/rankings`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.rankings },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.rankings },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          تصنيفات القوى العاملة
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          تصنيفات القوى العاملة الصحية — دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} مهنياً &middot;{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة
          &middot; بيانات حتى {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            جداول ترتيب وتصنيفات للقوى العاملة الصحية في دبي. استعرض أكبر
            أصحاب العمل حسب إجمالي الكوادر أو حسب الفئة المهنية، والتخصصات
            الطبية الأكثر شيوعاً، ومعايير التوظيف بما فيها نسب الممرضين
            للأطباء ومعدلات الأخصائيين لكل فرد. جميع البيانات مصدرها السجل
            الطبي المهني شريان لهيئة الصحة بدبي.
          </p>
        </div>
      </div>

      {/* شبكة بطاقات التصنيفات */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع التصنيفات
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {RANKING_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {card.title}
              </h3>
              <span className="font-['Geist_Mono',monospace] text-[11px] text-[#006828] font-medium whitespace-nowrap ms-2">
                {card.stat}
              </span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* موارد ذات صلة */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          موارد ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/ar/workforce"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            مركز معلومات القوى العاملة
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            نظرة شاملة على سوق العمل مع النسب والتوزيعات والمعايير
          </p>
        </Link>
        <Link
          href="/ar/professionals"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            دليل المهنيين
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            ابحث في قاعدة بيانات المهنيين المرخّصين حسب الاسم أو التخصص أو
            المنشأة
          </p>
        </Link>
        <Link
          href="/ar/professionals/stats"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            إحصائيات القوى العاملة
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            إحصائيات مجمّعة، التوزيع الجغرافي، وتحليل الأخصائيين مقابل
            الاستشاريين
          </p>
        </Link>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تعكس
          التصنيفات أعداد المهنيين المرخّصين فقط. تحقق من الاعتماد المهني
          مباشرة مع هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
