import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PROCEDURE_CATEGORIES,
  getProceduresByCategory,
  getProcedureCategoryBySlug,
  formatAed,
} from "@/lib/pricing";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return PROCEDURE_CATEGORIES.map((c) => ({ category: c.slug }));
}

interface Props {
  params: Promise<{ category: string }>;
}

const CATEGORY_NAMES_AR: Record<string, string> = {
  diagnostics: "التشخيص والتصوير الطبي",
  dental: "طب الأسنان",
  "eye-care": "طب العيون والرؤية",
  surgical: "الجراحة العامة",
  orthopedic: "جراحة العظام والمفاصل",
  maternity: "الأمومة والولادة",
  cosmetic: "الجراحة التجميلية والترميمية",
  cardiac: "إجراءات القلب",
  wellness: "الاستشارات والرعاية الوقائية",
  therapy: "العلاج وإعادة التأهيل",
};

const coverageLabelAr = (coverage: string) => {
  if (coverage === "typically-covered") return "مشمول";
  if (coverage === "partially-covered") return "جزئي";
  if (coverage === "rarely-covered") return "نادر";
  return "غير مشمول";
};

const coverageColorClass = (coverage: string) => {
  if (coverage === "typically-covered") return "text-green-700 bg-green-50";
  if (coverage === "partially-covered") return "text-yellow-700 bg-yellow-50";
  if (coverage === "rarely-covered") return "text-orange-700 bg-orange-50";
  return "text-red-700 bg-red-50";
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  if (!cat) return {};

  const base = getBaseUrl();
  const procs = getProceduresByCategory(catSlug);
  const minPrice = procs.reduce((m, p) => Math.min(m, p.priceRange.min), Infinity);
  const maxPrice = procs.reduce((m, p) => Math.max(m, p.priceRange.max), 0);
  const catNameAr = CATEGORY_NAMES_AR[catSlug] || cat.name;

  return {
    title: `أسعار ${catNameAr} في الإمارات`,
    description: `كم تبلغ تكاليف ${catNameAr} في الإمارات؟ قارن ${procs.length} إجراءً من ${formatAed(minPrice)} إلى ${formatAed(maxPrice)} عبر دبي وأبوظبي والشارقة وجميع الإمارات. تفاصيل التغطية التأمينية وتقدير التكاليف.`,
    alternates: {
      canonical: `${base}/ar/pricing/category/${catSlug}`,
      languages: {
        "en-AE": `${base}/pricing/category/${catSlug}`,
        "ar-AE": `${base}/ar/pricing/category/${catSlug}`,
      },
    },
    openGraph: {
      title: `أسعار ${catNameAr} في الإمارات`,
      description: `قارن ${procs.length} إجراءً من ${catNameAr} عبر 8 مدن إماراتية.`,
      url: `${base}/ar/pricing/category/${catSlug}`,
      type: "website",
    },
  };
}

