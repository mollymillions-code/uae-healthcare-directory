import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCompareArrows, Star, MapPin, Layers } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";
import {
  getAllComparisonSlugs,
  parseComparisonSlug,
  getCityComparison,
  getCategoryComparison,
  CityComparisonData,
  CategoryComparisonData,
} from "@/lib/compare";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getBaseUrl();
  const parsed = parseComparisonSlug(slug);
  if (!parsed) return { title: "المقارنة غير موجودة" };

  if (parsed.type === "city") {
    const data = await getCityComparison(parsed.cityASlug!, parsed.cityBSlug!);
    if (!data) return { title: "المقارنة غير موجودة" };
    const cityANameAr = getArabicCityName(data.cityA.slug);
    const cityBNameAr = getArabicCityName(data.cityB.slug);
    const title = `الرعاية الصحية في ${cityANameAr} مقابل ${cityBNameAr}: مقارنة شاملة | دليل الإمارات المفتوح`;
    const description = `مقارنة جنباً إلى جنب بين الرعاية الصحية في ${cityANameAr} (${data.statsA.totalProviders.toLocaleString("ar-AE")} منشأة) و${cityBNameAr} (${data.statsB.totalProviders.toLocaleString("ar-AE")} منشأة). البيانات من سجلات DHA وDOH وMOHAP.`;
    return {
      title,
      description,
      alternates: {
        canonical: `${base}/ar/directory/compare/${slug}`,
        languages: {
          "en-AE": `${base}/directory/compare/${slug}`,
          "ar-AE": `${base}/ar/directory/compare/${slug}`,
          "x-default": `${base}/directory/compare/${slug}`,
        },
      },
      openGraph: { title, description, url: `${base}/ar/directory/compare/${slug}`, type: "website", locale: "ar_AE" },
    };
  }

  const data = await getCategoryComparison(parsed.catASlug!, parsed.catBSlug!, parsed.citySlug!);
  if (!data) return { title: "المقارنة غير موجودة" };
  const cityNameAr = getArabicCityName(parsed.citySlug!);
  const title = `${data.categoryA.name} مقابل ${data.categoryB.name} في ${cityNameAr}: مقارنة | دليل الإمارات`;
  const description = `قارن ${data.categoryA.name} (${data.statsA.totalProviders.toLocaleString("ar-AE")} منشأة) مقابل ${data.categoryB.name} (${data.statsB.totalProviders.toLocaleString("ar-AE")} منشأة) في ${cityNameAr}.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${base}/ar/directory/compare/${slug}`,
      languages: {
        "en-AE": `${base}/directory/compare/${slug}`,
        "ar-AE": `${base}/ar/directory/compare/${slug}`,
        "x-default": `${base}/directory/compare/${slug}`,
      },
    },
    openGraph: { title, description, url: `${base}/ar/directory/compare/${slug}`, type: "website", locale: "ar_AE" },
  };
}

export default async function ArComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug);
  if (!parsed) notFound();

  if (parsed.type === "city") {
    const data = await getCityComparison(parsed.cityASlug!, parsed.cityBSlug!);
    if (!data) notFound();
    return <ArCityComparisonView data={data} />;
  }

  const data = await getCategoryComparison(parsed.catASlug!, parsed.catBSlug!, parsed.citySlug!);
  if (!data) notFound();
  return <ArCategoryComparisonView data={data} />;
}

