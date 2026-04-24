import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
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
import { CITIES } from "@/lib/constants/cities";
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
  const journeys = getAllJourneySlugs();
  const citySlugs = CITIES.map((c) => c.slug);
  return journeys.flatMap((journey) =>
    citySlugs.map((city) => ({ journey, city }))
  );
}

interface Props {
  params: Promise<{ journey: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { journey: journeySlug, city: citySlug } = await params;
  const journey = getJourneyBySlug(journeySlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!journey || !city) return {};

  const base = getBaseUrl();
  const cost = calculateJourneyCost(journey, citySlug);
  const nameAr = journey.nameAr || journey.name;
  const cityNameAr = getArabicCityName(citySlug);

  return {
    title: `تكلفة ${nameAr} في ${cityNameAr} — ${formatAed(cost.requiredMin)} إلى ${formatAed(cost.requiredMax)} | دليل الإمارات المفتوح للرعاية الصحية`,
    description: `كم تكلف ${nameAr} في ${cityNameAr}؟ التكلفة الإجمالية التقديرية: ${formatAed(cost.requiredTypical)}. تفصيل بالأسعار الخاصة بـ${cityNameAr} لـ${journey.steps.length.toLocaleString("ar-AE")} إجراءً.`,
    alternates: {
      canonical: `${base}/ar/pricing/journey/${journeySlug}/${citySlug}`,
      languages: {
        "en-AE": `${base}/pricing/journey/${journeySlug}/${citySlug}`,
        "ar-AE": `${base}/ar/pricing/journey/${journeySlug}/${citySlug}`,
      },
    },
    openGraph: {
      title: `تكلفة ${nameAr} في ${cityNameAr} — ${formatAed(cost.requiredMin)} إلى ${formatAed(cost.requiredMax)}`,
      description: `إجمالي تكلفة ${nameAr} في ${cityNameAr}: ${formatAed(cost.requiredTypical)} نموذجياً.`,
      url: `${base}/ar/pricing/journey/${journeySlug}/${citySlug}`,
      type: "website",
    },
  };
}

function getRegulatorAr(citySlug: string): string {
  if (citySlug === "dubai") return "هيئة الصحة بدبي (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "دائرة الصحة - أبوظبي (DOH)";
  return "وزارة الصحة ووقاية المجتمع (MOHAP)";
}

export default async function ArJourneyCityPage({ params }: Props) {
  const { journey: journeySlug, city: citySlug } = await params;
  const journey = getJourneyBySlug(journeySlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!journey || !city) notFound();

  const base = getBaseUrl();
  const nameAr = journey.nameAr || journey.name;
  const cityNameAr = getArabicCityName(citySlug);
  const regulatorAr = getRegulatorAr(citySlug);

  const cost = calculateJourneyCost(journey, citySlug);
  const uaeCost = calculateJourneyCost(journey);
  const cityComparison = getJourneyCityComparison(journey);
  const cheapestCity = cityComparison[0];
  const mostExpensiveCity = cityComparison[cityComparison.length - 1];
  const thisRank = cityComparison.findIndex((c) => c.citySlug === citySlug) + 1;

  const vsUaeAvg =
    uaeCost.requiredTypical > 0
      ? Math.round(((cost.requiredTypical - uaeCost.requiredTypical) / uaeCost.requiredTypical) * 100)
      : 0;

  const vsCheapest =
    cheapestCity.requiredTypical > 0
      ? Math.round(((cost.requiredTypical - cheapestCity.requiredTypical) / cheapestCity.requiredTypical) * 100)
      : 0;

  const faqs = [
    {
      question: `كم تكلف ${nameAr} في ${cityNameAr}؟`,
      answer: `تتراوح تكلفة ${nameAr} في ${cityNameAr} بين ${formatAed(cost.requiredMin)} و${formatAed(cost.requiredMax)} للخطوات الإلزامية، بمجموع نموذجي ${formatAed(cost.requiredTypical)}. يشمل ذلك ${cost.steps.filter((s) => !s.isOptional).length.toLocaleString("ar-AE")} إجراءً على مدى ${journey.totalDuration}. الرعاية الصحية في ${cityNameAr} تُنظِّمها ${regulatorAr}.`,
    },
    {
      question: `هل ${cityNameAr} باهظة مقارنةً بمدن الإمارات الأخرى لـ${nameAr}؟`,
      answer: `${cityNameAr} تحتل المرتبة ${thisRank.toLocaleString("ar-AE")} من ${cityComparison.length.toLocaleString("ar-AE")} مدن. ${vsCheapest > 0 ? `أغلى بـ${vsCheapest.toLocaleString("ar-AE")}٪ من ${getArabicCityName(cheapestCity.citySlug)} (${formatAed(cheapestCity.requiredTypical)}).` : `هي الأوفر في الإمارات لهذا المسار.`} أغلى مدينة: ${getArabicCityName(mostExpensiveCity.citySlug)} بـ${formatAed(mostExpensiveCity.requiredTypical)}.`,
    },
    {
      question: `هل يغطي التأمين ${nameAr} في ${cityNameAr}؟`,
      answer: (() => {
        const coveredSteps = cost.steps.filter((s) => {
          const proc = getProcedureBySlug(s.procedureSlug);
          return proc?.insuranceCoverage === "typically-covered" || proc?.insuranceCoverage === "partially-covered";
        });
        return `${coveredSteps.length.toLocaleString("ar-AE")} من ${cost.steps.length.toLocaleString("ar-AE")} خطوات مشمولة عادةً بالتأمين الصحي الإماراتي عند الضرورة الطبية. اشتراكات 10-20٪ على الإجراءات المشمولة. التأمين الصحي إلزامي في جميع الإمارات منذ يناير ٢٠٢٥.`;
      })(),
    },
    {
      question: `أين أجد مزودي خدمة لـ${nameAr} في ${cityNameAr}؟`,
      answer: `تصفح دليل الإمارات المفتوح للرعاية الصحية لمزودي ${cityNameAr}. كل خطوة في هذا المسار تُحيلك إلى صفحة الإجراء المقابل حيث يمكنك العثور على المزودين المناسبين. قارن حسب التقييم وقبول التأمين والموقع.`,
    },
  ];

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
          { name: nameAr, url: `${base}/ar/pricing/journey/${journey.slug}` },
          { name: cityNameAr },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "مسارات الرعاية", href: "/ar/pricing/journey" },
          { label: nameAr, href: `/ar/pricing/journey/${journey.slug}` },
          { label: cityNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          تكلفة {nameAr} في {cityNameAr}
        </h1>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            تتراوح تكلفة {nameAr} في {cityNameAr} بين {formatAed(cost.requiredMin)} و{formatAed(cost.requiredMax)},
            بمجموع نموذجي {formatAed(cost.requiredTypical)}.
            {cost.optionalTypical > 0 ? ` مع الإضافات الاختيارية قد يصل الإجمالي إلى ${formatAed(cost.totalTypical)}.` : ""}
            {" "}{cityNameAr} تحتل المرتبة {thisRank.toLocaleString("ar-AE")} من {cityComparison.length.toLocaleString("ar-AE")} مدن إماراتية لهذا المسار.
            {" "}{vsUaeAvg > 0 ? `الأسعار أعلى بـ${vsUaeAvg.toLocaleString("ar-AE")}٪ من المتوسط الإماراتي.` : vsUaeAvg < 0 ? `الأسعار أدنى بـ${Math.abs(vsUaeAvg).toLocaleString("ar-AE")}٪ من المتوسط الإماراتي.` : "الأسعار في المتوسط الإماراتي."}
            {" "}الرعاية الصحية في {cityNameAr} تُنظِّمها {regulatorAr}. البيانات حتى مارس ٢٠٢٦.
          </p>
        </div>

        {/* Cost summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">الإجمالي النموذجي ({cityNameAr})</p>
            <p className="text-lg font-bold text-[#006828]">{formatAed(cost.requiredTypical)}</p>
            <p className="text-[10px] text-black/40">{formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">مقابل متوسط الإمارات</p>
            <p className={`text-lg font-bold ${vsUaeAvg > 0 ? "text-red-600" : vsUaeAvg < 0 ? "text-green-700" : "text-[#1c1c1c]"}`}>
              {vsUaeAvg > 0 ? "+" : ""}{vsUaeAvg.toLocaleString("ar-AE")}٪
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">الترتيب بين المدن</p>
            <p className="text-lg font-bold text-[#1c1c1c]">#{thisRank.toLocaleString("ar-AE")}/{cityComparison.length.toLocaleString("ar-AE")}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">المدة</p>
            <p className="text-lg font-bold text-[#1c1c1c]">{journey.totalDuration}</p>
          </div>
        </div>
      </div>

      {/* Step breakdown for this city */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التفصيل في {cityNameAr}
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
                  <Link href={`/ar/pricing/${step.procedureSlug}/${citySlug}`} className="text-[#006828] hover:underline font-medium">
                    {step.procedureName}
                  </Link>
                  {step.note && <span className="text-[11px] text-black/40 block">{step.note}</span>}
                </td>
                <td className="p-3 text-center">{step.quantity.toLocaleString("ar-AE")}</td>
                <td className="p-3 text-left text-black/40">{formatAed(step.unitMin)} – {formatAed(step.unitMax)}</td>
                <td className="p-3 text-left font-bold text-[#1c1c1c]">{formatAed(step.subtotalMin)} – {formatAed(step.subtotalMax)}</td>
                <td className="p-3 text-center">
                  {step.isOptional ? (
                    <span className="text-[10px] text-black/40 bg-[#f8f8f6] px-2 py-0.5">اختياري</span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f8f8f6] font-bold">
              <td className="p-3 text-[#1c1c1c]" colSpan={3}>الإجمالي (الخطوات الإلزامية)</td>
              <td className="p-3 text-left text-[#006828]">{formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* City Comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنة مع مدن أخرى
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {cityComparison.map((cc, idx) => (
          <Link
            key={cc.citySlug}
            href={`/ar/pricing/journey/${journey.slug}/${cc.citySlug}`}
            className={`border p-3 hover:border-[#006828]/15 transition-colors group ${cc.citySlug === citySlug ? "border-[#006828]/30 bg-[#006828]/[0.04]" : "border-black/[0.06]"}`}
          >
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[#006828]" />
              <span className="font-semibold text-sm text-[#1c1c1c] group-hover:text-[#006828]">
                {getArabicCityName(cc.citySlug)}
                {cc.citySlug === citySlug && " ✓"}
              </span>
              {idx === 0 && <TrendingDown className="w-3 h-3 text-green-600" />}
              {idx === cityComparison.length - 1 && <TrendingUp className="w-3 h-3 text-red-400" />}
            </div>
            <p className="text-sm font-bold text-[#006828]">{formatAed(cc.requiredTypical)}</p>
          </Link>
        ))}
      </div>

      {/* Other journeys */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مسارات رعاية أخرى في {cityNameAr}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {CARE_JOURNEYS.filter((j) => j.slug !== journey.slug).slice(0, 6).map((j) => (
          <Link
            key={j.slug}
            href={`/ar/pricing/journey/${j.slug}/${citySlug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
          >
            <span className="text-sm font-medium text-[#1c1c1c] group-hover:text-[#006828]">
              {j.nameAr || j.name}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${nameAr} في ${cityNameAr} — الأسئلة الشائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> تقديرات استرشادية حتى مارس ٢٠٢٦. الرعاية الصحية في {cityNameAr} تُنظِّمها {regulatorAr}.
        </p>
        <Link href={`/pricing/journey/${journey.slug}/${city.slug}`} className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