export default async function ArCategoryPricingPage({ params }: Props) {
  const { category: catSlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  if (!cat) notFound();

  const base = getBaseUrl();
  const procs = getProceduresByCategory(catSlug);
  if (procs.length === 0) notFound();

  const catNameAr = CATEGORY_NAMES_AR[catSlug] || cat.name;

  // City averages for this category
  const cityStats = CITIES.map((city) => {
    const cityProcs = procs.filter((p) => p.cityPricing[city.slug]);
    const typicals = cityProcs.map((p) => p.cityPricing[city.slug].typical);
    return {
      slug: city.slug,
      name: city.name,
      avg:
        typicals.length > 0
          ? Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length)
          : 0,
      count: cityProcs.length,
    };
  }).sort((a, b) => a.avg - b.avg);

  const minPrice = procs.reduce((m, p) => Math.min(m, p.priceRange.min), Infinity);
  const maxPrice = procs.reduce((m, p) => Math.max(m, p.priceRange.max), 0);
  const coveredCount = procs.filter(
    (p) => p.insuranceCoverage === "typically-covered"
  ).length;

  const faqs = [
    {
      question: `كم تبلغ تكاليف ${catNameAr} في الإمارات؟`,
      answer: `تتراوح أسعار ${catNameAr} في الإمارات بين ${formatAed(minPrice)} و${formatAed(maxPrice)}. نقارن ${procs.length} إجراءً عبر 8 مدن إماراتية. ${cityStats[0]?.name || "الإمارات الشمالية"} تقدم أدنى الأسعار في المتوسط، فيما ${cityStats[cityStats.length - 1]?.name || "دبي"} هي الأغلى.`,
    },
    {
      question: `أي مدينة إماراتية الأرخص لـ${catNameAr}؟`,
      answer: `${getArabicCityName(cityStats[0]?.slug || "")} تمتلك أدنى متوسط تكاليف لـ${catNameAr} بمقدار ${formatAed(cityStats[0]?.avg || 0)}، تليها ${getArabicCityName(cityStats[1]?.slug || "")} بمقدار ${formatAed(cityStats[1]?.avg || 0)}. أغلى المدن هي ${getArabicCityName(cityStats[cityStats.length - 1]?.slug || "")} بمقدار ${formatAed(cityStats[cityStats.length - 1]?.avg || 0)}.`,
    },
    {
      question: `هل يغطّي التأمين ${catNameAr} في الإمارات؟`,
      answer: `تتفاوت التغطية حسب الإجراء. ${coveredCount.toLocaleString("ar-AE")} من أصل ${procs.length.toLocaleString("ar-AE")} إجراء مشمول عادةً بالتأمين. ${procs.filter((p) => p.insuranceCoverage === "not-covered").length} إجراءات تجميلية غير مشمولة. راجع صفحة كل إجراء للاطلاع على تفاصيل التغطية.`,
    },
  ];

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "أسعار الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: catNameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "أسعار الإجراءات", href: "/ar/pricing" },
          { label: catNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          أسعار {catNameAr} في الإمارات
        </h1>
        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            قارن أسعار {procs.length.toLocaleString("ar-AE")} إجراء من {catNameAr} عبر دبي وأبوظبي والشارقة وجميع إمارات الدولة. {cat.description}.
            الأسعار مبنية على منهجية التعرفة الإلزامية لدائرة الصحة وبيانات السوق الموثّقة.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {procs.length.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">إجراء</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">٨</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">مدن مقارَنة</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {coveredCount.toLocaleString("ar-AE")}/{procs.length.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">مشمول بالتأمين</p>
          </div>
        </div>
      </div>

      {/* All procedures in this category */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {catNameAr} — جميع الإجراءات
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {procs.map((proc) => {
          const procName = proc.nameAr || proc.name;
          return (
            <Link
              key={proc.slug}
              href={`/ar/pricing/${proc.slug}`}
              className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                  {procName}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5 rotate-180" />
              </div>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3 line-clamp-2">
                {proc.description.slice(0, 100)}...
              </p>
              <div className="flex items-center justify-between">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColorClass(proc.insuranceCoverage)}`}>
                  {coverageLabelAr(proc.insuranceCoverage)}
                </span>
              </div>
              <div className="mt-2 flex gap-1 text-[10px] text-black/40">
                <span>{proc.duration}</span>
                <span>·</span>
                <span>{proc.recoveryTime}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* City comparison for this category */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أسعار {catNameAr} حسب المدينة
        </h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-3 gap-4 p-3 bg-[#f8f8f6] text-[11px] font-bold text-black/40 uppercase tracking-wider">
          <div>المدينة</div>
          <div className="text-left">متوسط السعر الاعتيادي</div>
          <div className="text-left">الإجراءات</div>
        </div>
        {cityStats.map((c) => (
          <Link
            key={c.slug}
            href={`/ar/pricing/category/${catSlug}/${c.slug}`}
            className="grid grid-cols-3 gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-black/40" />
              <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                {getArabicCityName(c.slug)}
              </span>
            </div>
            <div className="text-left">
              <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {formatAed(c.avg)}
              </span>
            </div>
            <div className="text-left flex items-center gap-1">
              <span className="font-['Geist',sans-serif] text-xs text-black/40">
                {c.count.toLocaleString("ar-AE")} إجراء
              </span>
              <ArrowRight className="w-3 h-3 text-black/40 group-hover:text-[#006828] rotate-180" />
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${catNameAr} في الإمارات — أسئلة شائعة`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> الأسعار المعروضة نطاقات استرشادية مبنية على التعرفة الإلزامية لدائرة الصحة (شفافية) وبارامترات DRG لهيئة صحة دبي وبيانات السوق الموثّقة حتى مارس 2026.
          تتوقف التكاليف الفعلية على المنشأة والطبيب وخطة التأمين.
        </p>
      </div>
    </div>
  );
}
