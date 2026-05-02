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
  params: Promise<{ comparison: string; city: string }>;
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const slugs = getAllComparisonSlugs();
  const cityParams: { comparison: string; city: string }[] = [];

  for (const slug of slugs) {
    const comp = getComparisonBySlug(slug);
    if (!comp) continue;
    const procA = getProcedureBySlug(comp.procedureASlug);
    const procB = getProcedureBySlug(comp.procedureBSlug);
    if (!procA || !procB) continue;

    for (const city of CITIES) {
      if (procA.cityPricing[city.slug] && procB.cityPricing[city.slug]) {
        cityParams.push({ comparison: slug, city: city.slug });
      }
    }
  }

  return cityParams;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comparison, city: citySlug } = await params;
  const base = getBaseUrl();
  const comp = getComparisonBySlug(comparison);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!comp || !city) return {};

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) return {};

  const pricingA = procA.cityPricing[citySlug];
  const pricingB = procB.cityPricing[citySlug];
  if (!pricingA || !pricingB) return {};

  const cityNameAr = getArabicCityName(citySlug);
  const title = `${procA.name} مقابل ${procB.name} في ${cityNameAr} — مقارنة التكاليف ${new Date().getFullYear()} | دليل الإمارات المفتوح للرعاية الصحية`;
  const description = `قارن ${procA.name} (${formatAed(pricingA.typical)} نموذجي) مقابل ${procB.name} (${formatAed(pricingB.typical)} نموذجي) في ${cityNameAr}. أسعار المدينة وتغطية التأمين وإرشادات الاختيار.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/ar/pricing/vs/${comp.slug}/${citySlug}`,
      languages: {
        "en-AE": `${base}/pricing/vs/${comp.slug}/${citySlug}`,
        "ar-AE": `${base}/ar/pricing/vs/${comp.slug}/${citySlug}`,
      },
    },
    openGraph: {
      title: `${procA.name} مقابل ${procB.name} في ${cityNameAr} — مقارنة التكاليف`,
      description,
      url: `${base}/ar/pricing/vs/${comp.slug}/${citySlug}`,
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

const regulatorAr = (citySlug: string) => {
  if (citySlug === "dubai") return "هيئة الصحة بدبي (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "دائرة الصحة - أبوظبي (DOH)";
  return "وزارة الصحة ووقاية المجتمع (MOHAP)";
};

export default async function ArCityComparisonPage({ params }: PageProps) {
  const { comparison, city: citySlug } = await params;
  const base = getBaseUrl();

  const comp = getComparisonBySlug(comparison);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!comp || !city) notFound();

  const procA = getProcedureBySlug(comp.procedureASlug);
  const procB = getProcedureBySlug(comp.procedureBSlug);
  if (!procA || !procB) notFound();

  const pricingA = procA.cityPricing[citySlug];
  const pricingB = procB.cityPricing[citySlug];
  if (!pricingA || !pricingB) notFound();

  const cityNameAr = getArabicCityName(citySlug);

  const cheaperProc = pricingA.typical < pricingB.typical ? procA : procB;
  const pricierPricing = pricingA.typical < pricingB.typical ? pricingB : pricingA;
  const priceDiff = Math.abs(pricingA.typical - pricingB.typical);
  const savingsPercent = Math.round((priceDiff / pricierPricing.typical) * 100);

  // Compare this city vs others
  const otherCities = CITIES.filter((c) => c.slug !== citySlug).map((c) => {
    const prA = procA.cityPricing[c.slug];
    const prB = procB.cityPricing[c.slug];
    if (!prA || !prB) return null;
    return {
      slug: c.slug,
      name: c.name,
      typicalA: prA.typical,
      typicalB: prB.typical,
    };
  }).filter(Boolean) as { slug: string; name: string; typicalA: number; typicalB: number }[];

  const faqs = [
    {
      question: `كم تكلفة ${procA.name} مقارنةً بـ${procB.name} في ${cityNameAr}؟`,
      answer: `في ${cityNameAr}، يبلغ السعر النموذجي لـ${procA.name} ${formatAed(pricingA.typical)} (نطاق: ${formatAed(pricingA.min)}–${formatAed(pricingA.max)})، فيما يبلغ ${formatAed(pricingB.typical)} لـ${procB.name} (نطاق: ${formatAed(pricingB.min)}–${formatAed(pricingB.max)}). ${cheaperProc.name} أرخص بمقدار ${formatAed(priceDiff)} (${savingsPercent.toLocaleString("ar-AE")}٪). الرعاية الصحية في ${cityNameAr} خاضعة لإشراف ${regulatorAr(citySlug)}.`,
    },
    {
      question: `هل أختار ${procA.name} أم ${procB.name} في ${cityNameAr}؟`,
      answer: `يعتمد الاختيار على حالتك الطبية لا على السعر وحده. ${comp.description} استشر طبيبك في ${cityNameAr} لتحديد الخيار الأنسب.`,
    },
    {
      question: `هل يُغطي التأمين ${procA.name} و${procB.name} في ${cityNameAr}؟`,
      answer: `${procA.name} ${insuranceLabelAr(procA.insuranceCoverage)} بخطط التأمين الإماراتية. ${procB.name} ${insuranceLabelAr(procB.insuranceCoverage)}. تتوقف التفاصيل على مستوى خطتك ومزودك. قد يُشترط الحصول على موافقة مسبقة.`,
    },
    {
      question: `هل ${cityNameAr} أرخص من مدن الإمارات الأخرى لـ${procA.name} و${procB.name}؟`,
      answer: `في ${cityNameAr}، تبلغ تكلفة ${procA.name} ${formatAed(pricingA.typical)} و${procB.name} ${formatAed(pricingB.typical)}. ${citySlug === "dubai" ? "تُعدّ دبي عادةً الأغلى في الإمارات للإجراءات الطبية." : citySlug === "abu-dhabi" ? "تخضع أسعار أبوظبي للتعرفة الإلزامية لدائرة الصحة." : "تقدم الإمارات الشمالية عموماً أسعاراً أقل من دبي وأبوظبي."} قارن بين جميع المدن في صفحة المقارنة الشاملة.`,
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
          { name: "مقارنة الإجراءات", url: `${base}/ar/pricing/vs` },
          { name: comp.title, url: `${base}/ar/pricing/vs/${comp.slug}` },
          { name: cityNameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", ".comparison-summary"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "مقارنة", href: "/ar/pricing/vs" },
          { label: comp.title, href: `/ar/pricing/vs/${comp.slug}` },
          { label: cityNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {procA.name} مقابل {procB.name} في {cityNameAr}
          </h1>
        </div>
      </div>

      {/* Answer Block */}
      <div
        className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
        data-answer-block="true"
      >
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          في {cityNameAr}، يبلغ السعر النموذجي لـ{procA.name}{" "}
          {formatAed(pricingA.typical)}، بينما يبلغ لـ{procB.name}{" "}
          {formatAed(pricingB.typical)} — مما يجعل {cheaperProc.name}{" "}
          أرخص بمقدار {formatAed(priceDiff)} ({savingsPercent.toLocaleString("ar-AE")}٪).{" "}
          نطاق أسعار {procA.name}: {formatAed(pricingA.min)} – {formatAed(pricingA.max)}،{" "}
          و{procB.name}: {formatAed(pricingB.min)} – {formatAed(pricingB.max)}.{" "}
          {comp.description.split(". ").slice(0, 1).join(". ")}.{" "}
          تخضع الرعاية الصحية في {cityNameAr} لإشراف {regulatorAr(citySlug)}.
          البيانات حتى مارس ٢٠٢٦.
        </p>
      </div>

      {/* Side-by-Side City-Specific Comparison */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            المقارنة الجانبية في {cityNameAr}
          </h2>
        </div>
        <div className="comparison-summary grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Procedure A Card */}
          <div className="border border-black/[0.06] p-5">
            <h3 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
              {procA.name}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">نطاق السعر ({cityNameAr})</span>
                <span className="font-bold text-[#1c1c1c]">
                  {formatAed(pricingA.min)} – {formatAed(pricingA.max)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">السعر النموذجي</span>
                <span className="font-bold text-[#006828]">{formatAed(pricingA.typical)}</span>
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
              <Link
                href={`/ar/pricing/${procA.slug}/${citySlug}`}
                className="text-xs text-[#006828] hover:underline flex items-center gap-1"
              >
                تسعير {procA.name} في {cityNameAr}
                <ArrowRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
          </div>

          {/* Procedure B Card */}
          <div className="border border-black/[0.06] p-5">
            <h3 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
              {procB.name}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">نطاق السعر ({cityNameAr})</span>
                <span className="font-bold text-[#1c1c1c]">
                  {formatAed(pricingB.min)} – {formatAed(pricingB.max)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">السعر النموذجي</span>
                <span className="font-bold text-[#006828]">{formatAed(pricingB.typical)}</span>
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
              <Link
                href={`/ar/pricing/${procB.slug}/${citySlug}`}
                className="text-xs text-[#006828] hover:underline flex items-center gap-1"
              >
                تسعير {procB.name} في {cityNameAr}
                <ArrowRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences */}
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
              <tr className="bg-[#f8f8f6]">
                <td className="p-3 text-black/40 font-medium">التكلفة في {cityNameAr}</td>
                <td className="p-3 font-bold text-[#006828]">{formatAed(pricingA.typical)}</td>
                <td className="p-3 font-bold text-[#006828]">{formatAed(pricingB.typical)}</td>
              </tr>
              {comp.keyDifferences.slice(0, 5).map((diff, i) => (
                <tr key={i} className="hover:bg-[#f8f8f6]">
                  <td className="p-3 text-black/40 font-medium">{diff.category}</td>
                  <td className="p-3 text-[#1c1c1c]">{diff.procedureA}</td>
                  <td className="p-3 text-[#1c1c1c]">{diff.procedureB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare This City vs Others */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            مقارنة {cityNameAr} بالمدن الأخرى
          </h2>
        </div>
        <div className="border border-black/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th scope="col" className="text-right p-3 text-black/40 font-medium">المدينة</th>
                <th scope="col" className="text-left p-3 text-[#1c1c1c] font-bold">{procA.name}</th>
                <th scope="col" className="text-left p-3 text-[#1c1c1c] font-bold">{procB.name}</th>
                <th scope="col" className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {/* Current city highlighted */}
              <tr className="bg-[#f8f8f6]">
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#006828]" />
                    <span className="text-[#1c1c1c] font-bold">{cityNameAr} (هذه المدينة)</span>
                  </div>
                </td>
                <td className="p-3 text-left font-bold text-[#006828]">{formatAed(pricingA.typical)}</td>
                <td className="p-3 text-left font-bold text-[#006828]">{formatAed(pricingB.typical)}</td>
                <td className="p-3"></td>
              </tr>
              {otherCities.map((other) => (
                <tr key={other.slug} className="hover:bg-[#f8f8f6]">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-black/40" />
                      <span className="text-[#1c1c1c]">{getArabicCityName(other.slug)}</span>
                    </div>
                  </td>
                  <td className="p-3 text-left text-[#1c1c1c]">{formatAed(other.typicalA)}</td>
                  <td className="p-3 text-left text-[#1c1c1c]">{formatAed(other.typicalB)}</td>
                  <td className="p-3 text-left">
                    <Link
                      href={`/ar/pricing/vs/${comp.slug}/${other.slug}`}
                      className="text-[11px] text-[#006828] hover:underline"
                    >
                      مقارنة
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
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              متى تختار {procA.name}
            </h2>
          </div>
          <div className="border border-black/[0.06] p-5">
            <ul className="space-y-2">
              {comp.whenToChooseA.slice(0, 4).map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                  <span className="font-['Geist',sans-serif] text-sm text-black/40">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              متى تختار {procB.name}
            </h2>
          </div>
          <div className="border border-black/[0.06] p-5">
            <ul className="space-y-2">
              {comp.whenToChooseB.slice(0, 4).map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                  <span className="font-['Geist',sans-serif] text-sm text-black/40">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Insurance Coverage */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            تغطية التأمين في {cityNameAr}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {procA.name}
              </h3>
            </div>
            <span className={`inline-block text-[11px] font-medium px-2 py-1 mb-3 ${insuranceColor(procA.insuranceCoverage)}`}>
              {insuranceLabelAr(procA.insuranceCoverage)}
            </span>
            <p className="text-xs text-black/40">{procA.insuranceNotes}</p>
          </div>
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {procB.name}
              </h3>
            </div>
            <span className={`inline-block text-[11px] font-medium px-2 py-1 mb-3 ${insuranceColor(procB.insuranceCoverage)}`}>
              {insuranceLabelAr(procB.insuranceCoverage)}
            </span>
            <p className="text-xs text-black/40">{procB.insuranceNotes}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${procA.name} مقابل ${procB.name} في ${cityNameAr} — الأسئلة الشائعة`}
      />

      {/* Disclaimer + English link */}
      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار نطاقات استرشادية مستندة إلى
          منهجية التعرفة الإلزامية لوزارة الصحة وبيانات السوق حتى مارس ٢٠٢٦.
          هذه المعلومات لأغراض توعوية فقط وليست استشارة طبية أو مالية.
        </p>
        <Link
          href={`/pricing/vs/${comp.slug}/${citySlug}`}
          className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4"
        >
          English version
        </Link>
      </div>
    </div>
  );
}
