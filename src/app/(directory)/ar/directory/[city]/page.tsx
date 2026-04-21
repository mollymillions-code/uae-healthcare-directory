import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCityBySlug, getCities, getCategories, getAreasByCity,
  getTopRatedProviders, getProviderCountByCategoryAndCity,
  getProviderCountByCity, getProviderCountByAreaAndCity,
} from "@/lib/data";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props { params: { city: string } }

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const count = await safe(getProviderCountByCity(city.slug), 0, "ar.city.metaCount");
  const cityNameAr = getArabicCityName(city.slug);
  const base = getBaseUrl();
  const year = new Date().getFullYear();
  return {
    title: `+${count} مقدم رعاية صحية في ${cityNameAr} — قارن [${year}]`,
    description: `قارن بين +${count} مستشفى وعيادة وطبيب أسنان في ${cityNameAr}. تقييمات، مراجعات، تأمين مقبول، مواعيد واتجاهات. دليل مجاني.`,
    alternates: {
      canonical: `${base}/ar/directory/${city.slug}`,
      languages: {
        "en-AE": `${base}/directory/${city.slug}`,
        "ar-AE": `${base}/ar/directory/${city.slug}`,
        "x-default": `${base}/directory/${city.slug}`,
      },
    },
  };
}

export default async function ArabicCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const categories = getCategories();
  const areas = getAreasByCity(city.slug);
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const regulator = getArabicRegulator(city.slug);

  // Pre-fetch all async data in parallel (wrapped in safe())
  const [topProviders, total, catCounts, areaCounts] = await Promise.all([
    safe(getTopRatedProviders(city.slug, 6), [] as Awaited<ReturnType<typeof getTopRatedProviders>>, "ar.city.topProviders"),
    safe(getProviderCountByCity(city.slug), 0, "ar.city.total"),
    safe(Promise.all(categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug))), categories.map(() => 0) as number[], "ar.city.catCounts"),
    safe(Promise.all(areas.map((area) => getProviderCountByAreaAndCity(area.slug, city.slug))), areas.map(() => 0) as number[], "ar.city.areaCounts"),
  ]);
  const catCountMap = Object.fromEntries(categories.map((cat, i) => [cat.slug, catCounts[i]]));
  const areaCountMap = Object.fromEntries(areas.map((area, i) => [area.slug, areaCounts[i]]));

  return (
    <div dir="rtl" className="font-arabic container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
        <span>/</span>
        <span className="text-dark font-medium">{cityNameAr}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">
          {ar.healthcareProviders} في {cityNameAr}
        </h1>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            وفقاً لدليل الرعاية الصحية في الإمارات، اعتباراً من مارس 2026، تضم {cityNameAr} أكثر من {total} مقدم رعاية صحية مسجل عبر {categories.length} تخصصاً طبياً و{areas.length} حياً.
            {" "}الرعاية الصحية في {cityNameAr} تخضع لإشراف {regulator}.
            {" "}تتضمن جميع القوائم تفاصيل اتصال موثقة وتقييمات Google من مراجعات المرضى الفعلية وخطط التأمين المقبولة وساعات العمل والاتجاهات.
            البيانات مصدرها السجلات الحكومية الرسمية للمنشآت المرخصة. آخر تحقق مارس 2026.
          </p>
        </div>
      </div>

      {/* Categories */}
      <section className="mb-10">
        <div className="section-header">
          <h2>{ar.specialties} في {cityNameAr}</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const count = catCountMap[cat.slug] ?? 0;
            return (
              <Link
                key={cat.slug}
                href={`/ar/directory/${city.slug}/${cat.slug}`}
                className="flex items-center justify-between bg-light-50 border border-black/[0.06] px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"
              >
                <span className="font-medium">{getArabicCategoryName(cat.slug)}</span>
                {count > 0 && (
                  <span className="text-muted text-xs">{count}</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Areas / Neighborhoods */}
      {areas.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>{ar.neighborhoods} في {cityNameAr}</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {areas.map((area) => {
              const count = areaCountMap[area.slug] ?? 0;
              return (
                <Link
                  key={area.slug}
                  href={`/ar/directory/${city.slug}/${area.slug}`}
                  className="flex items-center justify-between bg-light-50 border border-black/[0.06] px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"
                >
                  <span className="font-medium">{area.nameAr || area.name}</span>
                  {count > 0 && (
                    <span className="text-muted text-xs">
                      {count} {count === 1 ? ar.provider : ar.providerPlural}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Rated */}
      {topProviders.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>{ar.topRated} في {cityNameAr}</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {topProviders.map((p, i) => (
              <div key={p.id} className="article-row">
                <span className="text-2xl font-bold text-accent leading-none mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/ar/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                    className="font-bold text-dark hover:text-accent transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.googleRating && (
                    <p className="text-xs text-muted mt-0.5">
                      {p.googleRating}/5 {ar.stars} · {p.googleReviewCount?.toLocaleString("ar-AE")} {ar.reviews}
                    </p>
                  )}
                  {p.shortDescription && (
                    <p className="text-sm text-muted mt-1 line-clamp-1">{p.shortDescription}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link href={`/directory/${city.slug}`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
