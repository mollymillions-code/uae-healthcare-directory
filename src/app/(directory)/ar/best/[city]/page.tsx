import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories,
  getProviders, getProviderCountByCategoryAndCity, getProviderCountByCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 43200;

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
  const url = `${base}/ar/best/${city.slug}`;
  const cityNameAr = getArabicCityName(city.slug);

  const title = `${ar.bestProviders} في ${cityNameAr} — أفضل العيادات والمستشفيات والمتخصصين [٢٠٢٦]`;
  const description = `ابحث عن أفضل مقدمي الرعاية الصحية في ${cityNameAr}، الإمارات. ${totalCount} مقدم خدمة مرتب حسب تقييم Google عبر ${getCategories().length} تخصصاً. آخر تحديث مارس 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/${city.slug}`,
        "ar-AE": url,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function ArabicBestInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const regulator = getArabicRegulator(city.slug);
  const cityNameAr = getArabicCityName(city.slug);
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

  const sortedCategories = [...categoryData].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div dir="rtl" className="font-arabic container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: ar.bestProviders, url: `${base}/ar/best` },
        { name: cityNameAr },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
        <span>/</span>
        <Link href="/ar/best" className="hover:text-accent transition-colors">{ar.bestProviders}</Link>
        <span>/</span>
        <span className="text-dark font-medium">{cityNameAr}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark mb-2">
          {ar.bestProviders} في {cityNameAr}
        </h1>
        <p className="text-sm text-muted">
          {totalCount.toLocaleString("ar-AE")} {ar.provider} عبر {categoryData.length} تخصصاً
          {" "}&middot; {regulator} &middot; {ar.lastUpdated}
        </p>
      </div>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          يضم دليل الرعاية الصحية المفتوح في الإمارات {totalCount.toLocaleString("ar-AE")} مقدم رعاية صحية في {cityNameAr} عبر {categoryData.length} تخصصاً. ستجد أدناه أعلى مقدم خدمة تقييماً في كل فئة، مرتباً حسب تقييم Google وعدد المراجعات. جميع مقدمي الخدمات مرخصون من {regulator}. البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/ar/directory/${city.slug}`}
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          دليل {cityNameAr} الكامل
        </Link>
        <Link
          href="/ar/best"
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          {ar.allEmirates}
        </Link>
      </div>

      {/* Category Grid */}
      <section className="mb-10">
        <div className="section-header">
          <h2>{ar.topRated} حسب التخصص</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((cat) => {
            const catNameAr = getArabicCategoryName(cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/ar/best/${city.slug}/${cat.slug}`}
                className="block border border-light-200 p-4 hover:border-accent transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                    {catNameAr}
                  </h3>
                  <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                    {cat.count}
                  </span>
                </div>

                {cat.topProvider ? (
                  <div className="border-t border-light-200 pt-3">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                      #١ الأعلى تقييماً
                    </p>
                    <p className="text-xs font-bold text-dark truncate">
                      {cat.topProvider.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {Number(cat.topProvider.googleRating) > 0 && (
                        <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                          {cat.topProvider.googleRating} ★
                        </span>
                      )}
                      {cat.topProvider.googleReviewCount > 0 && (
                        <span className="text-[11px] text-muted">
                          {cat.topProvider.googleReviewCount.toLocaleString("ar-AE")} {ar.reviews}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-light-200 pt-3">
                    <p className="text-xs text-muted">{cat.count} {ar.provider}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>{ar.bestProviders} في مدن أخرى</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/ar/best/${c.slug}`}
                className="block border border-light-200 p-3 hover:border-accent transition-colors group text-center"
              >
                <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                  {getArabicCityName(c.slug)}
                </p>
                <p className="text-xs text-accent font-bold mt-1">
                  {c.totalProviders.toLocaleString("ar-AE")} {ar.provider}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>تنويه:</strong> التصنيفات مبنية على تقييمات Google المتاحة للعموم وعدد المراجعات. لا تشكل توصية طبية. بيانات مقدمي الخدمات مصدرها سجلات {regulator} الرسمية ودليل الرعاية الصحية المفتوح في الإمارات، آخر تحقق مارس 2026. يرجى التأكد من التفاصيل مباشرة مع مقدم الخدمة.
        </p>
      </div>

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link href={`/best/${city.slug}`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
