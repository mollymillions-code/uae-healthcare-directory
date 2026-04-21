import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/pricing";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

// ─── City Pair Utilities ──────────────────────────────────────────────────────

const CITY_SLUGS = CITIES.map((c) => c.slug);

function getAllCityPairs(): { cityA: string; cityB: string }[] {
  const pairs: { cityA: string; cityB: string }[] = [];
  for (let i = 0; i < CITY_SLUGS.length; i++) {
    for (let j = i + 1; j < CITY_SLUGS.length; j++) {
      pairs.push({ cityA: CITY_SLUGS[i], cityB: CITY_SLUGS[j] });
    }
  }
  return pairs;
}

function getCityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

function parseCitiesSlug(slug: string): { cityASlug: string; cityBSlug: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  const cityASlug = parts[0];
  const cityBSlug = parts[1];
  if (!getCityBySlug(cityASlug) || !getCityBySlug(cityBSlug)) return null;
  return { cityASlug, cityBSlug };
}

// ─── Pricing Analysis ─────────────────────────────────────────────────────────

interface ProcedureComparison {
  slug: string;
  name: string;
  categorySlug: string;
  cityATypical: number;
  cityBTypical: number;
  diffPercent: number;
  cheaperCity: "A" | "B" | "tie";
  cityAMin: number;
  cityAMax: number;
  cityBMin: number;
  cityBMax: number;
}

interface CategoryWinner {
  categorySlug: string;
  categoryName: string;
  cityAWins: number;
  cityBWins: number;
  ties: number;
  winner: "A" | "B" | "tie";
}

function analysePricing(cityASlug: string, cityBSlug: string) {
  const comparisons: ProcedureComparison[] = [];
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

  for (const proc of PROCEDURES) {
    const pricingA = proc.cityPricing[cityASlug];
    const pricingB = proc.cityPricing[cityBSlug];
    if (!pricingA || !pricingB) continue;

    const diff = pricingB.typical - pricingA.typical;
    const avg = (pricingA.typical + pricingB.typical) / 2;
    const diffPercent = avg === 0 ? 0 : Math.round((diff / avg) * 100);
    const cheaper: "A" | "B" | "tie" =
      pricingA.typical < pricingB.typical ? "A" :
      pricingB.typical < pricingA.typical ? "B" : "tie";

    comparisons.push({
      slug: proc.slug,
      name: proc.name,
      categorySlug: proc.categorySlug,
      cityATypical: pricingA.typical,
      cityBTypical: pricingB.typical,
      diffPercent,
      cheaperCity: cheaper,
      cityAMin: pricingA.min,
      cityAMax: pricingA.max,
      cityBMin: pricingB.min,
      cityBMax: pricingB.max,
    });
  }

  const categoryWinners: CategoryWinner[] = PROCEDURE_CATEGORIES
    .map((cat) => {
      const catSlugs = categoryMap[cat.slug] || [];
      const catComps = comparisons.filter((c) => catSlugs.includes(c.categorySlug));
      if (catComps.length === 0) return null;
      const cityAWins = catComps.filter((c) => c.cheaperCity === "A").length;
      const cityBWins = catComps.filter((c) => c.cheaperCity === "B").length;
      const ties = catComps.filter((c) => c.cheaperCity === "tie").length;
      const winner: "A" | "B" | "tie" =
        cityAWins > cityBWins ? "A" : cityBWins > cityAWins ? "B" : "tie";
      return { categorySlug: cat.slug, categoryName: cat.name, cityAWins, cityBWins, ties, winner };
    })
    .filter(Boolean) as CategoryWinner[];

  const totalA = comparisons.filter((c) => c.cheaperCity === "A").length;
  const totalB = comparisons.filter((c) => c.cheaperCity === "B").length;
  const totalTie = comparisons.filter((c) => c.cheaperCity === "tie").length;
  const overallWinner: "A" | "B" | "tie" =
    totalA > totalB ? "A" : totalB > totalA ? "B" : "tie";

  const avgDiffPercent = comparisons.length > 0
    ? Math.round(comparisons.reduce((sum, c) => sum + Math.abs(c.diffPercent), 0) / comparisons.length)
    : 0;

  return { comparisons, categoryWinners, totalA, totalB, totalTie, overallWinner, avgDiffPercent, totalProcedures: comparisons.length };
}

