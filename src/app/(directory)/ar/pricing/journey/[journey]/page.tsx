import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  CARE_JOURNEYS,
  getJourneyBySlug,
  getAllJourneySlugs,
  calculateJourneyCost,
  getJourneyCityComparison,
} from "@/lib/constants/care-journeys";
import {
  getProcedureBySlug,
  formatAed,
} from "@/lib/constants/procedures";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getAllJourneySlugs().map((slug) => ({ journey: slug }));
}

interface Props {
  params: Promise<{ journey: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { journey: slug } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) return {};

  const base = getBaseUrl();
  const cost = calculateJourneyCost(journey);
  const nameAr = journey.nameAr || journey.name;

  return {
    title: `تكلفة ${nameAr} في الإمارات — ${formatAed(cost.requiredMin)} إلى ${formatAed(cost.requiredMax)} | دليل الإمارات المفتوح للرعاية الصحية`,
    description: `كم تكلف ${nameAr} في الإمارات؟ التكلفة الإجمالية التقديرية: ${formatAed(cost.requiredTypical)}. تفصيل خطوة بخطوة لـ${journey.steps.length.toLocaleString("ar-AE")} إجراءً عبر دبي وأبوظبي والشارقة وجميع الإمارات.`,
    alternates: {
      canonical: `${base}/ar/pricing/journey/${slug}`,
      languages: {
        "en-AE": `${base}/pricing/journey/${slug}`,
        "ar-AE": `${base}/ar/pricing/journey/${slug}`,
      },
    },
    openGraph: {
      title: `تكلفة ${nameAr} في الإمارات — ${formatAed(cost.requiredMin)} إلى ${formatAed(cost.requiredMax)}`,
      description: `إجمالي تكلفة ${nameAr} في الإمارات: ${formatAed(cost.requiredTypical)} نموذجياً. مقارنة عبر ٨ مدن مع تفصيل تفصيلي.`,
      url: `${base}/ar/pricing/journey/${slug}`,
      type: "website",
    },
  };
}

