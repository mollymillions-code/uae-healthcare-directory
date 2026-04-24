import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { ProviderListPaginated } from "@/components/directory/ProviderListPaginated";
import { StarRating } from "@/components/shared/StarRating";
import dynamic from "next/dynamic";
const GoogleMapEmbed = dynamic(() => import("@/components/maps/GoogleMapEmbed").then(mod => mod.GoogleMapEmbed), { ssr: false, loading: () => <div className="w-full h-64 bg-light-100 animate-pulse" /> });
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCategories,
  getAreaBySlug, getAreasByCity,
  getProviders, getTopRatedProviders,
} from "@/lib/data";
import {
  medicalOrganizationSchema, breadcrumbSchema,
  itemListSchema, speakableSchema,
  truncateTitle, truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getCategoryImageUrl, hasValidHours, formatVerifiedDateAr,
  resolveSegments,
} from "@/lib/directory-utils";
import {
  collectProviderImageUrls,
  getPrimaryProviderImageUrl,
  isUsableProviderImageUrl,
} from "@/lib/media/provider-images";
import { ar, getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";
import Image from "next/image";
import {
  MapPin, Phone, Globe, Clock, Shield, Languages, Stethoscope,
  CheckCircle, ExternalLink, Calendar,
  Accessibility, Image as ImageIcon, Star, Quote,
} from "lucide-react";

// ISR: pages built on first visit, cached for 6 hours. No SSG pre-rendering.
export const revalidate = 21600;
export const dynamicParams = true;

interface Props {
  params: { city: string; segments: string[] };
  searchParams?: { page?: string };
}

// Matches the English LIST_PAGE_SIZE so pagination stays symmetric across locales.
const LIST_PAGE_SIZE = 20;

function parsePage(searchParams: Props["searchParams"]): number {
  const raw = Number(searchParams?.page ?? "1");
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

// No generateStaticParams — pages render on-demand via ISR.

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) return {};
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const page = parsePage(searchParams);
  const pageSuffix = page > 1 ? `?page=${page}` : "";
  const titlePageSuffix = page > 1 ? ` | صفحة ${page}` : "";

  switch (resolved.type) {
    case "city-category": {
      const catNameAr = getArabicCategoryName(resolved.category.slug);
      const { total } = await getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, limit: 1 });
      const year = new Date().getFullYear();
      const enBase = `${base}/directory/${city.slug}/${resolved.category.slug}`;
      const arBase = `${base}/ar/directory/${city.slug}/${resolved.category.slug}`;
      const arCanonical = `${arBase}${pageSuffix}`;
      return {
        title: truncateTitle(`${total} أفضل ${catNameAr} في ${cityNameAr} [${year}]${titlePageSuffix}`, 50),
        description: truncateDescription(`قارن ${total} ${catNameAr} في ${cityNameAr}. تقييمات، مراجعات، تأمين مقبول، مواعيد واتجاهات. مرخص. دليل مجاني.`, 145),
        alternates: {
          canonical: arCanonical,
          languages: {
            "en-AE": `${enBase}${pageSuffix}`,
            "ar-AE": arCanonical,
            "x-default": `${enBase}${pageSuffix}`,
          },
        },
        openGraph: {
          title: `${catNameAr} في ${cityNameAr}${titlePageSuffix}`,
          description: `${total} ${catNameAr} في ${cityNameAr}. تصفح القوائم المعتمدة.`,
          type: 'website',
          locale: 'ar_AE',
          siteName: 'دليل الرعاية الصحية الإماراتي المفتوح',
          url: arCanonical,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${catNameAr} في ${cityNameAr}` }],
        },
      };
    }
    case "city-area": {
      const areaNameAr = resolved.area.nameAr || resolved.area.name;
      const { total } = await getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, limit: 1 });
      const year = new Date().getFullYear();
      return {
        title: truncateTitle(`${total} مقدم رعاية صحية في ${areaNameAr}، ${cityNameAr} [${year}]`, 50),
        description: truncateDescription(`قارن ${total} مقدم رعاية صحية في ${areaNameAr}، ${cityNameAr}. مستشفيات، عيادات ومتخصصون. تقييمات، تأمين واتجاهات. مجاني.`, 145),
        alternates: {
          canonical: `${base}/ar/directory/${city.slug}/${resolved.area.slug}`,
          languages: {
            "en-AE": `${base}/directory/${city.slug}/${resolved.area.slug}`,
            "ar-AE": `${base}/ar/directory/${city.slug}/${resolved.area.slug}`,
            "x-default": `${base}/directory/${city.slug}/${resolved.area.slug}`,
          },
        },
        openGraph: {
          title: `الرعاية الصحية في ${areaNameAr}، ${cityNameAr}`,
          description: `${total} مقدم رعاية صحية في ${areaNameAr}، ${cityNameAr}. تصفح القوائم المعتمدة.`,
          type: 'website',
          locale: 'ar_AE',
          siteName: 'دليل الرعاية الصحية الإماراتي المفتوح',
          url: `${base}/ar/directory/${city.slug}/${resolved.area.slug}`,
          images: [{ url: `${base}/images/categories/clinics.webp`, width: 1200, height: 630, alt: `الرعاية الصحية في ${areaNameAr}، ${cityNameAr}` }],
        },
      };
    }
    case "area-category": {
      const catNameAr = getArabicCategoryName(resolved.category.slug);
      const areaNameAr = resolved.area.nameAr || resolved.area.name;
      const { total } = await getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, categorySlug: resolved.category.slug, limit: 1 });
      const year = new Date().getFullYear();
      return {
        title: total > 0
          ? truncateTitle(`${total} ${catNameAr} في ${areaNameAr}، ${cityNameAr} [${year}]`, 50)
          : truncateTitle(`${catNameAr} في ${areaNameAr}، ${cityNameAr}`, 50),
        description: total > 0
          ? truncateDescription(`قارن ${total} ${catNameAr} في ${areaNameAr}، ${cityNameAr}. تقييمات، مراجعات، تأمين ومواعيد. دليل مجاني معتمد.`, 145)
          : truncateDescription(`تبحث عن ${catNameAr} في ${areaNameAr}، ${cityNameAr}؟ تصفح جميع ${catNameAr} في ${cityNameAr} بدلاً من ذلك.`, 145),
        ...(total === 0 ? { robots: { index: false, follow: true } } : {}),
        alternates: {
          canonical: `${base}/ar/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
          languages: {
            "en-AE": `${base}/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
            "ar-AE": `${base}/ar/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
            "x-default": `${base}/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
          },
        },
        openGraph: {
          title: `${catNameAr} في ${areaNameAr}، ${cityNameAr}`,
          description: `${total} ${catNameAr} في ${areaNameAr}، ${cityNameAr}. تصفح القوائم المعتمدة.`,
          type: 'website',
          locale: 'ar_AE',
          siteName: 'دليل الرعاية الصحية الإماراتي المفتوح',
          url: `${base}/ar/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${catNameAr} في ${areaNameAr}، ${cityNameAr}` }],
        },
      };
    }
    case "listing": {
      const catNameAr = getArabicCategoryName(resolved.category.slug);
      const enListingUrl = `${base}/directory/${city.slug}/${resolved.category.slug}/${resolved.provider.slug}`;
      const arListingUrl = `${base}/ar/directory/${city.slug}/${resolved.category.slug}/${resolved.provider.slug}`;
      const providerOgImage =
        getPrimaryProviderImageUrl(resolved.provider, { absoluteOnly: true }) ??
        getCategoryImageUrl(resolved.category.slug, base);

      // --- Arabic SEO title: hard 60-char cap, high-intent modifiers ---
      const arMaxTitleLen = 60;
      const arSuffix = "";
      const arIdealTitle = `${resolved.provider.name}، ${cityNameAr} — تقييمات وأطباء وتأمين`;
      let arSeoTitle: string;
      if ((arIdealTitle + arSuffix).length <= arMaxTitleLen) {
        arSeoTitle = arIdealTitle + arSuffix;
      } else {
        const arShortTitle = `${resolved.provider.name} — تقييمات وتأمين`;
        if ((arShortTitle + arSuffix).length <= arMaxTitleLen) {
          arSeoTitle = arShortTitle + arSuffix;
        } else {
          const arAvailable = arMaxTitleLen - " — تقييمات وتأمين".length;
          arSeoTitle = resolved.provider.name.slice(0, arAvailable).trim() + " — تقييمات وتأمين" + arSuffix;
        }
      }

      // --- Arabic SEO description: max ~155 chars, packed with structured data ---
      const arDescParts: string[] = [];
      const arProv = resolved.provider;
      if (arProv.googleRating && Number(arProv.googleRating) > 0) {
        const arReviewBit = arProv.googleReviewCount ? ` (${arProv.googleReviewCount} تقييم)` : "";
        arDescParts.push(`★ ${arProv.googleRating}/5${arReviewBit}`);
      }
      if (arProv.services && arProv.services.length > 0) {
        arDescParts.push(`الخدمات: ${arProv.services.slice(0, 3).join("، ")}`);
      }
      if (arProv.insurance && arProv.insurance.length > 0) {
        arDescParts.push(`التأمين: ${arProv.insurance.slice(0, 3).join("، ")}`);
      }
      if (arProv.phone) {
        arDescParts.push("☎ معلومات الاتصال متاحة");
      }
      const arDescBody = arDescParts.length > 0 ? arDescParts.join(". ") + "." : (arProv.shortDescription || "");
      const arSeoDesc = truncateDescription(`${arProv.name}: ${arDescBody} الساعات والاتجاهات على Zavis.`, 145);

      return {
        title: arSeoTitle,
        description: arSeoDesc,
        alternates: {
          canonical: arListingUrl,
          languages: {
            "en-AE": enListingUrl,
            "ar-AE": arListingUrl,
            "x-default": enListingUrl,
          },
        },
        openGraph: {
          title: `${resolved.provider.name} | ${catNameAr} في ${cityNameAr}`,
          description: resolved.provider.shortDescription || '',
          type: 'website',
          locale: 'ar_AE',
          siteName: 'دليل الرعاية الصحية الإماراتي المفتوح',
          url: arListingUrl,
          images: [{ url: providerOgImage, width: 1200, height: 630, alt: `${resolved.provider.name} — ${catNameAr} في ${cityNameAr}` }],
        },
      };
    }
    default:
      return {};
  }
}

export default async function ArabicCatchAllPage({ params, searchParams }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();

  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const currentPage = parsePage(searchParams);

  // --- City + Category Page ---
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const catNameAr = getArabicCategoryName(category.slug);
    // SSR pagination (Item 0.5) — mirrors the English catch-all.
    const { providers, total, totalPages } = await getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      page: currentPage,
      limit: LIST_PAGE_SIZE,
      sort: "rating",
    });
    if (total > 0 && currentPage > totalPages) notFound();
    const areas = getAreasByCity(city.slug);
    const regulator = getArabicRegulator(city.slug);

    return (
      <div dir="rtl" className="font-arabic container-tc py-8">
        <JsonLd data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
          { name: catNameAr },
        ])} />
        <JsonLd data={itemListSchema(`${catNameAr} في ${cityNameAr}`, providers, city.name, base)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-6">
          <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
          <span>/</span>
          <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
          <span>/</span>
          <span className="text-dark font-medium">{catNameAr}</span>
        </nav>

        <h1 className="text-3xl font-bold text-dark mb-2">{catNameAr} في {cityNameAr}</h1>
        <p className="text-sm text-muted mb-4">{total} {ar.provider} معتمد · {ar.lastUpdated}</p>

        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            وفقاً لدليل الرعاية الصحية في الإمارات، تضم {cityNameAr} {total} مقدم خدمة في تخصص {catNameAr}، مسجلين لدى {regulator}. تشمل القوائم تفاصيل الاتصال الموثقة وتقييمات Google والتأمين المقبول وساعات العمل. البيانات مصدرها السجلات الحكومية الرسمية. آخر تحقق مارس 2026.
          </p>
        </div>

        {areas.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-dark mb-2">{ar.browseByArea}:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {areas.map((a) => (
                <Link
                  key={a.slug}
                  href={`/ar/directory/${city.slug}/${a.slug}/${category.slug}`}
                  className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-black/[0.06] hover:border-accent hover:bg-accent-muted transition-colors"
                >
                  {a.nameAr || a.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <ProviderListPaginated
          providers={providers}
          currentPage={currentPage}
          totalCount={total}
          pageSize={LIST_PAGE_SIZE}
          baseUrl={`/ar/directory/${city.slug}/${category.slug}`}
          emptyMessage={`${ar.noProvidersFound} ${catNameAr} في ${cityNameAr}.`}
          basePath="/ar/directory"
        />

        {/* Cross-link: Other specialties in this city */}
        {(() => {
          const allCategories = getCategories();
          const siblings = allCategories.filter((c) => c.slug !== category.slug).slice(0, 8);
          if (siblings.length === 0) return null;
          return (
            <section className="mt-10 mb-4">
              <div className="flex items-center gap-3 mb-4 border-b-2 border-dark pb-3">
                <h2 className="text-xl font-bold text-dark">تخصصات أخرى في {cityNameAr}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {siblings.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/ar/directory/${city.slug}/${c.slug}`}
                    className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-black/[0.06] hover:border-accent hover:bg-accent-muted transition-colors"
                  >
                    {getArabicCategoryName(c.slug)}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        <div className="text-center pt-4">
          <Link href={`/directory/${city.slug}/${category.slug}`} className="text-accent text-sm hover:underline">
            View in English / عرض بالإنجليزية
          </Link>
        </div>
      </div>
    );
  }

  // --- City + Area Page ---
  if (resolved.type === "city-area") {
    const { area } = resolved;
    const areaNameAr = area.nameAr || area.name;
    const { providers, total } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, sort: "rating", limit: 20 });
    const categories = getCategories();

    return (
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
          { name: areaNameAr },
        ])} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-6">
          <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
          <span>/</span>
          <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
          <span>/</span>
          <span className="text-dark font-medium">{areaNameAr}</span>
        </nav>

        <h1 className="text-3xl font-bold text-dark mb-2">الرعاية الصحية في {areaNameAr}، {cityNameAr}</h1>
        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted">
            تضم منطقة {areaNameAr} في {cityNameAr} عدد {total} مقدم رعاية صحية. تصفح حسب التخصص أدناه. البيانات من سجلات هيئات الصحة الإماراتية الرسمية. آخر تحقق مارس 2026.
          </p>
        </div>

        <div className="mb-8">
          <div className="section-header">
            <h2>{ar.specialties} في {areaNameAr}</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ar/directory/${city.slug}/${area.slug}/${cat.slug}`}
                className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-black/[0.06] hover:border-accent hover:bg-accent-muted transition-colors"
              >
                {getArabicCategoryName(cat.slug)}
              </Link>
            ))}
          </div>
        </div>

        {providers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                citySlug={p.citySlug}
                categorySlug={p.categorySlug}
                address={p.address}
                phone={p.phone}
                website={p.website}
                shortDescription={p.shortDescription}
                googleRating={p.googleRating}
                googleReviewCount={p.googleReviewCount}
                isClaimed={p.isClaimed}
                isVerified={p.isVerified}
                coverImageUrl={p.coverImageUrl}
                basePath="/ar/directory"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Area + Category Facet Page ---
  if (resolved.type === "area-category") {
    const { area, category } = resolved;
    const catNameAr = getArabicCategoryName(category.slug);
    const areaNameAr = area.nameAr || area.name;
    const { providers, total } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: category.slug, sort: "rating", limit: 50 });
    // Empty area+category combos show an empty state with a link to the
    // city-level category page, instead of a hard 404.
    const regulator = getArabicRegulator(city.slug);

    return (
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
          { name: areaNameAr, url: `${base}/ar/directory/${city.slug}/${area.slug}` },
          { name: catNameAr },
        ])} />
        <JsonLd data={itemListSchema(`${catNameAr} في ${areaNameAr}، ${cityNameAr}`, providers, city.name, base)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-6">
          <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
          <span>/</span>
          <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
          <span>/</span>
          <Link href={`/ar/directory/${city.slug}/${area.slug}`} className="hover:text-accent transition-colors">{areaNameAr}</Link>
          <span>/</span>
          <span className="text-dark font-medium">{catNameAr}</span>
        </nav>

        <h1 className="text-3xl font-bold text-dark mb-2">{catNameAr} في {areaNameAr}، {cityNameAr}</h1>
        <p className="text-sm text-muted mb-4">{total} {ar.provider} معتمد · {ar.lastUpdated}</p>

        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            تضم منطقة {areaNameAr} في {cityNameAr} عدد {total} مقدم خدمة في تخصص {catNameAr}، مسجلين لدى {regulator}. البيانات من السجلات الحكومية الرسمية. آخر تحقق مارس 2026.
          </p>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                citySlug={p.citySlug}
                categorySlug={p.categorySlug}
                address={p.address}
                phone={p.phone}
                website={p.website}
                shortDescription={p.shortDescription}
                googleRating={p.googleRating}
                googleReviewCount={p.googleReviewCount}
                isClaimed={p.isClaimed}
                isVerified={p.isVerified}
                coverImageUrl={p.coverImageUrl}
                basePath="/ar/directory"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted mb-2">{ar.noProvidersFound} {catNameAr} في {areaNameAr}.</p>
            <Link href={`/ar/directory/${city.slug}/${category.slug}`} className="text-accent text-sm">
              {ar.viewAll} {catNameAr} في {cityNameAr} &larr;
            </Link>
          </div>
        )}
      </div>
    );
  }

  // --- Individual Listing Page ---
  if (resolved.type === "listing") {
    const { category, provider } = resolved;
    const catNameAr = getArabicCategoryName(category.slug);
    const area = provider.areaSlug ? getAreaBySlug(city.slug, provider.areaSlug) : null;
    const areaNameAr = area?.nameAr || area?.name || "";
    const nearbyProviders = (await getTopRatedProviders(city.slug, 4)).filter((p) => p.id !== provider.id);
    const providerPhotoUrls = collectProviderImageUrls(provider, { limit: 8 });
    const attributedGalleryPhotos = (provider.galleryPhotos ?? []).filter((photo) =>
      isUsableProviderImageUrl(photo.url)
    );

    const answerBlock = `وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، ${provider.name} هو ${catNameAr} ${provider.isVerified ? "معتمد " : ""}في ${areaNameAr ? areaNameAr + "، " : ""}${cityNameAr}، الإمارات${hasValidHours(provider.operatingHours) && provider.operatingHours.mon ? `، مفتوح ${provider.operatingHours.mon.open === "00:00" ? "على مدار الساعة" : `${provider.operatingHours.mon.open}–${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `الخدمات: ${provider.services.slice(0, 4).join("، ")}.` : ""} ${provider.insurance.length > 0 ? "يقبل التأمين الصحي." : ""} ${provider.googleRating && Number(provider.googleRating) > 0 ? `تقييم Google: ${provider.googleRating}/5 من ${provider.googleReviewCount?.toLocaleString("ar-AE")} مراجعة.` : ""} ${provider.phone ? `للتواصل: ${provider.phone}.` : ""} البيانات مصدرها السجلات الحكومية الرسمية. آخر تحقق: ${formatVerifiedDateAr(provider.lastVerified)}.`;

    return (
      <div className="container-tc py-8">
        <JsonLd data={medicalOrganizationSchema(provider, city, category, area, city.slug)} />
        <JsonLd data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
          { name: catNameAr, url: `${base}/ar/directory/${city.slug}/${category.slug}` },
          { name: provider.name },
        ])} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-6 flex-wrap">
          <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
          <span>/</span>
          <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
          <span>/</span>
          <Link href={`/ar/directory/${city.slug}/${category.slug}`} className="hover:text-accent transition-colors">{catNameAr}</Link>
          <span>/</span>
          <span className="text-dark font-medium">{provider.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-dark">{provider.name}</h1>
                {provider.isVerified && <CheckCircle className="h-6 w-6 text-accent" />}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="badge">{catNameAr}</span>
                {area && <span className="inline-block bg-light-100 text-dark text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 border border-black/[0.06]">{areaNameAr}</span>}
              </div>
              {provider.googleRating && Number(provider.googleRating) > 0 && <StarRating rating={Number(provider.googleRating)} reviewCount={provider.googleReviewCount} size="lg" />}
            </div>

            {/* Answer block */}
            <div className="answer-block mb-6" data-answer-block="true" data-last-verified={provider.lastVerified}>
              <p className="text-dark/80 leading-relaxed font-medium">{answerBlock}</p>
            </div>

            {/* Photo gallery */}
            {providerPhotoUrls.length > 1 && (
              <div className="mb-6" data-section="gallery">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-dark flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-accent" /> الصور
                  </h2>
                  <span className="text-xs text-muted">
                    {providerPhotoUrls.length} صور
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {providerPhotoUrls.map((photoUrl, idx) => (
                    <div
                      key={`${photoUrl}-${idx}`}
                      className="relative aspect-square overflow-hidden border border-black/[0.06]"
                    >
                      <Image
                        src={photoUrl}
                        alt={`${provider.name} — صورة ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading={idx < 4 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>
                {attributedGalleryPhotos.some((p) => p.attributions?.length > 0) && (
                  <p className="text-[11px] text-muted mt-2">
                    الصور من {Array.from(new Set(attributedGalleryPhotos.flatMap((p) => p.attributions?.map((a) => a.displayName) || []))).slice(0, 3).join("، ")} عبر خرائط Google
                  </p>
                )}
              </div>
            )}

            {/* About */}
            <div className="border border-black/[0.06] p-6 mb-6" data-section="about">
              <h2 className="font-semibold text-dark mb-3">{ar.aboutProvider} {provider.name}</h2>
              {provider.editorialSummary && (
                <div className="bg-light-50 border border-black/[0.04] p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">ملخص Google</p>
                  <p className="text-sm text-dark leading-relaxed">{provider.editorialSummary}</p>
                </div>
              )}
              {(provider.descriptionAr || provider.description) ? (
                <div className="text-muted leading-relaxed whitespace-pre-line">{provider.descriptionAr || provider.description}</div>
              ) : (
                <p className="text-muted leading-relaxed">{provider.name} — {category ? getArabicCategoryName(category.slug) : ''} في {cityNameAr}.</p>
              )}
              <p className="text-xs text-muted mt-3">المصدر: سجل هيئة الصحة الإماراتية الرسمي. آخر تحقق: {formatVerifiedDateAr(provider.lastVerified)}.</p>
            </div>

            {/* Accessibility */}
            {provider.accessibilityOptions &&
              Object.values(provider.accessibilityOptions).some((v) => v === true) && (
                <div className="border border-black/[0.06] p-6 mb-6" data-section="accessibility">
                  <h2 className="font-semibold text-dark mb-3 flex items-center gap-2">
                    <Accessibility className="h-5 w-5 text-accent" /> إمكانية الوصول
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.accessibilityOptions.wheelchairAccessibleEntrance && (
                      <span className="inline-flex items-center gap-1.5 bg-accent/[0.08] text-accent text-xs font-medium px-3 py-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> مدخل مناسب للكراسي المتحركة
                      </span>
                    )}
                    {provider.accessibilityOptions.wheelchairAccessibleParking && (
                      <span className="inline-flex items-center gap-1.5 bg-accent/[0.08] text-accent text-xs font-medium px-3 py-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> موقف سيارات مناسب للكراسي المتحركة
                      </span>
                    )}
                    {provider.accessibilityOptions.wheelchairAccessibleRestroom && (
                      <span className="inline-flex items-center gap-1.5 bg-accent/[0.08] text-accent text-xs font-medium px-3 py-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> دورة مياه مناسبة للكراسي المتحركة
                      </span>
                    )}
                    {provider.accessibilityOptions.wheelchairAccessibleSeating && (
                      <span className="inline-flex items-center gap-1.5 bg-accent/[0.08] text-accent text-xs font-medium px-3 py-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> مقاعد مناسبة للكراسي المتحركة
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Services */}
            {provider.services.length > 0 && (
              <div className="border border-black/[0.06] p-6 mb-6" data-section="services">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Stethoscope className="h-5 w-5 text-accent" /> {ar.services}</h2>
                <p className="text-sm text-muted mb-3">يقدم {provider.name} هذه الخدمات في {cityNameAr}:</p>
                <div className="flex flex-wrap gap-2">{provider.services.map((s) => (<span key={s} className="badge-outline px-3 py-1">{s}</span>))}</div>
              </div>
            )}

            {/* Operating Hours — prefer Google's rich weekday descriptions when available */}
            {(() => {
              const weekday = provider.currentOpeningHours?.weekdayDescriptions;
              const hasWeekday = Array.isArray(weekday) && weekday.length > 0;
              const hasLegacy =
                provider.operatingHours &&
                Object.keys(provider.operatingHours).length > 0;
              if (!hasWeekday && !hasLegacy) return null;
              return (
                <div className="border border-black/[0.06] p-6 mb-6" data-section="hours">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-dark flex items-center gap-2">
                      <Clock className="h-5 w-5 text-accent" /> {ar.operatingHours}
                    </h2>
                    {provider.currentOpeningHours?.openNow !== undefined && (
                      <span
                        className={`text-xs font-medium px-3 py-1 ${
                          provider.currentOpeningHours.openNow
                            ? "bg-accent/[0.08] text-accent"
                            : "bg-light-100 text-muted"
                        }`}
                      >
                        {provider.currentOpeningHours.openNow ? "مفتوح الآن" : "مغلق الآن"}
                      </span>
                    )}
                  </div>
                  {hasWeekday ? (
                    <ul className="space-y-1">
                      {weekday!.map((line, i) => (
                        <li
                          key={i}
                          className="text-sm text-dark py-1 border-b border-black/[0.06] last:border-b-0"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(provider.operatingHours!).map(([d, h]) => (
                        <div key={d} className="flex justify-between text-sm py-1 border-b border-black/[0.06] last:border-b-0">
                          <span className="text-muted">{ar.days[d] || d}</span>
                          <span className="font-medium text-dark">{h.open === "00:00" && h.close === "23:59" ? ar.hours24 : `${h.open} – ${h.close}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Insurance */}
            {provider.insurance.length > 0 && (
              <div className="border border-black/[0.06] p-6 mb-6" data-section="insurance">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /> {ar.acceptedInsurance}</h2>
                <p className="text-sm text-muted mb-3">يقبل {provider.name} خطط التأمين التالية:</p>
                <div className="flex flex-wrap gap-2">{provider.insurance.map((i) => (<span key={i} className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-black/[0.06]">{i}</span>))}</div>
              </div>
            )}

            {/* What patients say — three-tier fallback:
                  1. reviewSummaryV2 (bulky block with overview + themes + snippets)
                  2. reviewSummaryAr / reviewSummary (legacy themed bullets)
                  3. hidden */}
            {provider.reviewSummaryV2 ? (
              <div className="border border-black/[0.06] p-6 mb-6 bg-light-50" data-section="reviews">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="font-semibold text-dark flex items-center gap-2">
                    <Quote className="h-5 w-5 text-accent" /> {ar.patientReviews}
                  </h2>
                  {provider.googleRating && Number(provider.googleRating) > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.round(Number(provider.googleRating))
                                ? "text-accent fill-accent"
                                : "text-black/15"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-dark">{provider.googleRating}</span>
                      <span className="text-muted">({provider.googleReviewCount?.toLocaleString("ar-AE")})</span>
                    </div>
                  )}
                </div>

                {/* Overall sentiment */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    التقييم العام
                  </h3>
                  <p className="text-sm text-dark/70 leading-relaxed">
                    {provider.reviewSummaryV2.overall_sentiment}
                  </p>
                </div>

                {/* What stood out */}
                {provider.reviewSummaryV2.what_stood_out && provider.reviewSummaryV2.what_stood_out.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      أبرز ما ذكره المرضى
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {provider.reviewSummaryV2.what_stood_out.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted">
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>
                            {t.theme}
                            {t.mention_count > 1 && (
                              <span className="text-black/30 text-xs mr-1">
                                ({t.mention_count} إشارات)
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Partial-quote snippet cards */}
                {provider.reviewSummaryV2.snippets && provider.reviewSummaryV2.snippets.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                      أصوات المرضى الحديثة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {provider.reviewSummaryV2.snippets.map((s, i) => (
                        // No microdata attrs — the JSON-LD provider node
                        // already ships these snippets as nested Reviews.
                        // See the matching comment in the English template.
                        <article key={i} className="bg-white p-4 border border-black/[0.04]">
                          <div className="flex items-center gap-0.5 mb-2">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                className={`h-3 w-3 ${
                                  starIdx < s.rating ? "text-accent fill-accent" : "text-black/15"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted leading-relaxed italic mb-2">
                            {s.text_fragment}
                          </p>
                          <p className="text-xs text-muted/80">
                            <span className="font-medium">
                              {s.author_display}
                            </span>
                            {s.relative_time && <span> · {s.relative_time}</span>}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted mt-4 pt-3 border-t border-black/[0.06]">
                  محاور مستخلصة من {provider.googleReviewCount?.toLocaleString("ar-AE") || "تقييمات حديثة"} تقييم على Google.{" "}
                  {provider.googleMapsUri && (
                    <a
                      href={provider.googleMapsUri}
                      target="_blank"
                      rel="nofollow noopener"
                      className="text-accent hover:underline"
                    >
                      اقرأ التقييمات الأصلية على خرائط Google ←
                    </a>
                  )}
                </p>
              </div>
            ) : (
              (() => {
                const reviews = provider.reviewSummaryAr || provider.reviewSummary;
                if (!reviews || reviews.length === 0 || reviews[0] === "No patient reviews available yet") return null;
                const validRating = provider.googleRating && Number(provider.googleRating) > 0;
                return (
                  <div className="border border-black/[0.06] p-6 mb-6 bg-light-50" data-section="reviews">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-dark flex items-center gap-2">
                        <Quote className="h-5 w-5 text-accent" /> {ar.patientReviews}
                      </h2>
                      {validRating && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < Math.round(Number(provider.googleRating))
                                    ? "text-accent fill-accent"
                                    : "text-black/15"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-dark">{provider.googleRating}</span>
                          <span className="text-muted">({provider.googleReviewCount?.toLocaleString("ar-AE")})</span>
                        </div>
                      )}
                    </div>
                    {reviews.length === 1 ? (
                      <p className="text-sm text-muted leading-relaxed">{reviews[0]}</p>
                    ) : (
                      <ul className="space-y-2">
                        {reviews.map((point: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted">
                            <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {validRating && (
                      <p className="text-xs text-muted mt-4 pt-3 border-t border-black/[0.06]">
                        محاور مستخلصة من {provider.googleReviewCount?.toLocaleString("ar-AE")} تقييم على Google.{" "}
                        {provider.googleMapsUri && (
                          <a
                            href={provider.googleMapsUri}
                            target="_blank"
                            rel="nofollow noopener"
                            className="text-accent hover:underline"
                          >
                            اقرأ التقييمات الأصلية على خرائط Google ←
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                );
              })()
            )}

            {/* Languages */}
            {provider.languages.length > 0 && (
              <div className="border border-black/[0.06] p-6 mb-6" data-section="languages">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Languages className="h-5 w-5 text-accent" /> {ar.languagesSpoken}</h2>
                <p className="text-sm text-muted">يتحدث طاقم {provider.name}: {provider.languages.join("، ")}.</p>
              </div>
            )}

            {/* Map */}
            <div className="border border-black/[0.06] p-6 mb-6" data-section="location">
              <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" /> {ar.location}</h2>
              <GoogleMapEmbed query={`${provider.name}, ${provider.address}`} />
              <p className="text-sm text-muted mt-3">{provider.address}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted mb-6">
              <Calendar className="h-3.5 w-3.5" />
              <span>آخر تحقق: {formatVerifiedDateAr(provider.lastVerified)} · البيانات من سجل هيئة الصحة الإماراتية الرسمي</span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="border border-black/[0.06] p-6">
                <h2 className="font-semibold text-dark mb-4">{ar.contact}</h2>
                <div className="space-y-3">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 text-sm text-dark/70 hover:text-accent transition-colors"><Phone className="h-4 w-4" /> {provider.phone}</a>}
                  {provider.website && <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-dark/70 hover:text-accent transition-colors"><Globe className="h-4 w-4" /> {ar.website} <ExternalLink className="h-3 w-3" /></a>}
                  <div className="flex items-center gap-3 text-sm text-dark/70"><MapPin className="h-4 w-4" /> {provider.address}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="btn-accent w-full"><Phone className="h-4 w-4 ml-2" /> {ar.callNow}</a>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`} target="_blank" rel="noopener noreferrer" className="btn-dark w-full"><MapPin className="h-4 w-4 ml-2" /> {ar.directions}</a>
                </div>
              </div>

              {!provider.isClaimed && (
                <div className="border border-black/[0.06] p-6 bg-accent-muted">
                  <h3 className="font-semibold text-dark mb-2">{ar.isThisYourBusiness}</h3>
                  <p className="text-sm text-muted mb-4">{ar.claimYourListing}</p>
                  <Link href={`/claim/${provider.id}`} className="btn-accent w-full">{ar.claimListing}</Link>
                </div>
              )}

              {nearbyProviders.length > 0 && (
                <div className="border border-black/[0.06] p-6">
                  <h3 className="font-semibold text-dark mb-3">{ar.nearby}</h3>
                  <div className="space-y-3">
                    {nearbyProviders.map((np) => (
                      <Link key={np.id} href={`/ar/directory/${np.citySlug}/${np.categorySlug}/${np.slug}`} className="block text-sm hover:text-accent transition-colors">
                        <p className="font-medium text-dark">{np.name}</p>
                        {np.googleRating && Number(np.googleRating) > 0 && (
                          <p className="text-xs text-muted">{np.googleRating} {ar.stars}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Language Switch */}
        <div className="text-center pt-6 pb-4">
          <Link href={`/directory/${city.slug}/${category.slug}/${provider.slug}`} className="text-accent text-sm hover:underline">
            View in English / عرض بالإنجليزية
          </Link>
        </div>
      </div>
    );
  }

  notFound();
}
