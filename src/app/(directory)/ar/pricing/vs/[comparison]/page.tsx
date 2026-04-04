import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftRight, ArrowRight, CheckCircle, MapPin, Shield } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getComparisonBySlug,
  getAllComparisonSlugs,
} from "@/lib/constants/procedure-comparisons";
import { getProcedureBySlug, formatAed } from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ comparison: string }>;
}

export async function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ comparison: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comparison } = await params;
  const base = getBaseUrl();
  const comp = getComparisonBySlug(comparison);
  if (!comp) return {};

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) return {};

  const title = `${procA.name} مقابل ${procB.name} — مقارنة التكاليف في الإمارات ${new Date().getFullYear()} | دليل الإمارات المفتوح للرعاية الصحية`;
  const description = `قارن ${procA.name} (${formatAed(procA.priceRange.min)}–${formatAed(procA.priceRange.max)}) مقابل ${procB.name} (${formatAed(procB.priceRange.min)}–${formatAed(procB.priceRange.max)}) في الإمارات. مقارنة جانبية عبر ٨ مدن مع تغطية التأمين وأوقات التعافي وإرشادات الاختيار.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/ar/pricing/vs/${comp.slug}`,
      languages: {
        "en-AE": `${base}/pricing/vs/${comp.slug}`,
        "ar-AE": `${base}/ar/pricing/vs/${comp.slug}`,
      },
    },
    openGraph: {
      title: `${procA.name} مقابل ${procB.name} — مقارنة التكاليف في الإمارات`,
      description,
      url: `${base}/ar/pricing/vs/${comp.slug}`,
      type: "article",
    },
  };
}

const insuranceLabelAr = (coverage: string) => {
  switch (coverage) {
    case "typically-covered": return "مغطى عادةً";
    case "partially-covered": return "مغطى جزئياً";
    case "rarely-covered": return "نادراً ما يُغطى";
    case "not-covered": return "غير مغطى";
    default: return coverage;
  }
};

const insuranceColor = (coverage: string) => {
  switch (coverage) {
    case "typically-covered": return "text-green-700 bg-green-50";
    case "partially-covered": return "text-yellow-700 bg-yellow-50";
    case "rarely-covered": return "text-orange-700 bg-orange-50";
    case "not-covered": return "text-red-700 bg-red-50";
    default: return "text-black/40 bg-[#f8f8f6]";
  }
};

