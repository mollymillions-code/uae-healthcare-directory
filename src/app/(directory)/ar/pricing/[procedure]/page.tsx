import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Activity, Shield, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CostEstimator } from "@/components/pricing/CostEstimator";
import {
  getProcedureBySlug,
  getProcedureWithStats,
  getProcedureCityPricing,
  procedureSchema,
  formatAed,
  PROCEDURES,
} from "@/lib/pricing";
import { INSURER_PROFILES } from "@/lib/constants/insurance-plans";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return PROCEDURES.map((p) => ({ procedure: p.slug }));
}

interface Props {
  params: Promise<{ procedure: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { procedure: slug } = await params;
  const proc = getProcedureBySlug(slug);
  if (!proc) return {};

  const base = getBaseUrl();
  const procedureName = proc.nameAr || proc.name;

  return {
    title: `أسعار ${procedureName} في الإمارات`,
    description: `كم تبلغ تكلفة ${procedureName} في الإمارات؟ قارن الأسعار عبر دبي وأبوظبي والشارقة وجميع الإمارات. تغطية التأمين وتقدير التكلفة. مبني على بيانات التعرفة الإلزامية لدائرة الصحة.`,
    alternates: {
      canonical: `${base}/ar/pricing/${slug}`,
      languages: {
        "en-AE": `${base}/pricing/${slug}`,
        "ar-AE": `${base}/ar/pricing/${slug}`,
      },
    },
    openGraph: {
      title: `أسعار ${procedureName} في الإمارات`,
      description: `قارن أسعار ${procedureName} عبر 8 مدن إماراتية. تقدير التكلفة بعد خصم التأمين.`,
      url: `${base}/ar/pricing/${slug}`,
      type: "website",
    },
  };
}

export default async function ArProcedureDetailPage({ params }: Props) {
  const { procedure: slug } = await params;
  const proc = getProcedureWithStats(slug);
  if (!proc) notFound();

  const base = getBaseUrl();
  const cityPricing = await getProcedureCityPricing(slug);
  const procedureName = proc.nameAr || proc.name;

  // Related procedures
  const related = proc.relatedProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean);

  // Plans for cost estimator
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

  const coverageColor =
    proc.insuranceCoverage === "typically-covered"
      ? "text-green-700 bg-green-50 border-green-200"
      : proc.insuranceCoverage === "partially-covered"
      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
      : proc.insuranceCoverage === "rarely-covered"
      ? "text-orange-700 bg-orange-50 border-orange-200"
      : "text-red-700 bg-red-50 border-red-200";

  const coverageLabelAr =
    proc.insuranceCoverage === "typically-covered"
      ? "مشمول عادةً"
      : proc.insuranceCoverage === "partially-covered"
      ? "مشمول جزئياً"
      : proc.insuranceCoverage === "rarely-covered"
      ? "نادراً ما يُشمَل"
      : "غير مشمول بالتأمين";

  const settingAr = (setting: string) => {
    if (setting === "inpatient") return "يستلزم إقامة في المستشفى";
    if (setting === "outpatient") return "لا يستلزم إقامة";
    if (setting === "day-case") return "نهاري (العودة للمنزل في اليوم ذاته)";
    return "إقامة أو نهاري";
  };

  const anaesthesiaAr = (anaesthesia: string) => {
    if (anaesthesia === "none") return "لا يحتاج تخديراً";
    if (anaesthesia === "local") return "تخدير موضعي";
    if (anaesthesia === "sedation") return "تخدير خفيف";
    if (anaesthesia === "general") return "تخدير عام";
    return "يتفاوت";
  };

