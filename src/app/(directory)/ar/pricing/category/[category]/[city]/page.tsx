import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CostEstimator } from "@/components/pricing/CostEstimator";
import {
  PROCEDURE_CATEGORIES,
  getProceduresByCategory,
  getProcedureCategoryBySlug,
  formatAed,
} from "@/lib/pricing";
import { INSURER_PROFILES } from "@/lib/constants/insurance-plans";
import { CITIES } from "@/lib/constants/cities";
import { getProviders } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  const params: { category: string; city: string }[] = [];
  for (const cat of PROCEDURE_CATEGORIES) {
    const procs = getProceduresByCategory(cat.slug);
    if (procs.length === 0) continue;
    for (const city of CITIES) {
      if (procs.some((p) => p.cityPricing[city.slug])) {
        params.push({ category: cat.slug, city: city.slug });
      }
    }
  }
  return params;
}

interface Props {
  params: Promise<{ category: string; city: string }>;
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
  const { category: catSlug, city: citySlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!cat || !city) return {};

  const base = getBaseUrl();
  const procs = getProceduresByCategory(catSlug).filter(
    (p) => p.cityPricing[citySlug]
  );
  if (procs.length === 0) return {};

  const catNameAr = CATEGORY_NAMES_AR[catSlug] || cat.name;
  const cityNameAr = getArabicCityName(citySlug);
  const minPrice = procs.reduce(
    (m, p) => Math.min(m, p.cityPricing[citySlug].min),
    Infinity
  );
  const maxPrice = procs.reduce(
    (m, p) => Math.max(m, p.cityPricing[citySlug].max),
    0
  );