export default async function ArJourneyDetailPage({ params }: Props) {
  const { journey: slug } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) notFound();

  const base = getBaseUrl();
  const nameAr = journey.nameAr || journey.name;
  const cost = calculateJourneyCost(journey);
  const cityComparison = getJourneyCityComparison(journey);
  const cheapestCity = cityComparison[0];
  const mostExpensiveCity = cityComparison[cityComparison.length - 1];

  const insuranceSummary = cost.steps.map((step) => {
    const proc = getProcedureBySlug(step.procedureSlug);
    return {
      name: step.procedureName,
      coverage: proc?.insuranceCoverage ?? "not-covered",
    };
  });

  const faqs = [
    {
      question: `كم تكلف ${nameAr} في الإمارات؟`,
      answer: `تتراوح تكلفة ${nameAr} في الإمارات بين ${formatAed(cost.requiredMin)} و${formatAed(cost.requiredMax)} للخطوات الإلزامية، بمجموع نموذجي ${formatAed(cost.requiredTypical)}. يشمل ذلك ${cost.steps.filter((s) => !s.isOptional).length.toLocaleString("ar-AE")} إجراءً على مدى ${journey.totalDuration}. أرخص مدينة: ${getArabicCityName(cheapestCity.citySlug)}، وأغلاها: ${getArabicCityName(mostExpensiveCity.citySlug)}.`,
    },
    {
      question: `ما الذي يشمله إجمالي تكلفة ${nameAr}؟`,
      answer: `الإجمالي يشمل: ${cost.steps.filter((s) => !s.isOptional).map((s) => `${s.procedureName} (×${s.quantity.toLocaleString("ar-AE")})`).join("، ")}.${cost.steps.some((s) => s.isOptional) ? ` الإضافات الاختيارية: ${cost.steps.filter((s) => s.isOptional).map((s) => `${s.procedureName} (×${s.quantity.toLocaleString("ar-AE")})`).join("، ")}.` : ""}`,
    },
    {
      question: `هل يُغطي التأمين في الإمارات ${nameAr}؟`,
      answer: (() => {
        const covered = insuranceSummary.filter(
          (s) => s.coverage === "typically-covered" || s.coverage === "partially-covered"
        ).length;
        return `${covered.toLocaleString("ar-AE")} من أصل ${insuranceSummary.length.toLocaleString("ar-AE")} خطوة في هذا المسار مشمولة عادةً بالتأمين الصحي الإماراتي. تغطية أفضل مع الخطط المحسّنة والمتميزة. اشتراكات 10-20٪ على الإجراءات المشمولة.`;
      })(),
    },
    {
      question: `أين أرخص مكان لـ${nameAr} في الإمارات؟`,
      answer: `${getArabicCityName(cheapestCity.citySlug)} تُقدِّم أدنى تكلفة نموذجية: ${formatAed(cheapestCity.requiredTypical)} للخطوات الإلزامية. ${getArabicCityName(mostExpensiveCity.citySlug)} الأغلى بـ${formatAed(mostExpensiveCity.requiredTypical)} — أعلى بـ${Math.round(((mostExpensiveCity.requiredTypical - cheapestCity.requiredTypical) / cheapestCity.requiredTypical) * 100).toLocaleString("ar-AE")}٪. الإمارات الشمالية تُقدِّم أفضل قيمة عموماً.`,
    },
    {
      question: `كم تستغرق ${nameAr}؟`,
      answer: `تستغرق رحلة ${nameAr} الكاملة تقريباً ${journey.totalDuration}. ${journey.whatToExpect}`,
    },
  ];

  const medicalProcedureSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: journey.name,
    alternateName: journey.nameAr,
    description: journey.description,
    url: `${base}/ar/pricing/journey/${journey.slug}`,
    howPerformed: journey.whatToExpect,
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "AED",
      minValue: cost.requiredMin,
      maxValue: cost.requiredMax,
    },
    inLanguage: "ar",
  };

  return (
    <div
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir="rtl"
      lang="ar"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "تكاليف الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: "مسارات الرعاية", url: `${base}/ar/pricing/journey` },
          { name: nameAr },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={medicalProcedureSchema} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "مسارات الرعاية", href: "/ar/pricing/journey" },
          { label: nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          {nameAr} — التكلفة الإجمالية التقديرية في الإمارات
        </h1>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            تتراوح تكلفة {nameAr} في الإمارات بين {formatAed(cost.requiredMin)} و{formatAed(cost.requiredMax)},
            بمجموع نموذجي {formatAed(cost.requiredTypical)}.
            يشمل ذلك {cost.steps.filter((s) => !s.isOptional).length.toLocaleString("ar-AE")} خطوات إلزامية على مدى {journey.totalDuration}.
            {cost.optionalTypical > 0 ? ` الإضافات الاختيارية قد ترفع الإجمالي إلى ${formatAed(cost.totalTypical)}.` : ""}
            {" "}{getArabicCityName(cheapestCity.citySlug)} هي الأوفر بـ{formatAed(cheapestCity.requiredTypical)}،
            بينما {getArabicCityName(mostExpensiveCity.citySlug)} الأغلى بـ{formatAed(mostExpensiveCity.requiredTypical)}.
          </p>
        </div>

        {/* Cost summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">الخطوات الإلزامية</p>
            <p className="text-lg font-bold text-[#006828]">{formatAed(cost.requiredTypical)}</p>
            <p className="text-[10px] text-black/40">{formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}</p>
          </div>
          {cost.optionalTypical > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-[11px] text-black/40 mb-1">+ الإضافات الاختيارية</p>
              <p className="text-lg font-bold text-[#1c1c1c]">{formatAed(cost.optionalTypical)}</p>
              <p className="text-[10px] text-black/40">{formatAed(cost.optionalMin)} – {formatAed(cost.optionalMax)}</p>
            </div>
          )}
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">المدة</p>
            <p className="text-lg font-bold text-[#1c1c1c]">{journey.totalDuration}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">أرخص مدينة</p>
            <p className="text-lg font-bold text-[#1c1c1c]">{getArabicCityName(cheapestCity.citySlug)}</p>
            <p className="text-[10px] text-black/40">{formatAed(cheapestCity.requiredTypical)}</p>
          </div>
        </div>
      </div>

      {/* Step-by-step Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التفصيل خطوة بخطوة
        </h2>
      </div>
      <div className="border border-black/[0.06] mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f8f6] text-right">
              <th scope="col" className="p-3 font-bold text-[#1c1c1c]">الخطوة</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-center">الكمية</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-left">تكلفة الوحدة</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-left">الإجمالي الفرعي</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-center">إلزامي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {cost.steps.map((step, i) => (
              <tr
                key={`${step.procedureSlug}-${i}`}
                className={step.isOptional ? "bg-[#f8f8f6]/50" : ""}
              >
                <td className="p-3">
                  <Link
                    href={`/ar/pricing/${step.procedureSlug}`}
                    className="text-[#006828] hover:underline font-medium"
                  >
                    {step.procedureName}
                  </Link>
                  {step.note && (
                    <span className="text-[11px] text-black/40 block">{step.note}</span>
                  )}
                </td>
                <td className="p-3 text-center">{step.quantity.toLocaleString("ar-AE")}</td>
                <td className="p-3 text-left text-black/40">
                  {formatAed(step.unitMin)} – {formatAed(step.unitMax)}
                </td>
                <td className="p-3 text-left font-bold text-[#1c1c1c]">
                  {formatAed(step.subtotalMin)} – {formatAed(step.subtotalMax)}
                </td>
                <td className="p-3 text-center">
                  {step.isOptional ? (
                    <span className="text-[10px] text-black/40 bg-[#f8f8f6] px-2 py-0.5">
                      اختياري
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f8f8f6] font-bold">
              <td className="p-3 text-[#1c1c1c]" colSpan={3}>
                الإجمالي (الخطوات الإلزامية)
              </td>
              <td className="p-3 text-left text-[#006828]">
                {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
              </td>
              <td />
            </tr>
            {cost.optionalTypical > 0 && (
              <tr className="bg-[#f8f8f6]/50">
                <td className="p-3 text-black/40" colSpan={3}>
                  + الإضافات الاختيارية
                </td>
                <td className="p-3 text-left text-black/40">
                  {formatAed(cost.optionalMin)} – {formatAed(cost.optionalMax)}
                </td>
                <td />
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* City Comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنة التكاليف بين المدن
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {cityComparison.map((cc, idx) => (
          <Link
            key={cc.citySlug}
            href={`/ar/pricing/journey/${journey.slug}/${cc.citySlug}`}
            className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828]">
                {getArabicCityName(cc.citySlug)}
              </h3>
              {idx === 0 && <span className="text-[9px] text-green-700 bg-green-50 px-1">الأرخص</span>}
              {idx === cityComparison.length - 1 && cityComparison.length > 1 && (
                <span className="text-[9px] text-red-700 bg-red-50 px-1">الأغلى</span>
              )}
            </div>
            <p className="text-lg font-bold text-[#1c1c1c]">{formatAed(cc.requiredTypical)}</p>
            <p className="text-[10px] text-black/40">الخطوات الإلزامية</p>
          </Link>
        ))}
      </div>

      {/* What to expect */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          ماذا تتوقع
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-10" data-answer-block="true">
        <div className="flex items-start gap-2 mb-2">
          <Clock className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-black/40 font-medium">المدة الإجمالية: {journey.totalDuration}</p>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">{journey.whatToExpect}</p>
      </div>

      {/* Other journeys */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مسارات رعاية أخرى
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {CARE_JOURNEYS.filter((j) => j.slug !== journey.slug).slice(0, 6).map((j) => {
          const jCost = calculateJourneyCost(j);
          return (
            <Link
              key={j.slug}
              href={`/ar/pricing/journey/${j.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
            >
              <div>
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828]">
                  {j.nameAr || j.name}
                </p>
                <p className="text-[10px] text-black/40">{formatAed(jCost.requiredMin)} – {formatAed(jCost.requiredMax)}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180 flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${nameAr} — الأسئلة الشائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الحزم تقديرات استرشادية مستندة إلى منهجية تعرفة وزارة الصحة وبيانات السوق حتى مارس ٢٠٢٦.
        </p>
        <Link href={`/pricing/journey/${journey.slug}`} className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