export default async function ArComparisonPage({ params }: PageProps) {
  const { comparison } = await params;
  const base = getBaseUrl();
  const comp = getComparisonBySlug(comparison);
  if (!comp) notFound();

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) notFound();

  const avgA = Math.round(
    Object.values(procA.cityPricing).reduce((s, p) => s + p.typical, 0) /
    Object.keys(procA.cityPricing).length
  );
  const avgB = Math.round(
    Object.values(procB.cityPricing).reduce((s, p) => s + p.typical, 0) /
    Object.keys(procB.cityPricing).length
  );

  const cheaperProc = avgA < avgB ? procA : procB;
  const pricierProc = avgA < avgB ? procB : procA;
  const savingsPercent = Math.round((Math.abs(avgA - avgB) / Math.max(avgA, avgB)) * 100);

  const cityData = CITIES.map((city) => {
    const pricingA = procA.cityPricing[city.slug];
    const pricingB = procB.cityPricing[city.slug];
    if (!pricingA || !pricingB) return null;
    const gap = pricingA.typical - pricingB.typical;
    return { slug: city.slug, name: city.name, typicalA: pricingA.typical, typicalB: pricingB.typical, gap, absGap: Math.abs(gap) };
  }).filter(Boolean) as { slug: string; name: string; typicalA: number; typicalB: number; gap: number; absGap: number }[];

  const biggestGapCity = cityData.reduce((max, c) => (c.absGap > max.absGap ? c : max), cityData[0]);
  const smallestGapCity = cityData.reduce((min, c) => (c.absGap < min.absGap ? c : min), cityData[0]);

  const faqs = [
    {
      question: `أيهما أرخص في الإمارات: ${procA.name} أم ${procB.name}؟`,
      answer: `${cheaperProc.name} عادةً أرخص بمتوسط ${formatAed(cheaperProc === procA ? avgA : avgB)} إماراتياً مقارنةً بـ${formatAed(pricierProc === procA ? avgA : avgB)} لـ${pricierProc.name}. الفارق تقريباً ${formatAed(Math.abs(avgA - avgB))} (${savingsPercent.toLocaleString("ar-AE")}٪).`,
    },
    {
      question: `أيهما أفضل: ${procA.name} أم ${procB.name}؟`,
      answer: `لا يوجد خيار أفضل بالمطلق — كلاهما يخدم أغراضاً مختلفة. ${comp.description} يُحدِّد طبيبك الخيار المناسب لحالتك الطبية.`,
    },
    {
      question: `هل يُغطي التأمين الإماراتي ${procA.name} و${procB.name}؟`,
      answer: `${procA.name} ${insuranceLabelAr(procA.insuranceCoverage)} بخطط التأمين الإماراتية. ${procA.insuranceNotes || ""} ${procB.name} ${insuranceLabelAr(procB.insuranceCoverage)}. ${procB.insuranceNotes || ""}`,
    },
    {
      question: `ما وقت التعافي من ${procA.name} مقارنةً بـ${procB.name}؟`,
      answer: `وقت التعافي من ${procA.name}: ${procA.recoveryTime}، بينما ${procB.name}: ${procB.recoveryTime}. ${procA.name} تستغرق ${procA.duration}، و${procB.name} تستغرق ${procB.duration}.`,
    },
    {
      question: `أين أرخص مكان للحصول على ${procA.name} أو ${procB.name} في الإمارات؟`,
      answer: `للإجراءين، تُقدِّم الإمارات الشمالية (الشارقة وعجمان وأم القيوين) أدنى الأسعار. الأسعار في دبي الأعلى عموماً. تأكد دائماً من السعر مباشرةً مع المزود.`,
    },
  ];

  return (
    <div
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir="rtl"
      lang="ar"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "تكاليف الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: "مقارنة الإجراءات", url: `${base}/ar/pricing/vs` },
          { name: comp.title },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", ".comparison-summary"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "مقارنة", href: "/ar/pricing/vs" },
          { label: comp.title },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {procA.name} مقابل {procB.name} — مقارنة التكاليف في الإمارات
          </h1>
        </div>
      </div>

      {/* Answer Block */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          {cheaperProc.name} عادةً الخيار الأوفر في الإمارات، بمتوسط {formatAed(cheaperProc === procA ? avgA : avgB)}{" "}
          مقارنةً بـ{formatAed(pricierProc === procA ? avgA : avgB)} لـ{pricierProc.name} — فارق{" "}
          حوالي {formatAed(Math.abs(avgA - avgB))} ({savingsPercent.toLocaleString("ar-AE")}٪).{" "}
          {comp.description} تتفاوت الأسعار بين المدن، مع أكبر فجوة سعرية في{" "}
          {biggestGapCity?.name || "دبي"} وأصغرها في {smallestGapCity?.name || "عجمان"}.
          البيانات حتى مارس ٢٠٢٦.
        </p>
      </div>

      {/* Side-by-Side Comparison Card */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            المقارنة الجانبية
          </h2>
        </div>
        <div className="comparison-summary grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Procedure A */}
          <div className="border border-black/[0.06] p-5">
            <h3 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
              {procA.name}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">نطاق السعر (الإمارات)</span>
                <span className="font-bold text-[#1c1c1c]">{formatAed(procA.priceRange.min)} – {formatAed(procA.priceRange.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">السعر النموذجي</span>
                <span className="font-bold text-[#006828]">{formatAed(avgA)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">المدة</span>
                <span className="text-[#1c1c1c]">{procA.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">التعافي</span>
                <span className="text-[#1c1c1c]">{procA.recoveryTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">التخدير</span>
                <span className="text-[#1c1c1c] capitalize">{procA.anaesthesia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">البيئة</span>
                <span className="text-[#1c1c1c] capitalize">{procA.setting}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-black/40">التأمين</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 ${insuranceColor(procA.insuranceCoverage)}`}>
                  {insuranceLabelAr(procA.insuranceCoverage)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.06]">
              <Link href={`/ar/pricing/${procA.slug}`} className="text-xs text-[#006828] hover:underline flex items-center gap-1">
                عرض تسعير {procA.name} <ArrowRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
          </div>

          {/* Procedure B */}
          <div className="border border-black/[0.06] p-5">
            <h3 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
              {procB.name}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">نطاق السعر (الإمارات)</span>
                <span className="font-bold text-[#1c1c1c]">{formatAed(procB.priceRange.min)} – {formatAed(procB.priceRange.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">السعر النموذجي</span>
                <span className="font-bold text-[#006828]">{formatAed(avgB)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">المدة</span>
                <span className="text-[#1c1c1c]">{procB.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">التعافي</span>
                <span className="text-[#1c1c1c]">{procB.recoveryTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">التخدير</span>
                <span className="text-[#1c1c1c] capitalize">{procB.anaesthesia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">البيئة</span>
                <span className="text-[#1c1c1c] capitalize">{procB.setting}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-black/40">التأمين</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 ${insuranceColor(procB.insuranceCoverage)}`}>
                  {insuranceLabelAr(procB.insuranceCoverage)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.06]">
              <Link href={`/ar/pricing/${procB.slug}`} className="text-xs text-[#006828] hover:underline flex items-center gap-1">
                عرض تسعير {procB.name} <ArrowRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences Table */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            الفروقات الرئيسية
          </h2>
        </div>
        <div className="border border-black/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th scope="col" className="text-right p-3 text-black/40 font-medium w-1/4">الفئة</th>
                <th scope="col" className="text-right p-3 text-[#1c1c1c] font-bold w-[37.5%]">{procA.name}</th>
                <th scope="col" className="text-right p-3 text-[#1c1c1c] font-bold w-[37.5%]">{procB.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {comp.keyDifferences.map((diff, i) => (
                <tr key={i} className="hover:bg-[#f8f8f6]">
                  <td className="p-3 text-black/40 font-medium">{diff.category}</td>
                  <td className="p-3 text-[#1c1c1c]">{diff.procedureA}</td>
                  <td className="p-3 text-[#1c1c1c]">{diff.procedureB}</td>
                </tr>
              ))}
              <tr className="hover:bg-[#f8f8f6] bg-[#f8f8f6]">
                <td className="p-3 text-black/40 font-medium">متوسط التكلفة (الإمارات)</td>
                <td className="p-3 font-bold text-[#006828]">{formatAed(avgA)}</td>
                <td className="p-3 font-bold text-[#006828]">{formatAed(avgB)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* City-by-City Price Comparison */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            مقارنة الأسعار بين المدن
          </h2>
        </div>
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          الأسعار النموذجية لـ{procA.name} و{procB.name} عبر مدن الإمارات.
          أكبر فجوة سعرية في {biggestGapCity?.name || "دبي"} ({formatAed(biggestGapCity?.absGap || 0)}).
          أصغر فجوة في {smallestGapCity?.name || "عجمان"} ({formatAed(smallestGapCity?.absGap || 0)}).
        </p>
        <div className="border border-black/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th scope="col" className="text-right p-3 text-black/40 font-medium">المدينة</th>
                <th scope="col" className="text-left p-3 text-[#1c1c1c] font-bold">{procA.name}</th>
                <th scope="col" className="text-left p-3 text-[#1c1c1c] font-bold">{procB.name}</th>
                <th scope="col" className="text-left p-3 text-black/40 font-medium">الفارق</th>
                <th scope="col" className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {cityData.map((city) => (
                <tr key={city.slug} className="hover:bg-[#f8f8f6]">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-black/40" />
                      <span className="text-[#1c1c1c] font-medium">{getArabicCityName(city.slug)}</span>
                    </div>
                  </td>
                  <td className="p-3 text-left font-bold text-[#1c1c1c]">{formatAed(city.typicalA)}</td>
                  <td className="p-3 text-left font-bold text-[#1c1c1c]">{formatAed(city.typicalB)}</td>
                  <td className="p-3 text-left text-black/40">
                    {city.gap > 0 ? "+" : ""}{formatAed(city.gap)}
                  </td>
                  <td className="p-3 text-left">
                    <Link
                      href={`/ar/pricing/vs/${comp.slug}/${city.slug}`}
                      className="text-[11px] text-[#006828] hover:underline"
                    >
                      التفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* When to Choose Each */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight">
              متى تختار {procA.name}
            </h2>
          </div>
          <div className="space-y-2">
            {comp.whenToChooseA.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1c1c1c]">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight">
              متى تختار {procB.name}
            </h2>
          </div>
          <div className="space-y-2">
            {comp.whenToChooseB.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1c1c1c]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تغطية التأمين
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="border border-black/[0.06] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#006828]" />
            <h3 className="font-semibold text-sm text-[#1c1c1c]">{procA.name}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 ${insuranceColor(procA.insuranceCoverage)}`}>
              {insuranceLabelAr(procA.insuranceCoverage)}
            </span>
          </div>
          <p className="text-xs text-black/40">{procA.insuranceNotes}</p>
        </div>
        <div className="border border-black/[0.06] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#006828]" />
            <h3 className="font-semibold text-sm text-[#1c1c1c]">{procB.name}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 ${insuranceColor(procB.insuranceCoverage)}`}>
              {insuranceLabelAr(procB.insuranceCoverage)}
            </span>
          </div>
          <p className="text-xs text-black/40">{procB.insuranceNotes}</p>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${procA.name} مقابل ${procB.name} — الأسئلة الشائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار نطاقات استرشادية مستندة إلى منهجية التعرفة الإلزامية لوزارة الصحة وبيانات السوق حتى مارس ٢٠٢٦.
        </p>
        <Link href={`/pricing/vs/${comp.slug}`} className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
