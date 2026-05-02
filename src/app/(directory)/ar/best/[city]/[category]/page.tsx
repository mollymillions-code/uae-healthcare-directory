import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories, getCategoryBySlug,
  getProviders, getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import {
  breadcrumbSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 43200;

function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
}

interface Props {
  params: { city: string; category: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; category: string }[] = [];

  for (const city of cities) {
    for (const cat of categories) {
      const { providers } = await getProviders({
        citySlug: city.slug,
        categorySlug: cat.slug,
        sort: "rating",
        limit: 1,
      });
      const hasRated = providers.some((p) => Number(p.googleRating) > 0);
      if (hasRated) {
        params.push({ city: city.slug, category: cat.slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const count = await getProviderCountByCategoryAndCity(category.slug, city.slug);
  const base = getBaseUrl();
  const url = `${base}/ar/best/${city.slug}/${category.slug}`;
  const cityNameAr = getArabicCityName(city.slug);
  const catNameAr = getArabicCategoryName(category.slug);

  const title = `أفضل ${catNameAr} في ${cityNameAr} — أعلى ١٠ تقييماً [٢٠٢٦]`;
  const description = `قارن بين ${count} مقدم خدمة ${catNameAr} في ${cityNameAr}، الإمارات. مرتبة حسب تقييم Google. آخر تحديث مارس 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/${city.slug}/${category.slug}`,
        "ar-AE": url,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function ArabicBestCategoryInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const base = getBaseUrl();
  const regulator = getArabicRegulator(city.slug);
  const cityNameAr = getArabicCityName(city.slug);
  const catNameAr = getArabicCategoryName(category.slug);
  const totalCount = await getProviderCountByCategoryAndCity(category.slug, city.slug);

  const { providers: allProviders } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    limit: 99999,
  });
  const ranked = rankProviders(allProviders);

  if (ranked.length === 0) notFound();

  const top15 = ranked.slice(0, 15);
  const topProvider = ranked[0];

  // Other categories for cross-links
  const otherCategoriesRaw = await Promise.all(getCategories()
    .filter((c) => c.slug !== category.slug)
    .map(async (c) => ({
      ...c,
      count: await getProviderCountByCategoryAndCity(c.slug, city.slug),
    })));
  const otherCategories = otherCategoriesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div dir="rtl" className="font-arabic container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: ar.bestProviders, url: `${base}/ar/best` },
        { name: cityNameAr, url: `${base}/ar/best/${city.slug}` },
        { name: catNameAr },
      ])} />
      <JsonLd data={itemListSchema(`${ar.best} ${catNameAr} في ${cityNameAr}`, top15, city.name, base)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6 flex-wrap">
        <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
        <span>/</span>
        <Link href="/ar/best" className="hover:text-accent transition-colors">{ar.bestProviders}</Link>
        <span>/</span>
        <Link href={`/ar/best/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
        <span>/</span>
        <span className="text-dark font-medium">{catNameAr}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark mb-2">
          {ar.best} {catNameAr} في {cityNameAr}
        </h1>
        <p className="text-sm text-muted">
          أفضل {Math.min(ranked.length, 15)} من أصل {totalCount} {ar.provider}
          {" "}&middot; {regulator} &middot; {ar.lastUpdated}
        </p>
      </div>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، تضم {cityNameAr} {totalCount} مقدم خدمة في تخصص {catNameAr}. الأعلى تقييماً هو {topProvider.name} بتقييم {topProvider.googleRating} نجوم من Google بناءً على {topProvider.googleReviewCount?.toLocaleString("ar-AE")} مراجعة. الرعاية الصحية في {cityNameAr} تخضع لإشراف {regulator}. البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/ar/directory/${city.slug}/${category.slug}`}
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          جميع {catNameAr} في {cityNameAr}
        </Link>
        <Link
          href={`/ar/best/${city.slug}`}
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          جميع التخصصات في {cityNameAr}
        </Link>
      </div>

      {/* Ranked list */}
      <section className="mb-10">
        <div className="section-header">
          <h2>أفضل {catNameAr} في {cityNameAr}</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>
        <div className="space-y-0">
          {top15.map((provider, idx) => (
            <Link
              key={provider.id}
              href={`/ar/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
              className="flex items-start gap-4 py-4 px-2 border-b border-light-200 hover:bg-light-50 transition-colors group"
            >
              <span className="text-2xl font-bold text-accent/30 font-mono w-8 flex-shrink-0">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-dark group-hover:text-accent transition-colors">
                  {provider.name}
                </h3>
                {provider.address && (
                  <p className="text-xs text-muted mt-0.5 truncate">{provider.address}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {Number(provider.googleRating) > 0 && (
                    <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                      {provider.googleRating} ★
                    </span>
                  )}
                  {provider.googleReviewCount > 0 && (
                    <span className="text-xs text-muted">
                      {provider.googleReviewCount.toLocaleString("ar-AE")} {ar.reviews}
                    </span>
                  )}
                  {provider.phone && (
                    <span className="text-xs text-muted">{provider.phone}</span>
                  )}
                </div>
                {provider.shortDescription && (
                  <p className="text-sm text-muted mt-1 line-clamp-1">{provider.shortDescription}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Other categories in same city */}
      {otherCategories.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>{ar.best} تخصصات أخرى في {cityNameAr}</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ar/best/${city.slug}/${cat.slug}`}
                className="block border border-light-200 p-3 hover:border-accent transition-colors group"
              >
                <p className="text-xs font-bold text-dark group-hover:text-accent transition-colors">
                  {getArabicCategoryName(cat.slug)}
                </p>
                <p className="text-[11px] text-accent font-bold mt-1">
                  {cat.count} {ar.provider}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>تنويه:</strong> التصنيفات مبنية على تقييمات Google المتاحة للعموم وعدد المراجعات. لا تشكل توصية طبية. بيانات مقدمي الخدمات مصدرها سجلات {regulator} الرسمية. آخر تحقق مارس 2026.
        </p>
      </div>

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link href={`/best/${city.slug}/${category.slug}`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