function ArCityComparisonView({ data }: { data: CityComparisonData }) {
  const base = getBaseUrl();
  const { cityA, cityB, statsA, statsB } = data;
  const cityANameAr = getArabicCityName(cityA.slug);
  const cityBNameAr = getArabicCityName(cityB.slug);

  const faqs = [
    {
      question: `كيف تختلف تكلفة الرعاية الصحية في ${cityANameAr} عن ${cityBNameAr}؟`,
      answer:
        `تتراوح تكلفة الاستشارة لدى طبيب عام في ${cityANameAr} عادةً بين ${statsA.gpFeeRange}، وفي ${cityBNameAr} بين ${statsB.gpFeeRange}. ` +
        `تتراوح استشارة المتخصصين في ${cityANameAr} بين ${statsA.specialistFeeRange} مقابل ${statsB.specialistFeeRange} في ${cityBNameAr}. ` +
        `تأكد دائماً من الرسوم مباشرةً مع مزود الخدمة.`,
    },
    {
      question: `أي المدينتين أفضل من حيث جودة الرعاية الصحية، ${cityANameAr} أم ${cityBNameAr}؟`,
      answer:
        `استناداً إلى تقييمات Google من مراجعات المرضى المعتمدة، يبلغ متوسط تقييم مقدمي الخدمة في ${cityANameAr} ${statsA.avgRating > 0 ? statsA.avgRating.toFixed(1) : "غير متوفر"} ` +
        `(عبر ${statsA.ratedProviderCount.toLocaleString("ar-AE")} منشأة مُقيَّمة) بينما يبلغ متوسط ${cityBNameAr} ${statsB.avgRating > 0 ? statsB.avgRating.toFixed(1) : "غير متوفر"} ` +
        `(عبر ${statsB.ratedProviderCount.toLocaleString("ar-AE")} منشأة مُقيَّمة). ` +
        `كلتا المدينتين تضم مستشفيات معتمدة دولياً. الجودة تعتمد على مزود الخدمة والتخصص واحتياجاتك أكثر من المدينة ذاتها.`,
    },
    {
      question: `هل الوصول إلى الرعاية الصحية أيسر في ${cityANameAr} أم ${cityBNameAr}؟`,
      answer:
        `تضم ${cityANameAr} ${statsA.totalProviders.toLocaleString("ar-AE")} منشأة صحية مُدرجة مقارنةً بـ ${statsB.totalProviders.toLocaleString("ar-AE")} في ${cityBNameAr}. ` +
        `تُنظِّم الرعاية الصحية في ${cityANameAr} جهة ${statsA.regulator}، وفي ${cityBNameAr} جهة ${statsB.regulator}.`,
    },
    {
      question: `كيف يختلف التأمين بين ${cityANameAr} و${cityBNameAr}؟`,
      answer:
        `${statsA.insuranceNote} في ${cityBNameAr}: ${statsB.insuranceNote}`,
    },
  ];

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "مقارنة", url: `${base}/ar/directory/compare` },
          { name: `${cityANameAr} مقابل ${cityBNameAr}`, url: `${base}/ar/directory/compare/${data.slug}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "مقارنة", href: "/ar/directory/compare" },
          { label: `${cityANameAr} مقابل ${cityBNameAr}` },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GitCompareArrows className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            الرعاية الصحية في {cityANameAr} مقابل {cityBNameAr}: مقارنة شاملة
          </h1>
        </div>

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
            وفقاً لدليل الإمارات المفتوح للرعاية الصحية، تضم {cityANameAr}{" "}
            {statsA.totalProviders.toLocaleString("ar-AE")} منشأة صحية مرخصة، فيما تضم{" "}
            {cityBNameAr} {statsB.totalProviders.toLocaleString("ar-AE")} منشأة.
            تُنظِّم الرعاية الصحية في {cityANameAr} جهة {statsA.regulator}،
            وفي {cityBNameAr} جهة {statsB.regulator}. تكلفة الاستشارة لدى طبيب
            عام {statsA.gpFeeRange} في {cityANameAr} مقارنةً بـ {statsB.gpFeeRange}
            في {cityBNameAr}. البيانات من السجلات الحكومية الرسمية وخرائط Google، تحقق مارس 2026.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">مقارنة جنباً إلى جنب</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-black/[0.06] text-sm">
            <thead>
              <tr className="bg-[#1c1c1c] text-white">
                <th scope="col" className="text-right py-3 px-4 font-bold">المقياس</th>
                <th scope="col" className="text-right py-3 px-4 font-bold">{cityANameAr}</th>
                <th scope="col" className="text-right py-3 px-4 font-bold">{cityBNameAr}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">إجمالي المنشآت</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.totalProviders.toLocaleString("ar-AE")}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.totalProviders.toLocaleString("ar-AE")}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">متوسط التقييم</td>
                <td className="py-3 px-4">
                  {statsA.avgRating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#006828]" />
                      {statsA.avgRating.toFixed(1)}
                      <span className="text-black/40 text-xs">({statsA.ratedProviderCount.toLocaleString("ar-AE")} مُقيَّم)</span>
                    </span>
                  ) : "غير متوفر"}
                </td>
                <td className="py-3 px-4">
                  {statsB.avgRating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#006828]" />
                      {statsB.avgRating.toFixed(1)}
                      <span className="text-black/40 text-xs">({statsB.ratedProviderCount.toLocaleString("ar-AE")} مُقيَّم)</span>
                    </span>
                  ) : "غير متوفر"}
                </td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">المستشفيات</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.hospitalCount.toLocaleString("ar-AE")}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.hospitalCount.toLocaleString("ar-AE")}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">العيادات</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.clinicCount.toLocaleString("ar-AE")}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.clinicCount.toLocaleString("ar-AE")}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">عيادات الأسنان</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.dentalCount.toLocaleString("ar-AE")}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.dentalCount.toLocaleString("ar-AE")}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">الصيدليات</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.pharmacyCount.toLocaleString("ar-AE")}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.pharmacyCount.toLocaleString("ar-AE")}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">استشارة طبيب عام</td>
                <td className="py-3 px-4">{statsA.gpFeeRange}</td>
                <td className="py-3 px-4">{statsB.gpFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">استشارة متخصص</td>
                <td className="py-3 px-4">{statsA.specialistFeeRange}</td>
                <td className="py-3 px-4">{statsB.specialistFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">زيارة الطوارئ</td>
                <td className="py-3 px-4">{statsA.emergencyFeeRange}</td>
                <td className="py-3 px-4">{statsB.emergencyFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">الجهة التنظيمية</td>
                <td className="py-3 px-4 text-xs">{statsA.regulator}</td>
                <td className="py-3 px-4 text-xs">{statsB.regulator}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">أعلى المنشآت تقييماً</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { city: cityA, cityNameAr: cityANameAr, stats: statsA },
            { city: cityB, cityNameAr: cityBNameAr, stats: statsB },
          ].map(({ city, cityNameAr: cNameAr, stats }) => (
            <div key={city.slug}>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#006828]" />
                {cNameAr}
              </h3>
              {stats.topProviders.length > 0 ? (
                <div className="space-y-0">
                  {stats.topProviders.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-2 border-b border-black/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#006828]/40 font-['Geist',sans-serif] w-5">{i + 1}</span>
                        <span className="text-sm font-medium text-[#1c1c1c]">{p.name}</span>
                      </div>
                      {Number(p.rating) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#006828]" />
                          <span className="text-xs font-bold text-[#006828]">{p.rating}</span>
                          <span className="text-[10px] text-black/40">({p.reviewCount.toLocaleString("ar-AE")})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-['Geist',sans-serif] text-sm text-black/40">لا توجد منشآت مُقيَّمة بعد.</p>
              )}
              <Link href={`/ar/directory/${city.slug}`} className="text-xs font-medium text-[#006828] hover:underline mt-2 inline-block">
                تصفح جميع منشآت {cNameAr} ←
              </Link>
            </div>
          ))}
        </div>
      </div>

      <FaqSection faqs={faqs} title={`${cityANameAr} مقابل ${cityBNameAr} — أسئلة شائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40">
          <strong>إخلاء المسؤولية:</strong> جميع البيانات من السجلات الحكومية الرسمية وخرائط Google، آخر تحقق مارس 2026.
        </p>
        <Link href={`/directory/compare/${data.slug}`} className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English →
        </Link>
      </div>
    </div>
  );
}