  return {
    title: `أسعار ${catNameAr} في ${cityNameAr}`,
    description: `كم تبلغ تكاليف ${catNameAr} في ${cityNameAr}؟ قارن ${procs.length} إجراءً من ${formatAed(minPrice)} إلى ${formatAed(maxPrice)}. تغطية التأمين وتقدير التكاليف وأبرز المزودين في ${cityNameAr}.`,
    alternates: {
      canonical: `${base}/ar/pricing/category/${catSlug}/${citySlug}`,
      languages: {
        "en-AE": `${base}/pricing/category/${catSlug}/${citySlug}`,
        "ar-AE": `${base}/ar/pricing/category/${catSlug}/${citySlug}`,
      },
    },
    openGraph: {
      title: `أسعار ${catNameAr} في ${cityNameAr} — ${procs.length} إجراء`,
      description: `قارن أسعار ${catNameAr} في ${cityNameAr}. النطاق: ${formatAed(minPrice)}–${formatAed(maxPrice)}.`,
      url: `${base}/ar/pricing/category/${catSlug}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function ArCategoryCityPricingPage({ params }: Props) {
  const { category: catSlug, city: citySlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!cat || !city) notFound();

  const base = getBaseUrl();
  const allCatProcs = getProceduresByCategory(catSlug);
  const procs = allCatProcs.filter((p) => p.cityPricing[citySlug]);
  if (procs.length === 0) notFound();

  const catNameAr = CATEGORY_NAMES_AR[catSlug] || cat.name;
  const cityNameAr = getArabicCityName(citySlug);
  const regulatorAr = getArabicRegulator(citySlug);

  // Sort by typical price
  const sortedProcs = [...procs].sort(
    (a, b) =>
      (a.cityPricing[citySlug]?.typical ?? 0) -
      (b.cityPricing[citySlug]?.typical ?? 0)
  );

  const typicals = procs.map((p) => p.cityPricing[citySlug].typical);
  const avgTypical = Math.round(
    typicals.reduce((a, b) => a + b, 0) / typicals.length
  );

  // Compare same category across cities
  const otherCities = CITIES.filter((c) => c.slug !== citySlug)
    .map((c) => {
      const cityProcs = allCatProcs.filter((p) => p.cityPricing[c.slug]);
      const typs = cityProcs.map((p) => p.cityPricing[c.slug].typical);
      return {
        slug: c.slug,
        name: c.name,
        avg:
          typs.length > 0
            ? Math.round(typs.reduce((a, b) => a + b, 0) / typs.length)
            : 0,
      };
    })
    .sort((a, b) => a.avg - b.avg);

  // Directory category slugs for provider lookup
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
  const dirCatSlugs = categoryMap[catSlug] || [];
  const allCityProviders = (await getProviders({ citySlug })).providers;
  const categoryProviders = allCityProviders.filter((p) =>
    dirCatSlugs.includes(p.categorySlug)
  );

  const estimatorPlans = INSURER_PROFILES.flatMap((insurer) =>
    insurer.plans.map((plan) => ({
      id: plan.id,
      insurerSlug: insurer.slug,
      insurerName: insurer.name,
      name: plan.name,
      tier: plan.tier,
      copayOutpatient: plan.copayOutpatient,
      annualLimit: plan.annualLimit,
    }))
  );

  const coveredCount = procs.filter(
    (p) => p.insuranceCoverage === "typically-covered"
  ).length;
  const dominantCoverage =
    coveredCount > procs.length / 2
      ? "typically-covered"
      : ("partially-covered" as const);

  const minPrice = procs.reduce(
    (m, p) => Math.min(m, p.cityPricing[citySlug].min),
    Infinity
  );
  const maxPrice = procs.reduce(
    (m, p) => Math.max(m, p.cityPricing[citySlug].max),
    0
  );

  const faqs = [
    {
      question: `كم تبلغ تكاليف ${catNameAr} في ${cityNameAr}؟`,
      answer: `تتراوح أسعار ${catNameAr} في ${cityNameAr} بين ${formatAed(minPrice)} و${formatAed(maxPrice)}. متوسط السعر الاعتيادي عبر ${procs.length.toLocaleString("ar-AE")} إجراء هو ${formatAed(avgTypical)}. يتوفر ${categoryProviders.length.toLocaleString("ar-AE")} مزود خدمة في ${cityNameAr}.`,
    },
    {
      question: `أي إجراء في ${catNameAr} هو الأرخص في ${cityNameAr}؟`,
      answer: `أقل إجراء سعراً في ${catNameAr} في ${cityNameAr} هو ${sortedProcs[0].nameAr || sortedProcs[0].name} بسعر اعتيادي يبلغ ${formatAed(sortedProcs[0].cityPricing[citySlug].typical)}. أغلاها هو ${sortedProcs[sortedProcs.length - 1].nameAr || sortedProcs[sortedProcs.length - 1].name} بمقدار ${formatAed(sortedProcs[sortedProcs.length - 1].cityPricing[citySlug].typical)}.`,
    },
    {
      question: `هل يغطّي التأمين ${catNameAr} في ${cityNameAr}؟`,
      answer: `من بين ${procs.length.toLocaleString("ar-AE")} إجراء من ${catNameAr}، ${coveredCount.toLocaleString("ar-AE")} مشمول عادةً بالتأمين، ${procs.filter((p) => p.insuranceCoverage === "partially-covered").length} مشمول جزئياً، و${procs.filter((p) => p.insuranceCoverage === "not-covered").length} غير مشمول (تجميلي). ينظّم الرعاية الصحية في ${cityNameAr} ${regulatorAr}.`,
    },
    {
      question: `كم عدد مزودي خدمة ${catNameAr} في ${cityNameAr}؟`,
      answer: `يوجد ${categoryProviders.length.toLocaleString("ar-AE")} مزود خدمة في فئة ${catNameAr} في ${cityNameAr} مدرجٌ في دليل الرعاية الصحية المفتوح في الإمارات. تصفح القوائم لمقارنة التقييمات وقبول التأمين والخدمات المقدمة.`,
    },
  ];

  return (
    <div dir="rtl" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "أسعار الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: catNameAr, url: `${base}/ar/pricing/category/${catSlug}` },
          { name: cityNameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${catNameAr} في ${cityNameAr}`,
          description: `قارن ${procs.length} إجراء من ${catNameAr} في ${cityNameAr}، الإمارات`,
          url: `${base}/ar/pricing/category/${catSlug}/${citySlug}`,
          inLanguage: "ar",
          areaServed: { "@type": "City", name: city.name },
          provider: {
            "@type": "MedicalOrganization",
            name: `مزودو الرعاية الصحية في ${cityNameAr}`,
          },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "AED",
            lowPrice: minPrice,
            highPrice: maxPrice,
            offerCount: procs.length,
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "أسعار الإجراءات", href: "/ar/pricing" },
          { label: catNameAr, href: `/ar/pricing/category/${catSlug}` },
          { label: cityNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أسعار {catNameAr} في {cityNameAr}
        </h1>
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-1">
          {city.nameAr} · ينظّم القطاع: {regulatorAr}
        </p>

        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mt-4 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            يوجد {procs.length.toLocaleString("ar-AE")} إجراء من {catNameAr} مسعَّر في {cityNameAr}، بتكاليف تتراوح بين{" "}
            {formatAed(minPrice)} و{formatAed(maxPrice)}.
            متوسط السعر الاعتيادي هو {formatAed(avgTypical)}.
            يتوفر {categoryProviders.length.toLocaleString("ar-AE")} مزود خدمة في {cityNameAr}.
            {coveredCount.toLocaleString("ar-AE")} من {procs.length.toLocaleString("ar-AE")} إجراء مشمول عادةً بالتأمين الصحي الإماراتي.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-xl font-bold text-[#006828]">
            {procs.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">إجراء</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-xl font-bold text-[#006828]">{formatAed(avgTypical)}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">متوسط اعتيادي</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-xl font-bold text-[#006828]">
            {categoryProviders.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">مزود خدمة</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-xl font-bold text-[#006828]">
            {coveredCount.toLocaleString("ar-AE")}/{procs.length.toLocaleString("ar-AE")}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">مشمول بالتأمين</p>
        </div>
      </div>

      {/* Procedure pricing table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع إجراءات {catNameAr} في {cityNameAr}
        </h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-5 gap-4 p-3 bg-[#f8f8f6] text-[11px] font-bold text-black/40 uppercase tracking-wider">
          <div className="col-span-2">الإجراء</div>
          <div className="text-left">الاعتيادي</div>
          <div className="text-left">النطاق</div>
          <div className="text-left">التأمين</div>
        </div>
        {sortedProcs.map((proc) => {
          const pricing = proc.cityPricing[citySlug];
          return (
            <Link
              key={proc.slug}
              href={`/ar/pricing/${proc.slug}/${citySlug}`}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group items-center"
            >
              <div className="col-span-2 sm:col-span-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                  {proc.nameAr || proc.name}
                </h3>
                <p className="text-[11px] text-black/40">{proc.duration}</p>
              </div>
              <div className="text-left">
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(pricing.typical)}
                </span>
              </div>
              <div className="text-left">
                <span className="font-['Geist',sans-serif] text-xs text-black/40">
                  {formatAed(pricing.min)}–{formatAed(pricing.max)}
                </span>
              </div>
              <div className="text-left">
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColorClass(proc.insuranceCoverage)}`}>
                  {coverageLabelAr(proc.insuranceCoverage)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Compare with other cities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {catNameAr} في مدن أخرى
        </h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        <div className="grid grid-cols-3 gap-4 p-3 bg-[#006828]/5 border-r-2 border-[#006828]">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#006828]" />
            <span className="text-sm font-bold text-[#006828]">{cityNameAr}</span>
          </div>
          <div className="text-left">
            <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
              {formatAed(avgTypical)}
            </span>
          </div>
          <div className="text-left text-xs text-black/40">الحالية</div>
        </div>
        {otherCities.map((c) => {
          const diff = c.avg - avgTypical;
          const pctDiff = avgTypical > 0 ? Math.round((diff / avgTypical) * 100) : 0;
          return (
            <Link
              key={c.slug}
              href={`/ar/pricing/category/${catSlug}/${c.slug}`}
              className="grid grid-cols-3 gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-black/40" />
                <span className="text-sm text-[#1c1c1c] group-hover:text-[#006828]">
                  {getArabicCityName(c.slug)}
                </span>
              </div>
              <div className="text-left">
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(c.avg)}
                </span>
              </div>
              <div className="text-left">
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
              </div>
            </Link>
          );
        })}
      </div>

      {/* Cost Estimator */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          احسب تكلفتك
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        التقدير مبني على متوسط تكاليف {catNameAr} في {cityNameAr} ({formatAed(avgTypical)}).
        للحصول على تقديرات خاصة بكل إجراء، تفضّل بزيارة صفحات الإجراءات الفردية.
      </p>
      <div className="mb-10">
        <CostEstimator
          procedureName={`${cat.name} (متوسط)`}
          typicalCost={avgTypical}
          insuranceCoverage={dominantCoverage}
          setting="outpatient"
          plans={estimatorPlans}
        />
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${catNameAr} في ${cityNameAr} — أسئلة شائعة`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> أسعار {catNameAr} في {cityNameAr} نطاقات استرشادية مبنية على بيانات تعرفة DOH/DHA وأسعار السوق الموثّقة حتى مارس 2026.
          ينظّم الرعاية الصحية في {cityNameAr} {regulatorAr}. احرص دائماً على تأكيد الأسعار مباشرةً مع المزودين.
        </p>
      </div>
    </div>
  );
}
