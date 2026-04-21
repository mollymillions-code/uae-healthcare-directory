import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CostEstimator } from "@/components/pricing/CostEstimator";
import {
  getProcedureBySlug,
  procedureSchema,
  procedureCityOffersSchema,
  formatAed,
  PROCEDURES,
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
  const params: { procedure: string; city: string }[] = [];
  for (const proc of PROCEDURES) {
    for (const citySlug of Object.keys(proc.cityPricing)) {
      params.push({ procedure: proc.slug, city: citySlug });
    }
  }
  return params;
}

interface Props {
  params: Promise<{ procedure: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { procedure: procSlug, city: citySlug } = await params;
  const proc = getProcedureBySlug(procSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!proc || !city) return {};

  const pricing = proc.cityPricing[citySlug];
  if (!pricing) return {};

  const base = getBaseUrl();
  const procedureName = proc.nameAr || proc.name;
  const cityNameAr = getArabicCityName(citySlug);

  return {
    title: `أسعار ${procedureName} في ${cityNameAr}`,
    description: `كم تبلغ تكلفة ${procedureName} في ${cityNameAr}؟ السعر الاعتيادي: ${formatAed(pricing.typical)}. النطاق: ${formatAed(pricing.min)}–${formatAed(pricing.max)}. ابحث عن المزودين وقارن الأسعار وقدّر تكلفتك بعد خصم التأمين.`,
    alternates: {
      canonical: `${base}/ar/pricing/${procSlug}/${citySlug}`,
      languages: {
        "en-AE": `${base}/pricing/${procSlug}/${citySlug}`,
        "ar-AE": `${base}/ar/pricing/${procSlug}/${citySlug}`,
      },
    },
    openGraph: {
      title: `أسعار ${procedureName} في ${cityNameAr}`,
      description: `قارن أسعار ${procedureName} في ${cityNameAr}. النطاق: ${formatAed(pricing.min)}–${formatAed(pricing.max)}. تقدير التكلفة بعد خصم التأمين.`,
      url: `${base}/ar/pricing/${procSlug}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function ArCityProcedurePricingPage({ params }: Props) {
  const { procedure: procSlug, city: citySlug } = await params;
  const proc = getProcedureBySlug(procSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!proc || !city) notFound();

  const pricing = proc.cityPricing[citySlug];
  if (!pricing) notFound();

  const base = getBaseUrl();
  const procedureName = proc.nameAr || proc.name;
  const cityNameAr = getArabicCityName(citySlug);
  const regulatorAr = getArabicRegulator(citySlug);

  // Providers in this city + category
  const allCityProviders = (await getProviders({ citySlug })).providers;
  const categoryProviders = allCityProviders.filter(
    (p) => p.categorySlug === proc.categorySlug
  );
  const providerCount = categoryProviders.length;

  // Top-rated providers (up to 10)
  const topProviders = [...categoryProviders]
    .filter((p) => p.googleRating && Number(p.googleRating) > 0)
    .sort((a, b) => Number(b.googleRating) - Number(a.googleRating))
    .slice(0, 10);

  const offersSchema = procedureCityOffersSchema(proc, citySlug, city.name);

  // Other cities for comparison
  const otherCities = Object.entries(proc.cityPricing)
    .filter(([slug]) => slug !== citySlug)
    .map(([slug, p]) => ({
      slug,
      name: CITIES.find((c) => c.slug === slug)?.name || slug,
      typical: p.typical,
    }))
    .sort((a, b) => a.typical - b.typical);

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

  const faqs = [
    {
      question: `كم تبلغ تكلفة ${procedureName} في ${cityNameAr}؟`,
      answer: `تتراوح تكلفة ${procedureName} في ${cityNameAr} بين ${formatAed(pricing.min)} و${formatAed(pricing.max)}، بسعر اعتيادي يبلغ ${formatAed(pricing.typical)}. يُنظّم الرعاية الصحية في ${cityNameAr} ${regulatorAr}.`,
    },
    {
      question: `هل يغطّي التأمين ${procedureName} في ${cityNameAr}؟`,
      answer: `${proc.insuranceNotes}`,
    },
    {
      question: `كم عدد المزودين المتاحين لـ${procedureName} في ${cityNameAr}؟`,
      answer: `يوجد ${providerCount.toLocaleString("ar-AE")} مزود خدمة في فئة ${proc.categorySlug.replace(/-/g, " ")} في ${cityNameAr}. تواصل مع المزودين مباشرةً للحصول على أسعار دقيقة.`,
    },
    {
      question: `هل ${cityNameAr} أغلى من غيرها في إجراء ${procedureName}؟`,
      answer: `يبلغ السعر الاعتيادي لـ${procedureName} في ${cityNameAr} ${formatAed(pricing.typical)}، مقارنةً بمتوسط الإمارات البالغ ${formatAed(Math.round(Object.values(proc.cityPricing).reduce((s, p) => s + p.typical, 0) / Object.keys(proc.cityPricing).length))}.`,
    },
  ];

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Schema.org */}
      <JsonLd data={procedureSchema(proc)} />
      {offersSchema && <JsonLd data={offersSchema} />}
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "أسعار الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: procedureName, url: `${base}/ar/pricing/${proc.slug}` },
          { name: cityNameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "أسعار الإجراءات", href: "/ar/pricing" },
          { label: procedureName, href: `/ar/pricing/${proc.slug}` },
          { label: cityNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          تكلفة {procedureName} في {cityNameAr}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-1">
          {proc.name} · {city.nameAr} · CPT {proc.cptCode}
        </p>
        <p className="font-['Geist',sans-serif] text-xs text-black/40">
          ينظّم القطاع الصحي في {cityNameAr}: {regulatorAr}
        </p>

        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mt-4 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            تتراوح تكلفة {procedureName} في {cityNameAr} بين {formatAed(pricing.min)} و{formatAed(pricing.max)}، بسعر اعتيادي يبلغ {formatAed(pricing.typical)}.
            يتوفر {providerCount.toLocaleString("ar-AE")} مزود خدمة في هذه الفئة في {cityNameAr}.
            ينظّم الرعاية الصحية في {cityNameAr} {regulatorAr}.
          </p>
        </div>
      </div>

      {/* Price card */}
      <div className="border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-[11px] text-black/40 mb-1">الأدنى</p>
            <p className="text-xl font-bold text-green-700">
              {formatAed(pricing.min)}
            </p>
            <p className="text-[10px] text-black/40">حكومي / أساسي</p>
          </div>
          <div className="text-center border-x border-black/[0.06]">
            <p className="text-[11px] text-black/40 mb-1">الاعتيادي</p>
            <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[22px] sm:text-[26px] text-[#1c1c1c] tracking-tight">
              {formatAed(pricing.typical)}
            </p>
            <p className="text-[10px] text-black/40">متوسط خاص</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-black/40 mb-1">الأعلى</p>
            <p className="text-xl font-bold text-red-700">
              {formatAed(pricing.max)}
            </p>
            <p className="text-[10px] text-black/40">منشأة متميزة</p>
          </div>
        </div>

        {/* Price bar */}
        <div className="h-4 bg-gradient-to-r from-green-200 via-yellow-100 to-red-200 relative mb-2">
          <div
            className="absolute top-0 h-full w-0.5 bg-[#1c1c1c]"
            style={{
              left: `${(((pricing.typical - pricing.min) / (pricing.max - pricing.min)) * 100).toFixed(0)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-black/40">
          <span>{formatAed(pricing.min)}</span>
          <span>اعتيادي: {formatAed(pricing.typical)}</span>
          <span>{formatAed(pricing.max)}</span>
        </div>
      </div>

      {/* Compare with Other Cities */}
      {otherCities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              مقارنة مع مدن أخرى
            </h2>
          </div>
          <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
            {/* Current city highlighted */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-[#006828]/5 border-r-2 border-[#006828]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#006828]" />
                <span className="text-sm font-bold text-[#006828]">{cityNameAr}</span>
              </div>
              <div className="text-left">
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(pricing.typical)}
                </span>
              </div>
              <div className="text-left text-xs text-black/40">الحالية</div>
            </div>
            {otherCities.map((other) => {
              const diff = other.typical - pricing.typical;
              const pctDiff = Math.round((diff / pricing.typical) * 100);
              return (
                <Link
                  key={other.slug}
                  href={`/ar/pricing/${proc.slug}/${other.slug}`}
                  className="grid grid-cols-3 gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-black/40" />
                    <span className="text-sm text-[#1c1c1c] group-hover:text-[#006828]">
                      {getArabicCityName(other.slug)}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                      {formatAed(other.typical)}
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
        </>
      )}

      {/* Insurance Cost Estimator */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          احسب تكلفتك بعد خصم التأمين
        </h2>
      </div>
      <div className="mb-10">
        <CostEstimator
          procedureName={proc.name}
          typicalCost={pricing.typical}
          insuranceCoverage={proc.insuranceCoverage}
          setting={proc.setting}
          plans={estimatorPlans}
        />
      </div>

      {/* Providers in this city */}
      {topProviders.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              مزودو الخدمة في {cityNameAr}
            </h2>
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
            {providerCount.toLocaleString("ar-AE")} مزود خدمة في {cityNameAr}. تواصل معهم مباشرةً للحصول على أسعار دقيقة.
          </p>
          <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
            {topProviders.map((provider) => (
              <Link
                key={provider.slug}
                href={`/ar/directory/${citySlug}/${proc.categorySlug}/${provider.slug}`}
                className="flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] truncate">
                    {provider.name}
                  </h3>
                  <p className="text-[11px] text-black/40 truncate">{provider.address}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 mr-4">
                  {provider.googleRating && Number(provider.googleRating) > 0 && (
                    <span className="text-xs font-bold text-[#1c1c1c] bg-green-50 px-2 py-0.5">
                      {Number(provider.googleRating).toFixed(1)} ★
                    </span>
                  )}
                  {provider.phone && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-black/40">
                      <Phone className="w-3 h-3" />
                      {provider.phone}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180" />
                </div>
              </Link>
            ))}
          </div>
          {providerCount > 10 && (
            <div className="text-center mb-10">
              <Link
                href={`/ar/directory/${citySlug}/${proc.categorySlug}`}
                className="text-sm font-bold text-[#006828] hover:underline"
              >
                عرض جميع المزودين ({providerCount.toLocaleString("ar-AE")}) في {cityNameAr} ←
              </Link>
            </div>
          )}
        </>
      )}

      {/* About the Procedure */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          عن {procedureName}
        </h2>
      </div>
      <div className="mb-10 space-y-4">
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
          {proc.description}
        </p>
        <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
            ماذا تتوقع؟
          </h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            {proc.whatToExpect}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="text-[11px] text-black/40">المدة</p>
            <p className="text-xs font-bold text-[#1c1c1c]">{proc.duration}</p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="text-[11px] text-black/40">التعافي</p>
            <p className="text-xs font-bold text-[#1c1c1c]">{proc.recoveryTime}</p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="text-[11px] text-black/40">الإعداد</p>
            <p className="text-xs font-bold text-[#1c1c1c] capitalize">{proc.setting}</p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="text-[11px] text-black/40">التخدير</p>
            <p className="text-xs font-bold text-[#1c1c1c] capitalize">{proc.anaesthesia}</p>
          </div>
        </div>
      </div>

      {/* Related Procedures */}
      {related.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              إجراءات ذات صلة في {cityNameAr}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {related.map((rel) => {
              const relPricing = rel!.cityPricing[citySlug];
              return (
                <Link
                  key={rel!.slug}
                  href={`/ar/pricing/${rel!.slug}/${citySlug}`}
                  className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
                >
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] mb-1">
                    {rel!.nameAr || rel!.name}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">
                    {relPricing
                      ? `${formatAed(relPricing.min)} – ${formatAed(relPricing.max)} في ${cityNameAr}`
                      : `${formatAed(rel!.priceRange.min)} – ${formatAed(rel!.priceRange.max)}`}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${procedureName} في ${cityNameAr} — أسئلة شائعة`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> الأسعار المعروضة لـ{cityNameAr} نطاقات استرشادية مبنية على منهجية التعرفة الإلزامية لدائرة الصحة (شفافية) وبارامترات DRG لهيئة صحة دبي وبيانات السوق الموثّقة حتى مارس 2026.
          تتوقف التكاليف الفعلية على المنشأة والطبيب ودرجة التعقيد السريري وخطة التأمين. تواصل مع المزودين مباشرةً للحصول على أسعار دقيقة.
          ينظّم الرعاية الصحية في {cityNameAr} {regulatorAr}. لا تمثل هذه الصفحة نصيحة طبية أو مالية.
        </p>
      </div>
    </div>
  );
}