// ─── Generate Static Params ───────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllCityPairs().map(({ cityA, cityB }) => ({
    cities: `${cityA}-vs-${cityB}`,
  }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cities: string }>;
}): Promise<Metadata> {
  const { cities } = await params;
  const base = getBaseUrl();
  const parsed = parseCitiesSlug(cities);
  if (!parsed) return { title: "مقارنة غير موجودة" };

  const cityA = getCityBySlug(parsed.cityASlug)!;
  const cityB = getCityBySlug(parsed.cityBSlug)!;
  const analysis = analysePricing(parsed.cityASlug, parsed.cityBSlug);
  const winnerName =
    analysis.overallWinner === "A" ? getArabicCityName(cityA.slug)
    : analysis.overallWinner === "B" ? getArabicCityName(cityB.slug)
    : null;

  return {
    title: `مقارنة التكاليف الطبية: ${getArabicCityName(cityA.slug)} مقابل ${getArabicCityName(cityB.slug)} — دليل الإمارات المفتوح للرعاية الصحية`,
    description: `قارن تكاليف الإجراءات الطبية بين ${getArabicCityName(cityA.slug)} و${getArabicCityName(cityB.slug)}. ${winnerName ? `${winnerName} أرخص بشكل عام` : "المدينتان متقاربتا في التكلفة"} عبر ${analysis.totalProcedures} إجراءً طبياً.`,
    alternates: {
      canonical: `${base}/ar/pricing/compare/${cities}`,
      languages: {
        "en-AE": `${base}/pricing/compare/${cities}`,
        "ar-AE": `${base}/ar/pricing/compare/${cities}`,
      },
    },
    openGraph: {
      title: `${getArabicCityName(cityA.slug)} مقابل ${getArabicCityName(cityB.slug)} — مقارنة التكاليف الطبية`,
      description: `مقارنة جانبية لـ ${analysis.totalProcedures} إجراءً طبياً بين ${getArabicCityName(cityA.slug)} و${getArabicCityName(cityB.slug)}.`,
      url: `${base}/ar/pricing/compare/${cities}`,
      type: "website",
    },
  };
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function ArCityComparisonPage({
  params,
}: {
  params: Promise<{ cities: string }>;
}) {
  const { cities } = await params;
  const base = getBaseUrl();
  const parsed = parseCitiesSlug(cities);
  if (!parsed) notFound();

  const cityA = getCityBySlug(parsed.cityASlug);
  const cityB = getCityBySlug(parsed.cityBSlug);
  if (!cityA || !cityB) notFound();

  const cityANameAr = getArabicCityName(cityA.slug);
  const cityBNameAr = getArabicCityName(cityB.slug);

  const analysis = analysePricing(parsed.cityASlug, parsed.cityBSlug);
  const { comparisons, categoryWinners, totalA, totalB, totalTie, overallWinner, avgDiffPercent, totalProcedures } = analysis;

  const winnerCity = overallWinner === "A" ? cityA : overallWinner === "B" ? cityB : null;
  const loserCity = overallWinner === "A" ? cityB : overallWinner === "B" ? cityA : null;
  const winnerNameAr = winnerCity ? getArabicCityName(winnerCity.slug) : null;
  const loserNameAr = loserCity ? getArabicCityName(loserCity.slug) : null;

  const sortedComparisons = [...comparisons].sort(
    (a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent)
  );

  const faqs = [
    {
      question: `هل ${cityANameAr} أم ${cityBNameAr} أرخص للرعاية الطبية؟`,
      answer: winnerCity
        ? `${winnerNameAr} أرخص بشكل عام للرعاية الطبية. من بين ${totalProcedures} إجراءً تمت مقارنته، ${cityANameAr} أرخص في ${totalA} إجراءً و${cityBNameAr} أرخص في ${totalB}${totalTie > 0 ? ` (${totalTie} متساوية)` : ""}. في المتوسط، تبلغ التكاليف في ${winnerNameAr} أقل بنسبة ${avgDiffPercent}٪ من ${loserNameAr}.`
        : `${cityANameAr} و${cityBNameAr} متقاربتان في التكلفة. من بين ${totalProcedures} إجراءً، ${cityANameAr} أرخص في ${totalA} و${cityBNameAr} في ${totalB}.`,
    },
    {
      question: `ما مدى الفرق في تكاليف الجراحة بين ${cityANameAr} و${cityBNameAr}؟`,
      answer: (() => {
        const surgicalComps = comparisons.filter((c) =>
          ["hospitals", "gastroenterology", "orthopedics"].includes(c.categorySlug)
        );
        if (surgicalComps.length === 0) return "بيانات التسعير الجراحي غير متاحة لهذه المقارنة.";
        const avgSurgDiff = Math.round(
          surgicalComps.reduce((sum, c) => sum + Math.abs(c.cityATypical - c.cityBTypical), 0) /
          surgicalComps.length
        );
        return `للإجراءات الجراحية، يبلغ متوسط الفارق السعري بين ${cityANameAr} و${cityBNameAr} حوالي ${formatAed(avgSurgDiff)}. العمليات الكبرى مثل استبدال الركبة والولادة القيصرية تُظهر أكبر الفوارق.`;
      })(),
    },
    {
      question: `كيف تختلف أسعار الأسنان بين ${cityANameAr} و${cityBNameAr}؟`,
      answer: (() => {
        const dentalComps = comparisons.filter((c) => c.categorySlug === "dental");
        if (dentalComps.length === 0) return "بيانات أسنان غير متاحة.";
        const avgA = Math.round(dentalComps.reduce((s, c) => s + c.cityATypical, 0) / dentalComps.length);
        const avgB = Math.round(dentalComps.reduce((s, c) => s + c.cityBTypical, 0) / dentalComps.length);
        const cheaper = avgA < avgB ? cityANameAr : cityBNameAr;
        return `لإجراءات الأسنان، ${cheaper} أرخص في المتوسط. متوسط سعر الأسنان في ${cityANameAr}: ${formatAed(avgA)}، وفي ${cityBNameAr}: ${formatAed(avgB)}.`;
      })(),
    },
    {
      question: "هل يغطي التأمين الإجراءات الطبية في كلتا المدينتين؟",
      answer:
        "يُعدّ التأمين الصحي إلزامياً لجميع المقيمين في الإمارات منذ يناير ٢٠٢٥. تُطبَّق نفس قواعد التأمين بشكل عام في جميع الإمارات، غير أن قوائم مزودي الشبكة تتباين بحسب المدينة. تحقق دائماً من أن المزود في شبكة التأمين الخاصة بك.",
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
          { name: "مقارنة المدن", url: `${base}/ar/pricing/compare` },
          { name: `${cityANameAr} مقابل ${cityBNameAr}` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "مقارنة المدن", href: "/ar/pricing/compare" },
          { label: `${cityANameAr} مقابل ${cityBNameAr}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {cityANameAr} مقابل {cityBNameAr} — مقارنة التكاليف الطبية
          </h1>
        </div>

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {winnerCity
              ? `${winnerNameAr} أرخص عموماً من ${loserNameAr} للرعاية الطبية. من بين ${totalProcedures.toLocaleString("ar-AE")} إجراءً تمت مقارنته، كانت ${cityANameAr} أرخص في ${totalA.toLocaleString("ar-AE")} و${cityBNameAr} أرخص في ${totalB.toLocaleString("ar-AE")}${totalTie > 0 ? ` (${totalTie.toLocaleString("ar-AE")} متساوية)` : ""}. الفارق المتوسط: ${avgDiffPercent.toLocaleString("ar-AE")}٪.`
              : `${cityANameAr} و${cityBNameAr} متقاربتان في التكلفة الإجمالية. من بين ${totalProcedures.toLocaleString("ar-AE")} إجراءً، ${cityANameAr} أرخص في ${totalA.toLocaleString("ar-AE")} و${cityBNameAr} في ${totalB.toLocaleString("ar-AE")}.`}
            {" "}البيانات مستندة إلى منهجية التعرفة الإلزامية لوزارة الصحة ومعدلات السوق حتى مارس ٢٠٢٦.
          </p>
        </div>

        {/* Winner summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">الفائز بالسعر</p>
            <p className="text-xl font-bold text-[#006828]">{winnerNameAr || "متساوٍ"}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">فرق % متوسط</p>
            <p className="text-xl font-bold text-[#1c1c1c]">{avgDiffPercent.toLocaleString("ar-AE")}٪</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">إجراءات تمت المقارنة</p>
            <p className="text-xl font-bold text-[#1c1c1c]">{totalProcedures.toLocaleString("ar-AE")}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-[11px] text-black/40 mb-1">المجموعات الطبية</p>
            <p className="text-xl font-bold text-[#1c1c1c]">{categoryWinners.length.toLocaleString("ar-AE")}</p>
          </div>
        </div>
      </div>

      {/* Category Winners */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          النتائج حسب الفئة
        </h2>
      </div>
      <div className="border border-black/[0.06] mb-10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f8f6] text-right">
              <th scope="col" className="p-3 font-bold text-[#1c1c1c]">الفئة</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-center">{cityANameAr} أرخص</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-center">{cityBNameAr} أرخص</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-center">الفائز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {categoryWinners.map((cw) => (
              <tr key={cw.categorySlug}>
                <td className="p-3 font-medium text-[#1c1c1c]">{cw.categoryName}</td>
                <td className="p-3 text-center">{cw.cityAWins.toLocaleString("ar-AE")}</td>
                <td className="p-3 text-center">{cw.cityBWins.toLocaleString("ar-AE")}</td>
                <td className="p-3 text-center">
                  {cw.winner === "A" ? (
                    <span className="text-green-700 font-medium">{cityANameAr}</span>
                  ) : cw.winner === "B" ? (
                    <span className="text-green-700 font-medium">{cityBNameAr}</span>
                  ) : (
                    <Minus className="w-4 h-4 text-black/40 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Procedure-by-procedure */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنة الإجراءات (الأكثر فارقاً أولاً)
        </h2>
      </div>
      <div className="border border-black/[0.06] mb-10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f8f6] text-right">
              <th scope="col" className="p-3 font-bold text-[#1c1c1c]">الإجراء</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-left">{cityANameAr}</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-left">{cityBNameAr}</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-center">الأرخص</th>
              <th scope="col" className="p-3 font-bold text-[#1c1c1c] text-left">الفارق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {sortedComparisons.map((comp) => (
              <tr key={comp.slug} className="hover:bg-[#f8f8f6]">
                <td className="p-3">
                  <Link href={`/ar/pricing/${comp.slug}`} className="text-[#006828] hover:underline font-medium">
                    {comp.name}
                  </Link>
                </td>
                <td className={`p-3 text-left font-medium ${comp.cheaperCity === "A" ? "text-green-700" : "text-[#1c1c1c]"}`}>
                  {formatAed(comp.cityATypical)}
                </td>
                <td className={`p-3 text-left font-medium ${comp.cheaperCity === "B" ? "text-green-700" : "text-[#1c1c1c]"}`}>
                  {formatAed(comp.cityBTypical)}
                </td>
                <td className="p-3 text-center">
                  {comp.cheaperCity === "A" ? (
                    <TrendingDown className="w-4 h-4 text-green-600 mx-auto" />
                  ) : comp.cheaperCity === "B" ? (
                    <TrendingDown className="w-4 h-4 text-blue-600 mx-auto" />
                  ) : (
                    <Minus className="w-4 h-4 text-black/40 mx-auto" />
                  )}
                </td>
                <td className="p-3 text-left text-black/40">
                  {Math.abs(comp.diffPercent).toLocaleString("ar-AE")}٪
                  {comp.cheaperCity !== "tie" && (
                    comp.cheaperCity === "A"
                      ? <TrendingDown className="w-3 h-3 text-green-600 inline-block ml-1" />
                      : <TrendingUp className="w-3 h-3 text-red-400 inline-block ml-1" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Other comparisons */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنات مدن أخرى
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.filter((c) => c.slug !== cityA.slug && c.slug !== cityB.slug).map((c) => (
          <Link
            key={c.slug}
            href={`/ar/pricing/compare/${cityA.slug}-vs-${c.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
          >
            <span className="text-sm text-[#1c1c1c] group-hover:text-[#006828]">
              {cityANameAr} مقابل {getArabicCityName(c.slug)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180" />
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${cityANameAr} مقابل ${cityBNameAr} — الأسئلة الشائعة`} />

      {/* Footer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار المعروضة نطاقات تقريبية مستندة إلى
          منهجية التعرفة الإلزامية لوزارة الصحة (شفافية) وبيانات السوق حتى مارس ٢٠٢٦.
        </p>
        <Link href={`/pricing/compare/${cities}`} className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