function ArCategoryComparisonView({ data }: { data: CategoryComparisonData }) {
  const base = getBaseUrl();
  const { categoryA, categoryB, cityName, statsA, statsB } = data;
  const citySlug = cityName.toLowerCase().replace(/\s+/g, "-");
  const cityNameAr = getArabicCityName(citySlug);

  const faqs = [
    {
      question: `ما الفرق بين ${categoryA.name} و${categoryB.name} في ${cityNameAr}؟`,
      answer: `${categoryA.name} في ${cityNameAr} لديها ${statsA.totalProviders.toLocaleString("ar-AE")} منشأة مع رسوم استشارة ${statsA.gpFeeRange}. ${categoryB.name} لديها ${statsB.totalProviders.toLocaleString("ar-AE")} منشأة مع رسوم ${statsB.gpFeeRange}. المتوسط التقييمي: ${statsA.avgRating > 0 ? statsA.avgRating.toFixed(1) : "غ.م"} مقابل ${statsB.avgRating > 0 ? statsB.avgRating.toFixed(1) : "غ.م"} نجوم.`,
    },
    {
      question: `متى أختار ${categoryA.name} بدلاً من ${categoryB.name}؟`,
      answer: `${statsA.visitReason} للرعاية المتخصصة أو الإجراءات الجراحية. ${statsB.visitReason} للمشورة التخصصية الروتينية. تحقق دائماً من قبول التأمين قبل الحجز.`,
    },
    {
      question: `أيهما أرخص، ${categoryA.name} أم ${categoryB.name} في ${cityNameAr}؟`,
      answer: `تتراوح رسوم ${categoryA.name} بين ${statsA.gpFeeRange} مقابل ${statsB.gpFeeRange} لـ${categoryB.name} في ${cityNameAr}. التكلفة الفعلية تتفاوت حسب مزود الخدمة والتأمين وتعقيد الزيارة.`,
    },
  ];

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "مقارنة", url: `${base}/ar/directory/compare` },
          { name: `${categoryA.name} مقابل ${categoryB.name}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "مقارنة", href: "/ar/directory/compare" },
          { label: `${categoryA.name} مقابل ${categoryB.name}` },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Layers className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {categoryA.name} مقابل {categoryB.name} في {cityNameAr}
          </h1>
        </div>

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
            يوجد في {cityNameAr} {statsA.totalProviders.toLocaleString("ar-AE")} {categoryA.name} و
            {statsB.totalProviders.toLocaleString("ar-AE")} {categoryB.name}. متوسط التقييم:
            {" "}{statsA.avgRating > 0 ? statsA.avgRating.toFixed(1) : "غير متوفر"} نجوم مقابل{" "}
            {statsB.avgRating > 0 ? statsB.avgRating.toFixed(1) : "غير متوفر"} نجوم.
            الرسوم الاسترشادية: {statsA.gpFeeRange} مقابل {statsB.gpFeeRange}.
            البيانات من السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">مقارنة جنباً إلى جنب</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-black/[0.06] text-sm">
            <thead>
              <tr className="bg-[#1c1c1c] text-white">
                <th scope="col" className="text-right py-3 px-4 font-bold">المقياس</th>
                <th scope="col" className="text-right py-3 px-4 font-bold">{categoryA.name}</th>
                <th scope="col" className="text-right py-3 px-4 font-bold">{categoryB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">إجمالي المنشآت</td>
                <td className="py-3 px-4">{statsA.totalProviders.toLocaleString("ar-AE")}</td>
                <td className="py-3 px-4">{statsB.totalProviders.toLocaleString("ar-AE")}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">متوسط التقييم</td>
                <td className="py-3 px-4">{statsA.avgRating > 0 ? `${statsA.avgRating.toFixed(1)} ★` : "غير متوفر"}</td>
                <td className="py-3 px-4">{statsB.avgRating > 0 ? `${statsB.avgRating.toFixed(1)} ★` : "غير متوفر"}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">رسوم الاستشارة</td>
                <td className="py-3 px-4">{statsA.gpFeeRange}</td>
                <td className="py-3 px-4">{statsB.gpFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">متى تختاره</td>
                <td className="py-3 px-4 text-xs text-black/60">{statsA.visitReason}</td>
                <td className="py-3 px-4 text-xs text-black/60">{statsB.visitReason}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <FaqSection faqs={faqs} title={`${categoryA.name} مقابل ${categoryB.name} — أسئلة شائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40">
          البيانات من السجلات الحكومية الرسمية وخرائط Google، آخر تحقق مارس 2026.
        </p>
        <Link href={`/directory/compare/${(data as unknown as { slug: string }).slug || ""}`} className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English →
        </Link>
      </div>
    </div>
  );
}
