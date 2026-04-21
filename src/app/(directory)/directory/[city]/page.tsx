import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities, getCategories, getAreasByCity,
  getTopRatedProviders, getProviderCountByCategoryAndCity,
  getProviderCountByCity, getProviderCountByAreaAndCity, getFaqs,
} from "@/lib/data";
import { getLatestArticles } from "@/lib/intelligence/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { ProviderCardV2 } from "@/components/directory-v2/cards/ProviderCardV2";
import { CategoryRail } from "@/components/directory-v2/rails/CategoryRail";
import { SpecialtyTile } from "@/components/directory-v2/cards/SpecialtyTile";
import { EmptyStateV2 } from "@/components/directory-v2/shared/EmptyStateV2";
import { ChevronRight, ShieldCheck, Calendar, Languages as LanguagesIcon, Activity, DollarSign, MapPin, ArrowRight } from "lucide-react";
import {
  Stethoscope, Baby, Brain, Heart, Eye, Ear, Bone, Smile, Syringe, FlaskConical, Pill, UserRound, Sparkles,
} from "lucide-react";

export const revalidate = 43200;

interface Props { params: { city: string } }

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const count = await safe(getProviderCountByCity(city.slug), 0, "metaCount");
  const regShort = city.slug === "dubai" ? "DHA" : (city.slug === "abu-dhabi" || city.slug === "al-ain") ? "DOH" : "MOHAP";
  const year = new Date().getFullYear();
  return {
    title: truncateTitle(`${count}+ Healthcare Providers in ${city.name} — Compare [${year}]`),
    description: truncateDescription(
      `Find & compare ${count}+ ${regShort}-licensed hospitals, clinics, dentists & specialists in ${city.name}. Ratings, reviews, insurance, hours & directions. Free directory.`
    ),
    alternates: {
      canonical: `${getBaseUrl()}/directory/${city.slug}`,
      languages: {
        "en-AE": `${getBaseUrl()}/directory/${city.slug}`,
        "ar-AE": `${getBaseUrl()}/ar/directory/${city.slug}`,
        "x-default": `${getBaseUrl()}/directory/${city.slug}`,
      },
    },
    openGraph: {
      title: `Healthcare Providers in ${city.name}, UAE`,
      description: `Find ${count}+ healthcare providers in ${city.name}. Browse hospitals, clinics, dentists, and specialists with ratings and reviews.`,
      type: "website",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url: `${getBaseUrl()}/directory/${city.slug}`,
      images: [{ url: `${getBaseUrl()}/images/cities/${city.slug}.webp`, width: 1200, height: 630, alt: `Healthcare in ${city.name}, UAE` }],
    },
  };
}

