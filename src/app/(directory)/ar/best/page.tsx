import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCategories, getProviderCountByCity,
  getProviderCountByCategoryAndCity, getTopRatedProviders,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicCategoryName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const url = `${base}/ar/best`;

  const title = `${ar.bestProviders} في الإمارات — أفضل العيادات والمستشفيات والمتخصصين [٢٠٢٦]`;
  const description = `ابحث عن أفضل المستشفيات والعيادات وأطباء الأسنان والمتخصصين في جميع مدن الإمارات. مرتبة حسب تقييمات Google. +١٢,٠٠٠ مقدم خدمة من سجلات هيئة الصحة بدبي ودائرة الصحة ووزارة الصحة.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best`,
        "ar-AE": url,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function ArabicBestIndexPage() {
  const base = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();

  const cityDataRaw = await Promise.all(cities
    .map(async (city) => {
      const count = await getProviderCountByCity(city.slug);
      const topProviders = await getTopRatedProviders(city.slug, 1);
      const topProvider = topProviders[0];
      const catCounts = await Promise.all(categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug)));
      const catCount = catCounts.filter((c) => c > 0).length;
      return { ...city, count, topProvider, catCount };
    }));
  const cityData = cityDataRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const popularCombos: { citySlug: string; cityNameAr: string; catSlug: string; catNameAr: string; count: number }[] = [];
  for (const city of cities) {
    for (const cat of categories) {
      const count = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (count >= 5) {
        popularCombos.push({
          citySlug: city.slug,
          cityNameAr: getArabicCityName(city.slug),
          catSlug: cat.slug,
          catNameAr: getArabicCategoryName(cat.slug),
          count,
        });
      }
    }
  }
  popularCombos.sort((a, b) => b.count - a.count);
  const topCombos = popularCombos.slice(0, 16);

  const totalProviders = cityData.reduce((sum, c) => sum + c.count, 0);

  return (
    <div dir="rtl" className="font-arabic container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: ar.bestProviders },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
        <span>/</span>
        <span className="text-dark font-medium">{ar.bestProviders}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark mb-2">
          {ar.bestProviders} في الإمارات
        </h1>
        <p className="text-sm text-muted">
          {totalProviders.toLocaleString("ar-AE")} {ar.provider} عبر {cityData.length} مدن
          {" "}&middot; مرتبة حسب تقييم Google &middot; {ar.lastUpdated}
        </p>
      </div>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          يضم دليل الرعاية الصحية المفتوح في الإمارات {totalProviders.toLocaleString("ar-AE")} مقدم رعاية صحية عبر {cityData.length} مدن في الإمارات العربية المتحدة. اختر مدينة أدناه للعثور على أفضل المستشفيات والعيادات وأطباء الأسنان والمتخصصين — مرتبة حسب تقييم Google ومعتمدة من سجلات هيئة الصحة بدبي ودائرة الصحة ووزارة الصحة ووقاية المجتمع الرسمية. آخر تحقق مارس 2026.
        </p>
      </div>

      {/* City Grid */}
      <section className="mb-10">
        <div className="section-header">
          <h2>{ar.selectCity}</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cityData.map((city) => {
            const cityNameAr = getArabicCityName(city.slug);
            return (
              <Link
                key={city.slug}
                href={`/ar/best/${city.slug}`}
                className="block border border-light-200 p-4 hover:border-accent transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-dark group-hover:text-accent transition-colors">
                    {cityNameAr}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {city.count.toLocaleString("ar-AE")} {ar.provider}
                  </span>
                  <span className="text-muted">
                    {city.catCount} {ar.selectCategory}
                  </span>
                </div>
                {city.topProvider && Number(city.topProvider.googleRating) > 0 && (
                  <div className="border-t border-light-200 mt-3 pt-3">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                      الأعلى تقييماً
                    </p>
                    <p className="text-xs font-bold text-dark truncate">
                      {city.topProvider.name}
                    </p>
                    <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 mt-1 inline-block">
                      {city.topProvider.googleRating} ★
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Category x City Combos */}
      {topCombos.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>عمليات البحث الشائعة</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topCombos.map((combo) => (
              <Link
                key={`${combo.citySlug}-${combo.catSlug}`}
                href={`/ar/best/${combo.citySlug}/${combo.catSlug}`}
                className="block border border-light-200 p-3 hover:border-accent transition-colors group"
              >
                <p className="text-xs font-bold text-dark group-hover:text-accent transition-colors">
                  {ar.best} {combo.catNameAr} في {combo.cityNameAr}
                </p>
                <p className="text-[11px] text-accent font-bold mt-1">
                  {combo.count} {ar.provider}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Methodology */}
      <section className="mb-10">
        <div className="section-header">
          <h2>منهجية التصنيف</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>
        <div className="bg-light-50 border border-light-200 p-5">
          <p className="text-sm text-muted leading-relaxed mb-3">
            يرتب دليل الرعاية الصحية المفتوح في الإمارات مقدمي الخدمات حسب <strong>تقييم Google</strong> (الأعلى أولاً)، مع استخدام <strong>عدد المراجعات</strong> كمعيار فصل. يتم تضمين مقدمي الخدمات الذين يحملون تقييماً أعلى من صفر فقط.
          </p>
          <p className="text-sm text-muted leading-relaxed mb-3">
            جميع بيانات مقدمي الخدمات مصدرها ثلاث سجلات رسمية لهيئات الصحة الإماراتية: <strong>هيئة الصحة بدبي (DHA)</strong> و<strong>دائرة الصحة - أبوظبي (DOH)</strong> و<strong>وزارة الصحة ووقاية المجتمع (MOHAP)</strong>.
          </p>
          <p className="text-[11px] text-muted">
            لا تشكل هذه التصنيفات نصيحة طبية. يرجى التحقق من المؤهلات واستشارة مقدم الرعاية الصحية قبل اتخاذ القرارات.
          </p>
        </div>
      </section>

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link href="/best" className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
