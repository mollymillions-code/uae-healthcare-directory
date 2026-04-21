import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/pricing";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

interface Props {
  params: Promise<{ city: string }>;
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
  const { city: citySlug } = await params;
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return {};

  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(citySlug);
  const procsInCity = PROCEDURES.filter((p) => p.cityPricing[citySlug]);
  const cheapest = procsInCity.reduce(
    (min, p) => Math.min(min, p.cityPricing[citySlug]?.min ?? Infinity),
    Infinity
  );
  const mostExpensive = procsInCity.reduce(
    (max, p) => Math.max(max, p.cityPricing[citySlug]?.max ?? 0),
    0
  );

  return {
    title: `أسعار الإجراءات الطبية في ${cityNameAr}`,
    description: `قارن ${procsInCity.length.toLocaleString("ar-AE")} إجراءً طبياً في ${cityNameAr}، الإمارات. من ${formatAed(cheapest)} إلى ${formatAed(mostExpensive)}. تغطية التأمين وتقدير التكاليف ودليل المزودين. مبني على بيانات التعرفة الرسمية.`,
    alternates: {
      canonical: `${base}/ar/pricing/city/${citySlug}`,
      languages: {
        "en-AE": `${base}/pricing/city/${citySlug}`,
        "ar-AE": `${base}/ar/pricing/city/${citySlug}`,
      },
    },
    openGraph: {
      title: `أسعار الإجراءات الطبية في ${cityNameAr}`,
      description: `${procsInCity.length.toLocaleString("ar-AE")} إجراء طبي مسعَّر في ${cityNameAr}. قارن الأسعار وتحقق من التغطية التأمينية وابحث عن المزودين.`,
      url: `${base}/ar/pricing/city/${citySlug}`,
      type: "website",
    },
  };
}