function getRegulatorName(city: string): string {
  if (city === "Dubai") return "the Dubai Health Authority (DHA)";
  if (city === "Abu Dhabi" || city === "Al Ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}
function getRegulatorShort(slug: string): string {
  if (slug === "dubai") return "DHA";
  if (slug === "abu-dhabi" || slug === "al-ain") return "DOH";
  return "MOHAP";
}
function getEditorialBlurb(cityName: string, total: number, regulator: string): string {
  if (cityName === "Dubai")
    return `Dubai is home to ${total} licensed healthcare facilities regulated by ${regulator}. From world-class hospitals in Healthcare City to neighborhood clinics in Al Barsha, find the right provider for your needs.`;
  if (cityName === "Abu Dhabi")
    return `Abu Dhabi is home to ${total} licensed healthcare facilities regulated by ${regulator}. From flagship hospitals on Al Maryah Island to specialist clinics in Khalifa City, explore the capital's healthcare network.`;
  if (cityName === "Al Ain")
    return `Al Ain is home to ${total} licensed healthcare facilities regulated by ${regulator}. Known as the Garden City, Al Ain offers a growing network of hospitals and clinics serving the eastern region.`;
  if (cityName === "Sharjah")
    return `Sharjah is home to ${total} licensed healthcare facilities regulated by ${regulator}. From medical centers in Al Nahda to clinics in Al Majaz, discover quality healthcare across the emirate.`;
  return `${cityName} is home to ${total} licensed healthcare facilities regulated by ${regulator}. Browse hospitals, clinics, and specialist providers serving the community.`;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hospitals: <Stethoscope className="h-4 w-4" strokeWidth={1.75} />, dental: <Smile className="h-4 w-4" strokeWidth={1.75} />,
  "dental-clinics": <Smile className="h-4 w-4" strokeWidth={1.75} />, dentists: <Smile className="h-4 w-4" strokeWidth={1.75} />,
  pediatrics: <Baby className="h-4 w-4" strokeWidth={1.75} />, "mental-health": <Brain className="h-4 w-4" strokeWidth={1.75} />,
  cardiology: <Heart className="h-4 w-4" strokeWidth={1.75} />, ophthalmology: <Eye className="h-4 w-4" strokeWidth={1.75} />,
  ent: <Ear className="h-4 w-4" strokeWidth={1.75} />, orthopedics: <Bone className="h-4 w-4" strokeWidth={1.75} />,
  dermatology: <Sparkles className="h-4 w-4" strokeWidth={1.75} />, "general-medicine": <Stethoscope className="h-4 w-4" strokeWidth={1.75} />,
  gynecology: <UserRound className="h-4 w-4" strokeWidth={1.75} />, fertility: <UserRound className="h-4 w-4" strokeWidth={1.75} />,
  pharmacy: <Pill className="h-4 w-4" strokeWidth={1.75} />, laboratory: <FlaskConical className="h-4 w-4" strokeWidth={1.75} />,
  aesthetic: <Syringe className="h-4 w-4" strokeWidth={1.75} />, clinics: <Stethoscope className="h-4 w-4" strokeWidth={1.75} />,
};
const iconFor = (slug: string) => CATEGORY_ICONS[slug] ?? <Stethoscope className="h-4 w-4" strokeWidth={1.75} />;

export default async function CityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const categories = getCategories();
  const areas = getAreasByCity(city.slug);
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.name);
  const regulatorShort = getRegulatorShort(city.slug);

  const [topProviders, total, catCounts, areaCounts] = await Promise.all([
    safe(getTopRatedProviders(city.slug, 12), [] as Awaited<ReturnType<typeof getTopRatedProviders>>, "topProviders"),
    safe(getProviderCountByCity(city.slug), 0, "total"),
    safe(Promise.all(categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug))), categories.map(() => 0) as number[], "catCounts"),
    safe(Promise.all(areas.map((a) => getProviderCountByAreaAndCity(a.slug, city.slug))), areas.map(() => 0) as number[], "areaCounts"),
  ]);
  const faqs = getFaqs("city", city.slug);
  const latestArticles = getLatestArticles(3);

  const catsWithCounts = categories
    .map((cat, i) => ({ ...cat, count: catCounts[i] }))
    .filter((cat) => (cat.count ?? 0) > 0 || total === 0);
  const areasWithCounts = areas.map((area, i) => ({ ...area, count: areaCounts[i] }));

  const rated = topProviders.filter((p) => Number(p.googleRating) > 0);
  const featured = rated.length > 0 ? rated.slice(0, 8) : topProviders.slice(0, 8);

  const railItems = catsWithCounts.slice(0, 14).map((c) => ({
    slug: c.slug,
    name: c.name,
    count: c.count,
    icon: iconFor(c.slug),
    href: `/directory/${city.slug}/${c.slug}`,
  }));

  const filterShortcuts = [
    { href: `/directory/${city.slug}/insurance`, label: "By Insurance", sub: "Daman, Thiqa, AXA…", Icon: ShieldCheck },
    { href: `/directory/${city.slug}/language`, label: "By Language", sub: "Arabic, English, Hindi…", Icon: LanguagesIcon },
    { href: `/directory/${city.slug}/condition`, label: "By Condition", sub: "Dental, LASIK, IVF…", Icon: Activity },
    { href: `/directory/${city.slug}/procedures`, label: "Procedure Costs", sub: "Dental, LASIK, MRI…", Icon: DollarSign },
    { href: `/directory/${city.slug}/24-hour`, label: "24-hour care", sub: "Open now & overnight", Icon: Calendar },
    { href: `/directory/${city.slug}/walk-in`, label: "Walk-in clinics", sub: "No appointment needed", Icon: MapPin },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
      ])} />
      <JsonLd data={itemListSchema(`Top Healthcare Providers in ${city.name}`, featured, city.name, base)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.18),transparent_70%)]" />
          <div className="absolute -top-16 -left-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-10">
          {/* Breadcrumb */}
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink transition-colors">UAE</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/directory" className="hover:text-ink transition-colors">Directory</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">{city.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                {regulatorShort} Verified
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                Healthcare in {city.name}.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                {getEditorialBlurb(city.name, total, regulator)}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  href={`/ar/directory/${city.slug}`}
                  lang="ar"
                  hrefLang="ar-AE"
                  dir="rtl"
                  className="inline-flex items-center gap-1.5 font-sans text-z-caption font-medium text-ink-soft hover:text-ink transition-colors"
                  aria-label={`عرض الرعاية الصحية في ${city.name} بالعربية`}
                >
                  اقرأ هذه الصفحة بالعربية
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                {[
                  { n: total.toLocaleString() || "12,500+", l: "Licensed providers" },
                  { n: catsWithCounts.length.toString(), l: "Specialties covered" },
                  { n: areas.length.toString(), l: "Neighborhoods" },
                ].map((s) => (
                  <div key={s.l} className="bg-white rounded-z-md border border-ink-line px-4 py-3">
                    <p className="font-display font-semibold text-ink text-z-h2 leading-none">{s.n}</p>
                    <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AEO answer block */}
          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              According to the UAE Open Healthcare Directory, {city.name} has{" "}
              <span className="font-semibold text-ink">{total}+</span> registered healthcare providers listed across {categories.length} medical specialties and {areas.length} neighborhoods.
              {city.name === "Dubai" && " Healthcare in Dubai is regulated by the Dubai Health Authority (DHA)."}
              {city.name === "Abu Dhabi" && " Healthcare in Abu Dhabi is regulated by the Department of Health (DOH)."}
              {city.name === "Al Ain" && " Healthcare in Al Ain falls under the Department of Health Abu Dhabi (DOH)."}
              {!["Dubai", "Abu Dhabi", "Al Ain"].includes(city.name) &&
                ` Healthcare in ${city.name} is regulated by the Ministry of Health and Prevention (MOHAP).`}
              {" "}All listings include verified contact details, Google ratings, accepted insurance plans, operating hours, and directions. Data sourced from official government licensed facility registers.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Category rail (sticky) ─── */}
      {railItems.length > 0 && (
        <div className="sticky top-20 z-20 bg-surface-cream/90 backdrop-blur-md border-b border-ink-line">
          <div className="max-w-z-container mx-auto">
            <CategoryRail items={railItems} />
          </div>
        </div>
      )}

      {/* ─── Specialties grid (for SEO depth) ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Medical specialties
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              What do you need in {city.name}?
            </h2>
          </div>
        </header>
        {catsWithCounts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {catsWithCounts.map((cat) => (
              <SpecialtyTile
                key={cat.slug}
                slug={cat.slug}
                name={cat.name}
                href={`/directory/${city.slug}/${cat.slug}`}
                providerCount={cat.count}
                useImage
              />
            ))}
          </div>
        ) : (
          <EmptyStateV2
            title="No specialties listed yet"
            description={`We're still indexing providers in ${city.name}. Check back soon or browse nearby cities.`}
          />
        )}
      </section>

      {/* ─── Neighborhoods ─── */}
      {areasWithCounts.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="flex items-end justify-between gap-6 mb-6">
            <div>
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Neighborhoods
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Find care near you in {city.name}.
              </h2>
            </div>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 border-t border-ink-line pt-4">
            {areasWithCounts.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/directory/${city.slug}/${area.slug}`}
                  className="flex items-center justify-between py-2.5 group"
                >
                  <span className="font-sans text-z-body text-ink group-hover:underline decoration-1 underline-offset-2">
                    {area.name}
                  </span>
                  {area.count > 0 && (
                    <span className="font-sans text-z-caption text-ink-muted">
                      {area.count} {area.count === 1 ? "provider" : "providers"}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Filter shortcuts ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Narrow your search
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Filter providers in {city.name}.
            </h2>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filterShortcuts.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex items-center gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink transition-colors"
            >
              <div className="h-10 w-10 rounded-z-md bg-accent-muted flex items-center justify-center flex-shrink-0">
                <f.Icon className="h-5 w-5 text-accent-deep" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-ink text-z-body leading-tight">{f.label}</p>
                <p className="font-sans text-z-caption text-ink-muted mt-0.5">{f.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured providers ─── */}
      {featured.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="flex items-end justify-between gap-6 mb-6">
            <div>
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Top-rated in {city.name}
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Providers patients love here.
              </h2>
            </div>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 z-stagger">
            {featured.map((p, i) => {
              const cat = categories.find((c) => c.slug === p.categorySlug);
              return (
                <ProviderCardV2
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  citySlug={p.citySlug}
                  categorySlug={p.categorySlug}
                  categoryName={cat?.name ?? null}
                  address={p.address ?? null}
                  googleRating={p.googleRating}
                  googleReviewCount={p.googleReviewCount}
                  isClaimed={p.isClaimed}
                  isVerified={p.isVerified}
                  photos={p.photos ?? []}
                  coverImageUrl={p.coverImageUrl ?? null}
                  priority={i < 4}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Latest news ─── */}
      {latestArticles.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              From Zavis Intelligence
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Latest in UAE healthcare.
            </h2>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <li key={article.id}>
                <Link href={`/intelligence/${article.slug}`} className="block group">
                  <p className="font-sans text-z-caption text-ink-muted uppercase tracking-[0.04em]">
                    {article.category ?? "Report"}
                  </p>
                  <h3 className="font-display font-semibold text-ink text-z-h3 mt-1.5 group-hover:underline decoration-1 underline-offset-2">
                    {article.title}
                  </h3>
                  <p className="font-sans text-z-body-sm text-ink-muted mt-2">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" }) : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── FAQ ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {city.name} healthcare.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} />
        </div>
      </section>
    </>
  );
}