  const faqs = [
    {
      question: `كم تبلغ تكلفة ${procedureName} في الإمارات؟`,
      answer: `تتراوح تكلفة ${procedureName} في الإمارات بين ${formatAed(proc.priceRange.min)} و${formatAed(proc.priceRange.max)}. متوسط السعر الاعتيادي عبر جميع الإمارات هو ${formatAed(proc.averageTypical)}. تعدّ ${proc.cheapestCity.name} الأرخص بسعر اعتيادي يبلغ نحو ${formatAed(proc.cheapestCity.typical)}.`,
    },
    {
      question: `هل يغطّي التأمين ${procedureName} في الإمارات؟`,
      answer: `${proc.insuranceNotes}`,
    },
    {
      question: `ما مدة ${procedureName}؟`,
      answer: `تستغرق هذه الإجراء عادةً ${proc.duration}. فترة التعافي: ${proc.recoveryTime}. ${settingAr(proc.setting)}.`,
    },
    {
      question: `أي مدينة إماراتية الأرخص لإجراء ${procedureName}؟`,
      answer: `${proc.cheapestCity.name} هي الأرخص بسعر اعتيادي يبلغ ${formatAed(proc.cheapestCity.typical)}، فيما تعدّ ${proc.mostExpensiveCity.name} الأغلى بسعر اعتيادي يبلغ ${formatAed(proc.mostExpensiveCity.typical)}.`,
    },
  ];

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Schema.org */}
      <JsonLd data={procedureSchema(proc)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "أسعار الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: procedureName },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "أسعار الإجراءات", href: "/ar/pricing" },
          { label: procedureName },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          تكلفة {procedureName} في الإمارات
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-1">
          {proc.name} · CPT {proc.cptCode}
        </p>

        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mt-4 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            تتراوح تكلفة {procedureName} في الإمارات بين {formatAed(proc.priceRange.min)} و{formatAed(proc.priceRange.max)}،
            بمتوسط اعتيادي يبلغ {formatAed(proc.averageTypical)}. {proc.cheapestCity.name} هي الأرخص (~{formatAed(proc.cheapestCity.typical)}),
            فيما {proc.mostExpensiveCity.name} هي الأغلى (~{formatAed(proc.mostExpensiveCity.typical)}).
            تغطية التأمين: {coverageLabelAr}.
          </p>
        </div>
      </div>

      {/* Price headline + key facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Price card */}
        <div className="lg:col-span-2 border border-black/[0.06] rounded-2xl p-6">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
              {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
            </p>
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-6">
            النطاق السعري عبر جميع المنشآت الإماراتية · اعتيادي: {formatAed(proc.averageTypical)}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#f8f8f6] p-3 text-center">
              <p className="text-[11px] text-black/40 mb-1">أرخص مدينة</p>
              <p className="text-sm font-bold text-green-700">
                {getArabicCityName(proc.cheapestCity.slug)}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                ~{formatAed(proc.cheapestCity.typical)}
              </p>
            </div>
            <div className="bg-[#f8f8f6] p-3 text-center">
              <p className="text-[11px] text-black/40 mb-1">أغلى مدينة</p>
              <p className="text-sm font-bold text-red-700">
                {getArabicCityName(proc.mostExpensiveCity.slug)}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                ~{formatAed(proc.mostExpensiveCity.typical)}
              </p>
            </div>
            <div className="bg-[#f8f8f6] p-3 text-center">
              <p className="text-[11px] text-black/40 mb-1">المدة</p>
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {proc.duration}
              </p>
            </div>
            <div className="bg-[#f8f8f6] p-3 text-center">
              <p className="text-[11px] text-black/40 mb-1">التعافي</p>
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {proc.recoveryTime}
              </p>
            </div>
          </div>
        </div>

        {/* Quick facts sidebar */}
        <div className="space-y-4">
          <div className={`border p-4 ${coverageColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" />
              <p className="text-sm font-bold">{coverageLabelAr}</p>
            </div>
            <p className="text-xs">{proc.insuranceNotes.slice(0, 150)}...</p>
          </div>

          <div className="border border-black/[0.06] rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-black/40" />
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                <strong className="text-[#1c1c1c]">الإعداد:</strong>{" "}
                {settingAr(proc.setting)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-black/40" />
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                <strong className="text-[#1c1c1c]">التخدير:</strong>{" "}
                {anaesthesiaAr(proc.anaesthesia)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* City-by-City Pricing Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          الأسعار حسب المدينة
        </h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-5 gap-4 p-3 bg-[#f8f8f6] text-[11px] font-bold text-black/40 uppercase tracking-wider">
          <div>المدينة</div>
          <div className="text-left">الأدنى</div>
          <div className="text-left">الاعتيادي</div>
          <div className="text-left">الأعلى</div>
          <div className="text-left">المزودون</div>
        </div>
        {cityPricing
          .sort((a, b) => a.pricing.typical - b.pricing.typical)
          .map((city) => (
            <Link
              key={city.citySlug}
              href={`/ar/pricing/${slug}/${city.citySlug}`}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group items-center"
            >
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <MapPin className="w-3.5 h-3.5 text-black/40" />
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                  {getArabicCityName(city.citySlug)}
                </span>
              </div>
              <div className="text-left">
                <span className="sm:hidden text-[10px] text-black/40 ml-1">الأدنى:</span>
                <span className="font-['Geist',sans-serif] text-sm text-black/40">
                  {formatAed(city.pricing.min)}
                </span>
              </div>
              <div className="text-left">
                <span className="sm:hidden text-[10px] text-black/40 ml-1">الاعتيادي:</span>
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(city.pricing.typical)}
                </span>
              </div>
              <div className="text-left">
                <span className="sm:hidden text-[10px] text-black/40 ml-1">الأعلى:</span>
                <span className="font-['Geist',sans-serif] text-sm text-black/40">
                  {formatAed(city.pricing.max)}
                </span>
              </div>
              <div className="text-left flex items-center gap-1">
                <span className="font-['Geist',sans-serif] text-xs text-black/40">
                  {city.providerCount.toLocaleString("ar-AE")} مزود
                </span>
                <ArrowRight className="w-3 h-3 text-black/40 group-hover:text-[#006828] rotate-180" />
              </div>
            </Link>
          ))}
      </div>

      {/* About the Procedure */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          عن {procedureName}
        </h2>
      </div>
      <div className="mb-10 space-y-4">
        <div className="prose-sm text-black/40 leading-relaxed">
          <p>{proc.description}</p>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
            ماذا تتوقع؟
          </h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            {proc.whatToExpect}
          </p>
        </div>
      </div>

      {/* Insurance Cost Estimator */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          احسب تكلفتك بعد خصم التأمين
        </h2>
      </div>
      <div className="mb-10">
        <CostEstimator
          procedureName={proc.name}
          typicalCost={proc.averageTypical}
          insuranceCoverage={proc.insuranceCoverage}
          setting={proc.setting}
          plans={estimatorPlans}
        />
      </div>

      {/* Related Procedures */}
      {related.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              إجراءات ذات صلة
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {related.map((rel) => (
              <Link
                key={rel!.slug}
                href={`/ar/pricing/${rel!.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] mb-1">
                  {rel!.nameAr || rel!.name}
                </h3>
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
                  {formatAed(rel!.priceRange.min)} – {formatAed(rel!.priceRange.max)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${procedureName} في الإمارات — أسئلة شائعة`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> الأسعار المعروضة نطاقات استرشادية مبنية على منهجية التعرفة الإلزامية لدائرة الصحة (شفافية) وبارامترات DRG لهيئة صحة دبي وبيانات السوق الموثّقة حتى مارس 2026.
          تتوقف التكاليف الفعلية على المنشأة والطبيب ودرجة التعقيد السريري وخطة التأمين. احصل دائماً على عرض سعر شخصي من مقدم الرعاية الصحية.
          لا تمثل هذه الصفحة نصيحة طبية أو مالية.
        </p>
      </div>
    </div>
  );
}
