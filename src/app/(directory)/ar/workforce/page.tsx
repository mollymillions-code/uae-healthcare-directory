import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getWorkforceRatios,
  getLicenseTypeBreakdown,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "معلومات القوى العاملة الصحية في دبي",
    description:
      "تحليلات شاملة لسوق العمل الصحي في دبي — 99,520 كادراً صحياً مرخّصاً من هيئة صحة دبي عبر 5,505 منشآت. نسب القوى العاملة، تصنيف أصحاب العمل، تحليل التخصصات، التوزيع الجغرافي، ومعايير التوظيف من سجل شريان الطبي.",
    alternates: {
      canonical: `${base}/ar/workforce`,
      languages: {
        "en-AE": `${base}/workforce`,
        "ar-AE": `${base}/ar/workforce`,
      },
    },
    openGraph: {
      title: "معلومات القوى العاملة الصحية في دبي",
      description:
        "المصدر الأشمل لمعلومات سوق العمل الصحي في دبي. 99,520 كادراً مرخّصاً، 73 تخصصاً، 5,505 منشأة. بيانات من سجل شريان الطبي التابع لهيئة صحة دبي.",
      url: `${base}/ar/workforce`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

const SUB_HUBS = [
  {
    titleAr: "نظرة عامة",
    href: "/ar/workforce/overview",
    descriptionAr:
      "التقرير الرئيسي: نسب السكان، توزيع الفئات، أنواع التراخيص، أكبر المنشآت، والتركّز الجغرافي.",
    stat: "تقرير شامل",
  },
  {
    titleAr: "التخصصات",
    href: "/ar/workforce/specialties",
    descriptionAr:
      "جميع التخصصات الـ 73 المُتابَعة مرتّبةً حسب حجم القوى العاملة ومعدلات نصيب الفرد ونفاذ التراخيص الدائمة.",
    stat: `${ALL_SPECIALTIES.length} تخصصاً`,
  },
  {
    titleAr: "أصحاب العمل",
    href: "/ar/workforce/employers",
    descriptionAr:
      "المنشآت الصحية مرتّبةً حسب إجمالي عدد الموظفين — من المستشفيات الكبرى إلى العيادات الصغيرة.",
    stat: `${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة`,
  },
  {
    titleAr: "المناطق",
    href: "/ar/workforce/areas",
    descriptionAr:
      "مواقع تركّز الكوادر الصحية في أحياء دبي ومناطقها الطبية المتخصصة.",
    stat: "٣٦ منطقة",
  },
  {
    titleAr: "المعايير المرجعية",
    href: "/ar/workforce/benchmarks",
    descriptionAr:
      "نسب الممرضين إلى الأطباء، معدلات التخصص للفرد، تحليل الترخيص الدائم، خطوط التشاور، وتركّز التخصصات.",
    stat: "٦ معايير",
  },
  {
    titleAr: "المسارات المهنية",
    href: "/ar/workforce/careers",
    descriptionAr:
      "أدلة مهنية ومعلومات لسوق العمل تخص الكوادر الصحية الراغبة في العمل بدبي.",
    stat: "٤ فئات",
  },
  {
    titleAr: "المقارنات",
    href: "/ar/workforce/compare",
    descriptionAr:
      "مقارنات جانبية للقوى العاملة عبر التخصصات والمناطق وأصحاب العمل والفئات.",
    stat: "٤ أبعاد",
  },
  {
    titleAr: "تحليل العرض",
    href: "/ar/workforce/supply",
    descriptionAr:
      "مدى كفاية عرض التخصصات: معدلات نصيب الفرد، التغطية الجغرافية، تركّز أصحاب العمل، وفجوات العرض.",
    stat: "٣٥ تخصصاً",
  },
  {
    titleAr: "التصنيفات",
    href: "/ar/workforce/rankings",
    descriptionAr:
      "جداول ترتيب دبي الصحية: أكبر أصحاب العمل، أكبر التخصصات، نسب التوظيف، ومعدلات الترخيص الدائم.",
    stat: "٤ تصنيفات",
  },
];

export default function ArabicWorkforceHubPage() {
  const base = getBaseUrl();
  const ratios = getWorkforceRatios();
  const license = getLicenseTypeBreakdown();

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
          name: "معلومات القوى العاملة الصحية في دبي",
          description: `بيانات وتحليلات سوق العمل لـ ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً من هيئة صحة دبي.`,
          url: `${base}/ar/workforce`,
          inLanguage: "ar",
          mainEntity: {
            "@type": "Dataset",
            name: "بيانات القوى العاملة الصحية في دبي",
            description: `${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخّصاً عبر ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة في دبي، مصدرها سجل شريان الطبي التابع لهيئة صحة دبي.`,
            creator: {
              "@type": "Organization",
              name: "هيئة صحة دبي",
            },
            temporalCoverage: PROFESSIONAL_STATS.scraped,
            variableMeasured: [
              "عدد المهنيين حسب الفئة",
              "نسبة الأطباء إلى السكان",
              "نسبة الممرضين إلى الأطباء",
              "توزيع أنواع التراخيص",
            ],
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/` },
          { name: "معلومات القوى العاملة الصحية" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "معلومات القوى العاملة الصحية" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          {ar.workforce.subtitle}
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          {ar.workforce.title}
        </h1>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            ترصد Zavis كل كادر صحي مرخّص من هيئة صحة دبي —{" "}
            <strong>{PROFESSIONAL_STATS.total.toLocaleString("ar-AE")}</strong> كادراً عبر{" "}
            <strong>
              {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")}
            </strong>{" "}
            منشأة — لتقديم أشمل معلومات سوق العمل المتاحة للقطاع الصحي في الإمارة. تخدم
            هذه البيانات مديري المستشفيات، وكالات التوظيف، الاقتصاديين الصحيين، صانعي
            السياسات، والصحفيين المتابعين للقوى العاملة الصحية في دبي.
          </p>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.total.toLocaleString("ar-AE"),
              label: ar.workforce.totalProfessionals,
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE"),
              label: ar.workforce.facilities,
            },
            {
              value: `${ratios.physiciansPer100K.toLocaleString("ar-AE")}`,
              label: "طبيب لكل 100,000 نسمة",
            },
            {
              value: `${ratios.nurseToPhysicianRatio}:١`,
              label: ar.workforce.nurseToDoctorRatio,
            },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
                {value}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Category Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {PROFESSIONAL_CATEGORIES.map((cat) => {
            const pct = Math.round(
              (cat.count / PROFESSIONAL_STATS.total) * 100
            );
            return (
              <div
                key={cat.slug}
                className="border border-black/[0.06] p-4"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
                  {cat.nameAr}
                </p>
                <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828]">
                  {cat.count.toLocaleString("ar-AE")}
                </p>
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
                  {pct}% من القوى العاملة
                </p>
              </div>
            );
          })}
        </div>

        {/* License breakdown */}
        <div className="border border-black/[0.06] p-5 mb-8">
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-2 uppercase tracking-wider">
            توزيع أنواع التراخيص
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-[#f8f8f6] overflow-hidden">
                <div
                  className="h-full bg-[#006828]"
                  style={{ width: `${license.ftlPercent}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-xs font-['Geist_Mono',monospace]">
              <span className="text-[#006828] font-medium">
                FTL {license.ftlPercent}%
              </span>
              <span className="text-black/40">
                REG {license.regPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Hub Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          استكشف معلومات القوى العاملة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {SUB_HUBS.map((hub) => (
          <Link
            key={hub.href}
            href={hub.href}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {hub.titleAr}
              </h3>
              <span className="font-['Geist_Mono',monospace] text-[11px] text-[#006828] font-medium">
                {hub.stat}
              </span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {hub.descriptionAr}
            </p>
          </Link>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مصادر ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/ar/professionals"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            دليل الكوادر الصحية
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            ابحث عن كوادر صحية مرخّصة من هيئة صحة دبي بالاسم أو التخصص أو المنشأة
          </p>
        </Link>
        <Link
          href="/ar/directory/dubai"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            دليل المنشآت الصحية
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            تصفح أكثر من 12,500 منشأة صحية مرخّصة في الإمارات
          </p>
        </Link>
        <Link
          href="/ar/intelligence"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            رؤى القطاع الصحي
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            أخبار وتحليلات قطاع الرعاية الصحية في سوق الإمارات
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل شريان الطبي المهني التابع لهيئة الصحة بدبي (DHA). جُمعت البيانات بتاريخ{" "}
          {PROFESSIONAL_STATS.scraped}. هذه المعلومات لأغراض إرشادية فحسب. تحقق من أوراق
          الاعتماد المهنية مباشرةً من هيئة الصحة بدبي قبل اتخاذ قرارات التوظيف أو الاعتماد.
        </p>
      </div>
    </div>
  );
}