export default async function ArCityPricingHubPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) notFound();

  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(citySlug);
  const regulatorAr = getArabicRegulator(citySlug);

  const procsInCity = PROCEDURES.filter((p) => p.cityPricing[citySlug]).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  // Price stats for this city
  const typicals = procsInCity.map((p) => p.cityPricing[citySlug].typical);
  const avgTypical = Math.round(
    typicals.reduce((a, b) => a + b, 0) / typicals.length
  );

  // Compare with other cities
  const cityAvgs = CITIES.map((c) => {
    const procs = PROCEDURES.filter((p) => p.cityPricing[c.slug]);
    const typs = procs.map((p) => p.cityPricing[c.slug].typical);
    return {
      slug: c.slug,
      name: c.name,
      avg:
        typs.length > 0
          ? Math.round(typs.reduce((a, b) => a + b, 0) / typs.length)
          : 0,
      count: procs.length,
    };
  }).sort((a, b) => a.avg - b.avg);

  const minPrice = procsInCity.reduce(
    (m, p) => Math.min(m, p.cityPricing[citySlug].min),
    Infinity
  );
  const maxPrice = procsInCity.reduce(
    (m, p) => Math.max(m, p.cityPricing[citySlug].max),
    0
  );
  const cityRank = cityAvgs.findIndex((c) => c.slug === citySlug) + 1;

  const regulatorShort =
    citySlug === "dubai"
      ? "DHA"
      : citySlug === "abu-dhabi" || citySlug === "al-ain"
      ? "DOH"
      : "MOHAP";

  const pricingMethodAr =
    citySlug === "abu-dhabi" || citySlug === "al-ain"
      ? "التعرفة الإلزامية لدائرة الصحة (شفافية)"
      : citySlug === "dubai"
      ? "بارامترات DRG لهيئة صحة دبي"
      : "إرشادات وزارة الصحة";

  const faqs = [
    {
      question: `كم تبلغ تكاليف الإجراءات الطبية في ${cityNameAr}؟`,
      answer: `تتراوح أسعار الإجراءات الطبية في ${cityNameAr} بين ${formatAed(minPrice)} للفحوصات الأساسية و${formatAed(maxPrice)} للجراحات الكبرى. متوسط السعر الاعتيادي عبر ${procsInCity.length.toLocaleString("ar-AE")} إجراء هو ${formatAed(avgTypical)}. ينظّم الرعاية الصحية في ${cityNameAr} ${regulatorAr}.`,
    },
    {
      question: `هل ${cityNameAr} أغلى من غيرها في الإمارات للرعاية الطبية؟`,
      answer: `تحتل ${cityNameAr} المرتبة رقم ${cityRank.toLocaleString("ar-AE")} من أصل ${cityAvgs.length.toLocaleString("ar-AE")} مدن إماراتية من حيث متوسط تكاليف الإجراءات (${getArabicCityName(cityAvgs[0].slug)} الأرخص، و${getArabicCityName(cityAvgs[cityAvgs.length - 1].slug)} الأغلى). متوسط السعر الاعتيادي في ${cityNameAr} هو ${formatAed(avgTypical)}.`,
    },
    {
      question: `هل يغطّي التأمين الإجراءات الطبية في ${cityNameAr}؟`,
      answer: `أصبح التأمين الصحي إلزامياً لجميع المقيمين في الإمارات منذ يناير 2025. تُغطى معظم الإجراءات الضرورية طبياً بنسبة تحمّل تتراوح بين 0% و20%. لا تُغطى الإجراءات التجميلية في الغالب. تتوقف التغطية على مستوى الخطة.`,
    },
    {
      question: `أين يمكنني إيجاد رعاية طبية بأسعار معقولة في ${cityNameAr}؟`,
      answer: `المستشفيات الحكومية والعيادات الخاصة الأساسية في ${cityNameAr} توفر عادةً أدنى الأسعار. تصفح مزودي الخدمات في دليل الرعاية الصحية المفتوح في الإمارات للمقارنة حسب التقييم وقبول التأمين. احرص دائماً على تأكيد السعر مباشرةً مع المنشأة قبل الحجز.`,
    },
  ];

  const categoryMap: Record<string, string[]> = {
    diagnostics: ["radiology-imaging", "labs-diagnostics"],
    dental: ["dental"],
    "eye-care": ["ophthalmology"],
    surgical: ["hospitals", "gastroenterology"],
    orthopedic: ["orthopedics"],
    maternity: ["ob-gyn", "fertility-ivf"],
    cosmetic: ["cosmetic-plastic", "dermatology"],
    cardiac: ["cardiology"],
    wellness: ["clinics"],
    therapy: ["physiotherapy", "mental-health"],
  };

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "أسعار الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: cityNameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "أسعار الإجراءات", href: "/ar/pricing" },
          { label: cityNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            أسعار الإجراءات الطبية في {cityNameAr}
          </h1>
        </div>
        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            قارن أسعار {procsInCity.length.toLocaleString("ar-AE")} إجراءً طبياً في {cityNameAr}، الإمارات.
            متوسط السعر الاعتيادي: {formatAed(avgTypical)}.
            ينظّم الرعاية الصحية في {cityNameAr} {regulatorAr}.
            الأسعار مبنية على {pricingMethodAr} وبيانات السوق الموثّقة.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: procsInCity.length.toLocaleString("ar-AE"),
              label: "إجراء مسعَّر",
            },
            { value: formatAed(avgTypical), label: "متوسط السعر الاعتيادي" },
            {
              value: `#${cityRank.toLocaleString("ar-AE")} من ${cityAvgs.length.toLocaleString("ar-AE")}`,
              label: "ترتيب التكلفة",
            },
            { value: regulatorShort, label: "الجهة المنظِّمة" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-lg font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* City comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {cityNameAr} مقارنةً بباقي الإمارات
        </h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        {cityAvgs.map((c) => {
          const isCurrent = c.slug === citySlug;
          const diff = c.avg - avgTypical;
          const pctDiff =
            avgTypical > 0 ? Math.round((diff / avgTypical) * 100) : 0;
          return (
            <div
              key={c.slug}
              className={`grid grid-cols-3 gap-4 p-3 ${
                isCurrent
                  ? "bg-[#006828]/5 border-r-2 border-[#006828]"
                  : "hover:bg-[#f8f8f6]"
              }`}
            >
              {isCurrent ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#006828]" />
                  <span className="text-sm font-bold text-[#006828]">
                    {getArabicCityName(c.slug)}
                  </span>
                </div>
              ) : (
                <Link
                  href={`/ar/pricing/city/${c.slug}`}
                  className="flex items-center gap-2 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-black/40" />
                  <span className="text-sm text-[#1c1c1c] group-hover:text-[#006828]">
                    {getArabicCityName(c.slug)}
                  </span>
                </Link>
              )}
              <div className="text-left">
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(c.avg)}
                </span>
                <span className="text-[10px] text-black/40 mr-1">متوسط</span>
              </div>
              <div className="text-left">
                {isCurrent ? (
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    الحالية
                  </span>
                ) : (
                  <span
                    className={`text-xs font-medium ${
                      diff < 0
                        ? "text-green-700"
                        : diff > 0
                        ? "text-red-700"
                        : "text-black/40"
                    }`}
                  >
                    {diff < 0 ? `${pctDiff}%` : diff > 0 ? `+${pctDiff}%` : "مساوٍ"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Procedures by category */}
      {PROCEDURE_CATEGORIES.map((cat) => {
        const catProcs = procsInCity
          .filter((p) => (categoryMap[cat.slug] || []).includes(p.categorySlug))
          .sort(
            (a, b) =>
              (a.cityPricing[citySlug]?.typical ?? 0) -
              (b.cityPricing[citySlug]?.typical ?? 0)
          );

        if (catProcs.length === 0) return null;

        return (
          <div key={cat.slug} className="mb-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                <Link
                  href={`/ar/pricing/category/${cat.slug}/${citySlug}`}
                  className="hover:text-[#006828]"
                >
                  {CATEGORY_NAMES_AR[cat.slug] || cat.name} في {cityNameAr}
                </Link>
              </h2>
            </div>
            <div className="border border-black/[0.06] divide-y divide-light-200">
              {catProcs.map((proc) => {
                const pricing = proc.cityPricing[citySlug];
                return (
                  <Link
                    key={proc.slug}
                    href={`/ar/pricing/${proc.slug}/${citySlug}`}
                    className="flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] truncate">
                        {proc.nameAr || proc.name}
                      </h3>
                      <p className="text-[11px] text-black/40">{proc.duration}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 mr-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 hidden sm:inline ${coverageColorClass(proc.insuranceCoverage)}`}
                      >
                        {coverageLabelAr(proc.insuranceCoverage)}
                      </span>
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                        {formatAed(pricing.typical)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`التكاليف الطبية في ${cityNameAr} — أسئلة شائعة`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> أسعار {cityNameAr} نطاقات استرشادية مبنية على {pricingMethodAr} وبيانات السوق الموثّقة حتى مارس 2026.
          تتوقف التكاليف الفعلية على المنشأة والطبيب وخطة التأمين. ينظّم الرعاية الصحية في {cityNameAr} {regulatorAr}.
        </p>
      </div>
    </div>
  );
}
