import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getCities,
  getCategories,
  getTopRatedProviders,
  getProviderCountByCity,
  getProviderCountByCategory,
} from "@/lib/data";
import { ar, getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";
import { ChevronLeft } from "lucide-react";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ar.siteName,
  description: ar.siteDescription,
  alternates: {
    canonical: `${getBaseUrl()}/ar`,
    languages: {
      "en-AE": getBaseUrl(),
      "ar-AE": `${getBaseUrl()}/ar`,
    },
  },
};

export default function ArabicHomePage() {
  const cities = getCities();
  const categories = getCategories();
  const topProviders = getTopRatedProviders(undefined, 8);
  const base = getBaseUrl();
  const totalProviders = cities.reduce((sum, c) => sum + getProviderCountByCity(c.slug), 0);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: ar.siteName,
        url: `${base}/ar`,
        description: ar.siteDescription,
        inLanguage: "ar",
        potentialAction: {
          "@type": "SearchAction",
          target: `${base}/ar/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Hero Grid */}
      <section className="bg-dark">
        <div className="container-tc py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-dark-500">
            {/* Main hero card */}
            <Link href="/ar/directory/dubai" className="lg:col-span-6 card-hero min-h-[420px] lg:min-h-[500px] group">
              <Image src="/images/cities/dubai.png" alt="الرعاية الصحية في دبي" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="overlay" />
              <div className="content">
                <span className="badge mb-3 w-fit">{getArabicCityName("dubai")}</span>
                <h1 className="text-hero text-white mb-2">
                  {ar.findHealthcare}
                </h1>
                <p className="text-white/70 text-base max-w-md">
                  +{totalProviders.toLocaleString("ar-AE")} {ar.verifiedProviders}. 8 مدن. 26 تخصصاً. {ar.dataSource}.
                </p>
              </div>
            </Link>

            {/* Right column — 2 stacked cards */}
            <div className="lg:col-span-3 flex flex-col gap-px">
              <Link href="/ar/directory/abu-dhabi" className="card-hero flex-1 min-h-[200px] lg:min-h-0 group">
                <Image src="/images/cities/abu-dhabi.png" alt="الرعاية الصحية في أبوظبي" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="overlay" />
                <div className="content">
                  <span className="badge mb-2 w-fit">{getArabicCityName("abu-dhabi")}</span>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {getProviderCountByCity("abu-dhabi")} {ar.providers} في {getArabicCityName("abu-dhabi")}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">{getArabicRegulator("abu-dhabi")}</p>
                </div>
              </Link>
              <Link href="/ar/directory/sharjah" className="card-hero flex-1 min-h-[200px] lg:min-h-0 group">
                <Image src="/images/cities/sharjah.png" alt="الرعاية الصحية في الشارقة" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="overlay" />
                <div className="content">
                  <span className="badge mb-2 w-fit">{getArabicCityName("sharjah")}</span>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {getProviderCountByCity("sharjah").toLocaleString("ar-AE")} {ar.providers} في {getArabicCityName("sharjah")}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">{getArabicRegulator("sharjah")}</p>
                </div>
              </Link>
            </div>

            {/* Far right — headline list */}
            <div className="lg:col-span-3 bg-dark-800 p-5 flex flex-col">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">{ar.allEmirates}</h3>
              {cities.map((city) => {
                const count = getProviderCountByCity(city.slug);
                return (
                  <Link
                    key={city.slug}
                    href={`/ar/directory/${city.slug}`}
                    className="headline-item text-white/80 hover:text-accent transition-colors text-sm"
                  >
                    <span className="flex-1 font-medium">{getArabicCityName(city.slug)}</span>
                    <span className="text-white/40 text-xs font-mono">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Browse by City */}
      <section className="container-tc py-10">
        <div className="section-header">
          <h2>{ar.browseByCity}</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cities.map((city) => {
            const count = getProviderCountByCity(city.slug);
            const hasImage = ["dubai", "abu-dhabi", "sharjah", "ajman", "al-ain", "ras-al-khaimah", "fujairah", "umm-al-quwain"].includes(city.slug);
            return (
              <Link
                key={city.slug}
                href={`/ar/directory/${city.slug}`}
                className="group card-hero min-h-[160px] sm:min-h-[200px]"
              >
                {hasImage && (
                  <Image
                    src={`/images/cities/${city.slug}.png`}
                    alt={getArabicCityName(city.slug)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="overlay" />
                <div className="content">
                  <span className="badge mb-2 w-fit text-[10px]">{count} {ar.providers}</span>
                  <h3 className="text-lg font-bold text-white">{getArabicCityName(city.slug)}</h3>
                  {city.emirate !== city.name && (
                    <p className="text-white/50 text-xs">{city.emirate}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Green banner */}
      <section className="bg-accent py-10">
        <div className="container-tc text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {ar.sourceOfTruth}
          </h2>
          <p className="text-white/80 text-base max-w-2xl mx-auto">
            +{totalProviders.toLocaleString("ar-AE")} {ar.verifiedProviders} من سجلات هيئة الصحة بدبي ودائرة الصحة أبوظبي ووزارة الصحة ووقاية المجتمع الرسمية. {ar.freeOpenNoPaywall}.
          </p>
        </div>
      </section>

      {/* Browse by Specialty */}
      <section className="container-tc py-10">
        <div className="section-header">
          <h2>{ar.specialties}</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {categories.map((cat) => {
            const count = getProviderCountByCategory(cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/ar/directory/dubai/${cat.slug}`}
                className="flex items-center justify-between py-3 px-2 border-b border-light-200 hover:bg-light-50 transition-colors group"
              >
                <span className="text-sm font-medium text-dark group-hover:text-accent transition-colors">
                  {getArabicCategoryName(cat.slug)}
                </span>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <span className="text-xs text-muted font-mono">{count}</span>
                  )}
                  <ChevronLeft className="h-3.5 w-3.5 text-light-300 group-hover:text-accent transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top Rated */}
      <section className="bg-light-50 py-10">
        <div className="container-tc">
          <div className="section-header">
            <h2>{ar.topRated}</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {topProviders.map((p, idx) => (
              <Link
                key={p.id}
                href={`/ar/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                className="flex items-start gap-4 py-4 px-2 border-b border-light-200 hover:bg-white transition-colors group"
              >
                <span className="text-2xl font-bold text-accent/30 font-mono w-8 flex-shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-dark group-hover:text-accent transition-colors truncate">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5 truncate">{p.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {Number(p.googleRating) > 0 && (
                      <span className="text-xs font-bold text-accent">{p.googleRating} ★</span>
                    )}
                    {p.phone && (
                      <span className="text-xs text-muted">{p.phone}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AEO answer block */}
      <section className="container-tc py-10">
        <div className="answer-block" data-answer-block="true">
          <p className="text-dark/70 leading-relaxed text-sm">
            يضم دليل الرعاية الصحية في الإمارات أكثر من {totalProviders.toLocaleString("ar-AE")} مقدم رعاية صحية مرخص في جميع الإمارات السبع: دبي وأبوظبي والشارقة وعجمان والعين ورأس الخيمة والفجيرة وأم القيوين. تخضع المنشآت الصحية لثلاث جهات تنظيمية — هيئة الصحة بدبي لإمارة دبي، ودائرة الصحة لأبوظبي والعين، ووزارة الصحة ووقاية المجتمع للشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين. يغطي الدليل 26 تخصصاً طبياً تشمل المستشفيات وعيادات الأسنان والأمراض الجلدية وأمراض القلب وطب العيون والصحة النفسية والصيدليات وطب الأطفال، مع تفاصيل اتصال موثقة وتقييمات Google من مراجعات المرضى وخطط التأمين المقبولة وساعات العمل والاتجاهات. جميع البيانات مصدرها السجلات الحكومية الرسمية للمنشآت المرخصة. آخر تحقق مارس 2026.
          </p>
        </div>
      </section>

      {/* Language Switch */}
      <section className="container-tc pb-16 text-center">
        <Link href="/" className="text-accent text-sm hover:underline">
          Switch to English / التبديل إلى الإنجليزية
        </Link>
      </section>
    </>
  );
}
