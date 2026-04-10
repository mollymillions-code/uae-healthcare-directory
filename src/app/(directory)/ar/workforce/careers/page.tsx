import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "المسارات المهنية الصحية في دبي — معلومات القوى العاملة والأدلة المهنية",
    description:
      "معلومات مهنية للكوادر الصحية في دبي. حجم القوى العاملة حسب الفئة، التخصصات الأكثر طلباً، بيئة أصحاب العمل، وأدلة ترخيص هيئة الصحة بدبي للأطباء وأطباء الأسنان والممرضين والمهنيين الصحيين المساندين.",
    alternates: {
      canonical: `${base}/ar/workforce/careers`,
      languages: {
        "en-AE": `${base}/workforce/careers`,
        "ar-AE": `${base}/ar/workforce/careers`,
      },
    },
    openGraph: {
      title: "المسارات المهنية الصحية في دبي",
      description:
        "معلومات مهنية مبنية على البيانات للكوادر الصحية التي تستهدف سوق العمل في دبي.",
      url: `${base}/ar/workforce/careers`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

const CAREER_GUIDES_AR = [
  {
    slug: "dha-licensing",
    title: "عملية الترخيص من هيئة الصحة بدبي",
    description:
      "دليل خطوة بخطوة للحصول على ترخيص هيئة الصحة بدبي عبر نظام شريان للكوادر الصحية المؤهّلة خارج الدولة.",
  },
  {
    slug: "specialist-vs-consultant",
    title: "مسار الأخصائي مقابل الاستشاري",
    description:
      "فهم التسلسل الهرمي لتصنيفات هيئة الصحة بدبي: متى وكيف يرقى المهنيون من أخصائي إلى استشاري.",
  },
  {
    slug: "ftl-vs-reg",
    title: "الفرق بين ترخيص FTL وREG",
    description:
      "ما الذي يعنيه الترخيص الكامل الوقت والتسجيل لمسيرتك المهنية وتنقّلك وإمكاناتك الوظيفية في دبي.",
  },
  {
    slug: "international-doctors-dubai",
    title: "الأطباء الدوليون في دبي",
    description:
      "ما يحتاج خريجو الطب الدوليون معرفته حول الممارسة في دبي — المؤهلات والامتحانات ومسارات الترخيص.",
  },
  {
    slug: "choosing-right-specialist",
    title: "اختيار الأخصائي المناسب",
    description:
      "كيفية اختيار الأخصائي الطبي المناسب في دبي بناءً على حالتك وتأمينك واحتياجاتك السريرية.",
  },
  {
    slug: "healthcare-workforce",
    title: "نظرة عامة على القوى العاملة الصحية",
    description:
      "نظرة شاملة مبنية على البيانات عن القوى العاملة الصحية في دبي — الحجم واتجاهات النمو وتوزيع الفئات وما يعنيه ذلك للباحثين عن عمل.",
  },
];

export default function ArCareersPage() {
  const base = getBaseUrl();
  const topSpecialties = [...ALL_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

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
          name: "المسارات المهنية الصحية في دبي",
          description:
            "معلومات مهنية وأدلة للكوادر الصحية في دبي.",
          url: `${base}/ar/workforce/careers`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.careers },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.careers },
        ]}
      />

      {/* هيدر الصفحة */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          معلومات مهنية
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          المسارات المهنية الصحية في دبي
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          معلومات مهنية مبنية على البيانات للكوادر الصحية التي تستهدف دبي. حجم
          القوى العاملة حسب الفئة، التخصصات الأكثر طلباً، تصنيف أصحاب العمل،
          وإرشادات الترخيص من هيئة الصحة بدبي.
        </p>

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يضم قطاع الرعاية الصحية في دبي{" "}
            <strong>
              {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")}
            </strong>{" "}
            مهنياً مرخّصاً من هيئة الصحة بدبي عبر{" "}
            <strong>
              {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")}
            </strong>{" "}
            منشأة، مما يجعله أحد أسرع أسواق العمل الصحي نمواً وتنوعاً في
            الشرق الأوسط.
          </p>
        </div>
      </div>

      {/* بطاقات المسارات المهنية حسب الفئة */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          المسارات المهنية حسب الفئة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const pct = Math.round(
            (cat.count / PROFESSIONAL_STATS.total) * 100
          );
          return (
            <Link
              key={cat.slug}
              href={`/ar/workforce/career/category/${cat.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {cat.nameAr}
                </h3>
                <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {cat.count.toLocaleString("ar-AE")}
                </span>
              </div>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed mb-3">
                {cat.description}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-[#f8f8f6] overflow-hidden">
                    <div
                      className="h-full bg-[#006828]/40"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30">
                  {pct}% من القوى العاملة
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* روابط المسارات المهنية للتخصصات الأبرز */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز التخصصات
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
        {topSpecialties.map((spec) => (
          <Link
            key={spec.slug}
            href={`/ar/workforce/career/${spec.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
              {spec.nameAr || spec.name}
            </p>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-[#006828] font-medium">
              {spec.count.toLocaleString("ar-AE")} مهنياً
            </p>
          </Link>
        ))}
      </div>

      {/* الأدلة المهنية */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          الأدلة المهنية
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {CAREER_GUIDES_AR.map((guide) => (
          <Link
            key={guide.slug}
            href={`/ar/professionals/guide/${guide.slug}`}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2 group-hover:text-[#006828] transition-colors">
              {guide.title}
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>

      {/* روابط ذات صلة */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/ar/workforce/employers"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            أبرز أصحاب العمل
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            قائمة مصنّفة بالمنشآت الصحية حسب عدد الكوادر
          </p>
        </Link>
        <Link
          href="/ar/workforce/specialties"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            تحليل التخصصات
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            جميع التخصصات الـ {ALL_SPECIALTIES.length} مصنّفةً حسب حجم القوى
            العاملة
          </p>
        </Link>
        <Link
          href="/ar/workforce/benchmarks"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            معايير التوظيف
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            نسب الممرضين إلى الأطباء، معدلات FTL، وغيرها
          </p>
        </Link>
      </div>

      {/* إخلاء مسؤولية */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> هيئة الصحة بدبي (DHA) — السجل الطبي المهني
          شريان. تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. الأدلة
          المهنية لأغراض معلوماتية فقط ولا تُشكّل استشارة توظيف أو هجرة. تحقق
          من جميع متطلبات الترخيص مباشرة مع هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
