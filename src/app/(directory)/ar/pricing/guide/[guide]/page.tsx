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
  TrendingDown,
  TrendingUp,
  Shield,
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
  params: Promise<{ guide: string }>;
}

export async function generateStaticParams() {
  return PRICING_GUIDES.map((g) => ({ guide: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide: slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  const base = getBaseUrl();
  const nameAr = GUIDE_NAME_AR[slug] || guide.name;
  return {
    title: `${nameAr} — أسعار الإجراءات الطبية في الإمارات | دليل الإمارات المفتوح للرعاية الصحية`,
    description: guide.description,
    alternates: {
      canonical: `${base}/ar/pricing/guide/${guide.slug}`,
      languages: {
        "en-AE": `${base}/pricing/guide/${guide.slug}`,
        "ar-AE": `${base}/ar/pricing/guide/${guide.slug}`,
      },
    },
    openGraph: {
      title: nameAr,
      description: guide.description,
      url: `${base}/ar/pricing/guide/${guide.slug}`,
      type: "website",
    },
  };
}

export default async function ArGuidePage({ params }: PageProps) {
  const { guide: slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const base = getBaseUrl();
  const Icon = ICON_MAP[guide.icon] || ShieldOff;
  const nameAr = GUIDE_NAME_AR[slug] || guide.name;

  const featuredProcs = guide.featuredProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean) as typeof PROCEDURES;

  const cityAverages = CITIES.map((city) => {
    const typicals = featuredProcs
      .map((p) => p.cityPricing[city.slug]?.typical)
      .filter(Boolean) as number[];
    const avg =
      typicals.length > 0
        ? Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length)
        : 0;
    return { city, avg };
  })
    .filter((c) => c.avg > 0)
    .sort((a, b) => a.avg - b.avg);

  const cheapestCity = cityAverages[0];
  const mostExpensiveCity = cityAverages[cityAverages.length - 1];

  const faqs = [
    {
      question: `كم تكلف الرعاية الطبية ${nameAr} في الإمارات؟`,
      answer: `متوسط الأسعار لهذا الدليل يتراوح بين ${formatAed(featuredProcs[0]?.priceRange.min ?? 0)} و${formatAed(featuredProcs[0]?.priceRange.max ?? 0)} للإجراء الواحد. ${cheapestCity ? `أرخص المدن: ${getArabicCityName(cheapestCity.city.slug)} بمتوسط ${formatAed(cheapestCity.avg)}.` : ""}`,
    },
    {
      question: "هل يغطي التأمين الصحي هذه الإجراءات في الإمارات؟",
      answer: `${featuredProcs.filter((p) => p.insuranceCoverage === "typically-covered").length} من ${featuredProcs.length} إجراءً في هذا الدليل مغطاة عادةً بتأمين الإمارات. ${featuredProcs.filter((p) => p.insuranceCoverage === "partially-covered").length} مغطاة جزئياً. التأمين الصحي إلزامي لجميع المقيمين في الإمارات منذ يناير ٢٠٢٥.`,
    },
    {
      question: `ما الفرق في السعر بين أرخص وأغلى مدينة لهذا الدليل؟`,
      answer: cheapestCity && mostExpensiveCity
        ? `نفس مجموعة الإجراءات تكلف ${formatAed(cheapestCity.avg)} في ${getArabicCityName(cheapestCity.city.slug)} مقابل ${formatAed(mostExpensiveCity.avg)} في ${getArabicCityName(mostExpensiveCity.city.slug)} — فارق ${Math.round(((mostExpensiveCity.avg - cheapestCity.avg) / cheapestCity.avg) * 100).toLocaleString("ar-AE")}٪.`
        : "تتفاوت الأسعار بشكل ملحوظ بين مدن الإمارات.",
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
          { name: nameAr },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={medicalWebPageSchema(nameAr, guide.description, "2026-03-25")}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "أدلة التسعير", href: "/ar/pricing/guide" },
          { label: nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {nameAr}
          </h1>
        </div>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{guide.description}</p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-2">
            <strong className="text-[#1c1c1c]">المستفيد من هذا الدليل:</strong>{" "}
            {guide.audience}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: featuredProcs.length.toLocaleString("ar-AE"), label: "إجراءات مشمولة" },
            { value: CITIES.length.toLocaleString("ar-AE"), label: "مدن مقارنة" },
            { value: guide.tips.length.toLocaleString("ar-AE"), label: "نصائح متخصصة" },
            {
              value: cheapestCity ? getArabicCityName(cheapestCity.city.slug) : "—",
              label: "أرخص مدينة",
            },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Procedure Prices Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أسعار الإجراءات
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        الأسعار نطاقات إماراتية عامة. انقر على أي إجراء لعرض أسعار المدن وتفاصيل التأمين.
      </p>
      <div className="border border-black/[0.06] divide-y divide-black/[0.06] mb-10">
        <div className="hidden sm:grid grid-cols-12 gap-2 p-3 bg-[#f8f8f6] text-[10px] font-bold text-black/40 uppercase tracking-wider">
          <div className="col-span-4">الإجراء</div>
          <div className="col-span-2 text-left">الحد الأدنى</div>
          <div className="col-span-2 text-left">النموذجي</div>
          <div className="col-span-2 text-left">الحد الأقصى</div>
          <div className="col-span-2 text-left">التأمين</div>
        </div>
        {featuredProcs.map((proc) => {
          const avgTypical = Math.round(
            Object.values(proc.cityPricing).reduce((sum, cp) => sum + cp.typical, 0) /
            Object.keys(proc.cityPricing).length
          );
          const coverageColor =
            proc.insuranceCoverage === "typically-covered" ? "text-green-700 bg-green-50"
            : proc.insuranceCoverage === "partially-covered" ? "text-yellow-700 bg-yellow-50"
            : proc.insuranceCoverage === "rarely-covered" ? "text-orange-700 bg-orange-50"
            : "text-red-700 bg-red-50";

          return (
            <Link
              key={proc.slug}
              href={`/ar/pricing/${proc.slug}`}
              className="grid grid-cols-12 gap-2 p-3 hover:bg-[#f8f8f6] transition-colors group items-center"
            >
              <div className="col-span-12 sm:col-span-4">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {proc.name}
                </h3>
                <p className="text-[10px] text-black/40 sm:hidden">
                  {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                </p>
              </div>
              <div className="hidden sm:block col-span-2 text-left text-sm text-black/40">
                {formatAed(proc.priceRange.min)}
              </div>
              <div className="hidden sm:block col-span-2 text-left font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {formatAed(avgTypical)}
              </div>
              <div className="hidden sm:block col-span-2 text-left text-sm text-black/40">
                {formatAed(proc.priceRange.max)}
              </div>
              <div className="hidden sm:flex col-span-2 justify-start">
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {COVERAGE_LABEL_AR[proc.insuranceCoverage] || proc.insuranceCoverage}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tips */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نصائح متخصصة
        </h2>
      </div>
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="space-y-4">
          {guide.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#006828] text-white flex items-center justify-center text-xs font-bold">
                {(i + 1).toLocaleString("ar-AE")}
              </div>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City Comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنة الأسعار بين المدن
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        متوسط الأسعار النموذجية لإجراءات هذا الدليل حسب المدينة. انقر للحصول على أسعار تفصيلية.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {cityAverages.map(({ city, avg }, idx) => (
          <Link
            key={city.slug}
            href={`/ar/pricing/guide/${guide.slug}/${city.slug}`}
            className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#006828]" />
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {getArabicCityName(city.slug)}
                </h3>
              </div>
              {idx === 0 && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 text-green-700 bg-green-50">
                  الأرخص
                </span>
              )}
              {idx === cityAverages.length - 1 && cityAverages.length > 1 && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 text-red-700 bg-red-50">
                  الأغلى
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-[#1c1c1c]">{formatAed(avg)}</p>
            <p className="text-[10px] text-black/40">متوسط السعر النموذجي</p>
          </Link>
        ))}
      </div>

      {/* Insurance */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          اعتبارات التأمين
        </h2>
      </div>
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 space-y-3" data-answer-block="true">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">إلزامي منذ يناير ٢٠٢٥:</strong>{" "}
              التأمين الصحي إلزامي لجميع المقيمين في الإمارات. يجب على أصحاب العمل توفير تغطية لموظفيهم.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">الإجراءات المغطاة:</strong>{" "}
              من بين {featuredProcs.length.toLocaleString("ar-AE")} إجراءً في هذا الدليل،{" "}
              {featuredProcs.filter((p) => p.insuranceCoverage === "typically-covered").length.toLocaleString("ar-AE")}{" "}
              مغطاة عادةً بالتأمين،{" "}
              {featuredProcs.filter((p) => p.insuranceCoverage === "partially-covered").length.toLocaleString("ar-AE")}{" "}
              مغطاة جزئياً، و
              {featuredProcs.filter((p) => p.insuranceCoverage === "not-covered" || p.insuranceCoverage === "rarely-covered").length.toLocaleString("ar-AE")}{" "}
              نادراً ما تُغطى أو غير مغطاة.
            </p>
          </div>
          {cheapestCity && mostExpensiveCity && (
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
              <p className="font-['Geist',sans-serif] text-sm text-black/40">
                <strong className="text-[#1c1c1c]">الفارق السعري:</strong>{" "}
                نفس مجموعة الإجراءات تكلف {formatAed(cheapestCity.avg)} في {getArabicCityName(cheapestCity.city.slug)}{" "}
                مقابل {formatAed(mostExpensiveCity.avg)} في {getArabicCityName(mostExpensiveCity.city.slug)}{" "}
                — فارق{" "}
                {Math.round(((mostExpensiveCity.avg - cheapestCity.avg) / cheapestCity.avg) * 100).toLocaleString("ar-AE")}٪.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other guides */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أدلة تسعير أخرى
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {PRICING_GUIDES.filter((g) => g.slug !== guide.slug).map((g) => {
          const OtherIcon = ICON_MAP[g.icon] || ShieldOff;
          return (
            <Link
              key={g.slug}
              href={`/ar/pricing/guide/${g.slug}`}
              className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group flex items-center gap-3"
            >
              <OtherIcon className="w-5 h-5 text-[#006828] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                  {GUIDE_NAME_AR[g.slug] || g.name}
                </h3>
                <p className="text-[10px] text-black/40 truncate">
                  {g.featuredProcedures.length.toLocaleString("ar-AE")} إجراءً
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 rotate-180" />
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${nameAr} — الأسئلة الشائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار نطاقات استرشادية مستندة إلى منهجية تعرفة وزارة الصحة الإلزامية ومعدلات السوق حتى مارس ٢٠٢٦. هذه المعلومات لأغراض توعوية فقط وليست استشارة طبية أو مالية.
        </p>
        <Link href={`/pricing/guide/${guide.slug}`} className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
