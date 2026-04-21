import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
  ArrowRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PRICING_GUIDES,
  getGuideBySlug,
} from "@/lib/constants/pricing-guides";
import {
  PROCEDURES,
  formatAed,
  getProcedureBySlug,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  medicalWebPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
};

const GUIDE_NAME_AR: Record<string, string> = {
  "without-insurance": "الرعاية الصحية بدون تأمين",
  "for-tourists": "للسياح والزوار",
  "for-expats": "للمقيمين الوافدين",
  "budget-healthcare": "الرعاية الصحية الاقتصادية",
  "premium-healthcare": "الرعاية الصحية المتميزة",
  "maternity-costs": "تكاليف الأمومة والولادة",
};

const COVERAGE_LABEL_AR: Record<string, string> = {
  "typically-covered": "مغطى",
  "partially-covered": "مغطى جزئياً",
  "rarely-covered": "نادراً ما يُغطى",
  "not-covered": "غير مغطى",
};

interface PageProps {
  params: Promise<{ guide: string; city: string }>;
}

export async function generateStaticParams() {
  const params: { guide: string; city: string }[] = [];
  for (const guide of PRICING_GUIDES) {
    for (const city of CITIES) {
      params.push({ guide: guide.slug, city: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide: guideSlug, city: citySlug } = await params;
  const guide = getGuideBySlug(guideSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!guide || !city) return {};

  const base = getBaseUrl();
  const nameAr = GUIDE_NAME_AR[guideSlug] || guide.name;
  const cityNameAr = getArabicCityName(citySlug);

  return {
    title: `${nameAr} في ${cityNameAr} — أسعار الإجراءات الطبية | دليل الإمارات المفتوح للرعاية الصحية`,
    description: `${guide.description.split(".")[0]} في ${cityNameAr}. قارن أسعار ${guide.featuredProcedures.length.toLocaleString("ar-AE")} إجراءً طبياً مع نصائح خاصة بالمدينة.`,
    alternates: {
      canonical: `${base}/ar/pricing/guide/${guide.slug}/${city.slug}`,
      languages: {
        "en-AE": `${base}/pricing/guide/${guide.slug}/${city.slug}`,
        "ar-AE": `${base}/ar/pricing/guide/${guide.slug}/${city.slug}`,
      },
    },
    openGraph: {
      title: `${nameAr} في ${cityNameAr}`,
      description: `${guide.description.split(".")[0]} في ${cityNameAr}.`,
      url: `${base}/ar/pricing/guide/${guide.slug}/${city.slug}`,
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

export default async function ArGuideCityPage({ params }: PageProps) {
  const { guide: guideSlug, city: citySlug } = await params;
  const guide = getGuideBySlug(guideSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!guide || !city) notFound();

  const base = getBaseUrl();
  const Icon = ICON_MAP[guide.icon] || ShieldOff;
  const nameAr = GUIDE_NAME_AR[guideSlug] || guide.name;
  const cityNameAr = getArabicCityName(citySlug);
  const regulatorAr = getRegulatorAr(citySlug);

  const featuredProcs = guide.featuredProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean) as typeof PROCEDURES;

  const procsWithCityPricing = featuredProcs.filter((p) => p.cityPricing[citySlug]);

  const avgTypical =
    procsWithCityPricing.length > 0
      ? Math.round(
          procsWithCityPricing.reduce(
            (sum, p) => sum + (p.cityPricing[citySlug]?.typical ?? 0),
            0
          ) / procsWithCityPricing.length
        )
      : 0;

  const cityAverages = CITIES.map((c) => {
    const typicals = featuredProcs
      .map((p) => p.cityPricing[c.slug]?.typical)
      .filter(Boolean) as number[];
    const avg = typicals.length > 0
      ? Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length)
      : 0;
    return { city: c, avg };
  })
    .filter((c) => c.avg > 0)
    .sort((a, b) => a.avg - b.avg);

  const faqs = [
    {
      question: `ما تكلفة ${nameAr} في ${cityNameAr}؟`,
      answer: `يغطي هذا الدليل ${procsWithCityPricing.length.toLocaleString("ar-AE")} إجراءً طبياً في ${cityNameAr}. متوسط السعر النموذجي: ${formatAed(avgTypical)}. الرعاية الصحية في ${cityNameAr} تُنظِّمها ${regulatorAr}.`,
    },
    {
      question: `هل ${cityNameAr} باهظة التكلفة مقارنةً بمدن الإمارات الأخرى؟`,
      answer: (() => {
        const rank = cityAverages.findIndex((ca) => ca.city.slug === citySlug) + 1;
        const cheapest = cityAverages[0];
        return `${cityNameAr} تحتل المرتبة ${rank.toLocaleString("ar-AE")} من ${cityAverages.length.toLocaleString("ar-AE")} مدن. ${cheapest ? `أرخص مدينة هي ${getArabicCityName(cheapest.city.slug)} بمتوسط ${formatAed(cheapest.avg)}.` : ""}`;
      })(),
    },
    {
      question: `هل يغطي التأمين هذه الإجراءات في ${cityNameAr}؟`,
      answer: `التأمين الصحي إلزامي في الإمارات. ${procsWithCityPricing.filter((p) => p.insuranceCoverage === "typically-covered").length.toLocaleString("ar-AE")} من ${procsWithCityPricing.length.toLocaleString("ar-AE")} إجراءً في هذا الدليل مغطاة عادةً. تطبَّق اشتراكات 10-20٪ على الإجراءات المشمولة. الرعاية الصحية في ${cityNameAr} خاضعة لتنظيم ${regulatorAr}.`,
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
          { name: "أدلة التسعير", url: `${base}/ar/pricing/guide` },
          { name: nameAr, url: `${base}/ar/pricing/guide/${guide.slug}` },
          { name: cityNameAr },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={medicalWebPageSchema(
          `${nameAr} في ${cityNameAr}`,
          `${guide.description.split(".")[0]} في ${cityNameAr}.`,
          "2026-03-25"
        )}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "أدلة التسعير", href: "/ar/pricing/guide" },
          { label: nameAr, href: `/ar/pricing/guide/${guide.slug}` },
          { label: cityNameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {nameAr} في {cityNameAr}
          </h1>
        </div>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {guide.description.split(".")[0]} في {cityNameAr}.
            يغطي هذا الدليل {procsWithCityPricing.length.toLocaleString("ar-AE")} إجراءً بمتوسط سعر نموذجي{" "}
            {formatAed(avgTypical)}.
            الرعاية الصحية في {cityNameAr} تُنظِّمها {regulatorAr}.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: procsWithCityPricing.length.toLocaleString("ar-AE"), label: "إجراءات مشمولة" },
            { value: formatAed(avgTypical), label: "متوسط السعر" },
            { value: guide.tips.length.toLocaleString("ar-AE"), label: "نصائح متخصصة" },
            { value: cityNameAr, label: "المدينة" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Procedure Prices for this city */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أسعار الإجراءات في {cityNameAr}
        </h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-black/[0.06] mb-10">
        <div className="hidden sm:grid grid-cols-12 gap-2 p-3 bg-[#f8f8f6] text-[10px] font-bold text-black/40 uppercase tracking-wider">
          <div className="col-span-4">الإجراء</div>
          <div className="col-span-2 text-left">الأدنى</div>
          <div className="col-span-2 text-left">النموذجي</div>
          <div className="col-span-2 text-left">الأقصى</div>
          <div className="col-span-2 text-left">التأمين</div>
        </div>
        {procsWithCityPricing.map((proc) => {
          const cp = proc.cityPricing[citySlug];
          if (!cp) return null;
          const coverageColor =
            proc.insuranceCoverage === "typically-covered" ? "text-green-700 bg-green-50"
            : proc.insuranceCoverage === "partially-covered" ? "text-yellow-700 bg-yellow-50"
            : proc.insuranceCoverage === "rarely-covered" ? "text-orange-700 bg-orange-50"
            : "text-red-700 bg-red-50";
          return (
            <Link
              key={proc.slug}
              href={`/ar/pricing/${proc.slug}/${citySlug}`}
              className="grid grid-cols-12 gap-2 p-3 hover:bg-[#f8f8f6] transition-colors group items-center"
            >
              <div className="col-span-12 sm:col-span-4">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {proc.name}
                </h3>
                <p className="text-[10px] text-black/40 sm:hidden">
                  {formatAed(cp.min)} – {formatAed(cp.max)}
                </p>
              </div>
              <div className="hidden sm:block col-span-2 text-left text-sm text-black/40">{formatAed(cp.min)}</div>
              <div className="hidden sm:block col-span-2 text-left font-semibold text-[#1c1c1c]">{formatAed(cp.typical)}</div>
              <div className="hidden sm:block col-span-2 text-left text-sm text-black/40">{formatAed(cp.max)}</div>
              <div className="hidden sm:flex col-span-2 justify-start">
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {COVERAGE_LABEL_AR[proc.insuranceCoverage] || proc.insuranceCoverage}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* City Tips */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نصائح عامة
        </h2>
      </div>
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="space-y-4">
          {guide.tips.slice(0, 4).map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#006828] text-white flex items-center justify-center text-xs font-bold">
                {(i + 1).toLocaleString("ar-AE")}
              </div>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compare with other cities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نفس الدليل في مدن أخرى
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {cityAverages.filter((ca) => ca.city.slug !== citySlug).map(({ city: c, avg }, idx) => (
          <Link
            key={c.slug}
            href={`/ar/pricing/guide/${guide.slug}/${c.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[#006828]" />
              <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828]">
                {getArabicCityName(c.slug)}
              </span>
              {idx === 0 && (
                <span className="text-[9px] text-green-700 bg-green-50 px-1">الأرخص</span>
              )}
            </div>
            <p className="text-sm font-bold text-[#006828]">{formatAed(avg)}</p>
          </Link>
        ))}
      </div>

      {/* Other guides */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أدلة أخرى لـ{cityNameAr}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {PRICING_GUIDES.filter((g) => g.slug !== guide.slug).map((g) => (
          <Link
            key={g.slug}
            href={`/ar/pricing/guide/${g.slug}/${citySlug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
          >
            <span className="text-sm font-medium text-[#1c1c1c] group-hover:text-[#006828]">
              {GUIDE_NAME_AR[g.slug] || g.name}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${nameAr} في ${cityNameAr} — الأسئلة الشائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار نطاقات استرشادية حتى مارس ٢٠٢٦. الرعاية الصحية في {cityNameAr} تُنظِّمها {regulatorAr}.
        </p>
        <Link
          href={`/pricing/guide/${guide.slug}/${city.slug}`}
          className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4 flex items-center gap-1"
        >
          English <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
