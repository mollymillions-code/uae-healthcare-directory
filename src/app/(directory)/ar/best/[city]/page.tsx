import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getCities, getCityBySlug, getCategories,
  getProviders, getProviderCountByCategoryAndCity, getProviderCountByCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

async function getTopRatedForCategory(
  citySlug: string,
  categorySlug: string,
): Promise<LocalProvider | undefined> {
  const { providers } = await getProviders({
    citySlug,
    categorySlug,
    sort: "rating",
    limit: 10,
  });
  return providers
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const rd = Number(b.googleRating) - Number(a.googleRating);
      if (rd !== 0) return rd;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })[0];
}

interface Props {
  params: { city: string };
}

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const totalCount = await getProviderCountByCity(city.slug);
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const url = `${base}/ar/best/${city.slug}`;

  const title = `أفضل الرعاية الصحية في ${cityNameAr} — أعلى العيادات والمستشفيات والمتخصصين تقييماً [2026]`;
  const description = `ابحث عن أفضل مقدمي الرعاية الصحية في ${cityNameAr}، الإمارات. ${totalCount.toLocaleString("ar-AE")} منشأة مرتبة حسب تقييم Google عبر ${getCategories().length} تخصص. محدّث مارس 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/${city.slug}`,
        "ar-AE": url,
        "x-default": `${base}/best/${city.slug}`,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function ArBestInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const regulatorAr = getArabicRegulator(city.slug);
  const totalCount = await getProviderCountByCity(city.slug);
  const categories = getCategories();

  const categoryDataRaw = await Promise.all(categories
    .map(async (cat) => {
      const count = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (count === 0) return null;
      const topProvider = await getTopRatedForCategory(city.slug, cat.slug);
      return { ...cat, count, topProvider };
    }));
  const categoryData = categoryDataRaw.filter(Boolean) as {
    slug: string;
    name: string;
    icon: string;
    sortOrder: number;
    count: number;
    topProvider: LocalProvider | undefined;
  }[];

  const otherCitiesRaw = await Promise.all(getCities()
    .filter((c) => c.slug !== city.slug)
    .map(async (c) => ({
      ...c,
      totalProviders: await getProviderCountByCity(c.slug),
    })));
  const otherCities = otherCitiesRaw
    .filter((c) => c.totalProviders > 0)
    .sort((a, b) => b.totalProviders - a.totalProviders);

  const faqs = [
    {
      question: `ما هي أفضل المستشفيات في ${cityNameAr}؟`,
      answer: `يُصنِّف دليل الإمارات المفتوح للرعاية الصحية المستشفيات في ${cityNameAr} حسب تقييم Google ومراجعات المرضى. تُشرف على الرعاية الصحية في ${cityNameAr} جهة ${regulatorAr}.`,
    },
    {
      question: `كم عدد مقدمي الرعاية الصحية في ${cityNameAr}؟`,
      answer: `يوجد ${totalCount.toLocaleString("ar-AE")} مقدم رعاية صحية مُدرج في ${cityNameAr} عبر ${categoryData.length} تخصص، من بينها المستشفيات والعيادات وعيادات الأسنان ومراكز المتخصصين. جميع البيانات مصدرها السجلات الحكومية الرسمية.`,
    },
    {
      question: `كيف يُحدَّد "أفضل" مقدمي الرعاية الصحية في ${cityNameAr}؟`,
      answer: `يُصنَّف مقدمو الخدمات حسب تقييم Google (الأعلى أولاً)، مع استخدام عدد المراجعات كمعيار ثانوي. يُدرج فقط مقدمو الخدمات الحاصلون على تقييم أعلى من صفر. البيانات مصدرها سجلات ${regulatorAr} ودليل الإمارات المفتوح للرعاية الصحية.`,
    },
    {
      question: `أي تخصص يضم أكبر عدد من مقدمي الخدمات في ${cityNameAr}؟`,
      answer: categoryData.length > 0
        ? `أكبر تخصص في ${cityNameAr} هو ${getArabicCategoryName(categoryData.sort((a, b) => b.count - a.count)[0].slug)} بـ ${categoryData[0].count.toLocaleString("ar-AE")} منشأة.`
        : `تصفح التخصصات أدناه لمعرفة أعداد مقدمي الخدمات لكل تخصص في ${cityNameAr}.`,
    },
    {
      question: `هل الرعاية الصحية في ${cityNameAr} خاضعة للتنظيم؟`,
      answer: `نعم. جميع مقدمي الرعاية الصحية في ${cityNameAr} مرخصون ومُنظَّمون من قِبل ${regulatorAr}. يستقي دليل الإمارات المفتوح للرعاية الصحية بياناته من السجلات الحكومية الرسمية لضمان الدقة.`,
    },
  ];

  const sortedCategories = [...categoryData].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "الإمارات", url: base },
        { name: "أفضل", url: `${base}/ar/best` },
        { name: cityNameAr },
      ])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "الإمارات", href: "/ar" },
        { label: "أفضل", href: "/ar/best" },
        { label: cityNameAr },
      ]} />

      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أفضل الرعاية الصحية في {cityNameAr}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalCount.toLocaleString("ar-AE")} منشأة في {categoryData.length} تخصص
          {" "}· {regulatorAr} · محدّث مارس 2026
        </p>
      </div>

      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
          يضم دليل الإمارات المفتوح للرعاية الصحية {totalCount.toLocaleString("ar-AE")} منشأة صحية
          في {cityNameAr} عبر {categoryData.length} تخصص. ستجد أدناه أعلى مقدمي الخدمات تقييماً
          في كل فئة، مرتبين حسب تقييم Google وعدد المراجعات. جميع مقدمي الخدمات مرخصون من قِبل
          {regulatorAr}. البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/ar/directory/${city.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          الدليل الكامل لـ {cityNameAr}
        </Link>
        <Link
          href="/ar/best"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          جميع المدن
        </Link>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">الأعلى تقييماً حسب التخصص</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/ar/best/${city.slug}/${cat.slug}`}
              className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {getArabicCategoryName(cat.slug)}
                </h3>
                <span className="bg-[#006828] text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                  {cat.count.toLocaleString("ar-AE")}
                </span>
              </div>

              {cat.topProvider ? (
                <div className="border-t border-black/[0.06] pt-3">
                  <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">
                    #1 الأعلى تقييماً
                  </p>
                  <p className="text-xs font-bold text-[#1c1c1c] truncate">
                    {cat.topProvider.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {Number(cat.topProvider.googleRating) > 0 && (
                      <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {cat.topProvider.googleRating} ★
                      </span>
                    )}
                    {cat.topProvider.googleReviewCount > 0 && (
                      <span className="text-[11px] text-black/40">
                        {cat.topProvider.googleReviewCount.toLocaleString("ar-AE")} مراجعة
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t border-black/[0.06] pt-3">
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">{cat.count.toLocaleString("ar-AE")} منشأة مُدرجة</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      <FaqSection
        faqs={faqs}
        title={`أفضل الرعاية الصحية في ${cityNameAr} — أسئلة شائعة`}
      />

      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">أفضل الرعاية الصحية في مدن أخرى</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/ar/best/${c.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {getArabicCityName(c.slug)}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.totalProviders.toLocaleString("ar-AE")} منشأة
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> التصنيفات مبنية على تقييمات Google وعدد المراجعات المتاحة للعموم
          ولا تُعدّ توصية طبية. بيانات مقدمي الخدمات مصدرها سجلات {regulatorAr} الرسمية،
          آخر تحقق مارس 2026. تحقق دائماً من التفاصيل مع مقدم الخدمة مباشرة.
        </p>
        <Link href={`/best/${city.slug}`} className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English →
        </Link>
      </div>
    </div>
  );
}
