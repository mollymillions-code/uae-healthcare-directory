import { Metadata } from "next";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCategories,
  getTopRatedProviders,
  getProviderCountByCity,
  getProviderCountByCategory,
} from "@/lib/data";
import { speakableSchema, faqPageSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import {
  Stethoscope, Baby, Brain, Heart, Eye, Ear, Bone, Smile, Syringe, FlaskConical, Pill,
  UserRound, ShieldCheck, Star, Sparkles, ArrowRight,
} from "lucide-react";
import { DirectoryHomeHero } from "./_components/DirectoryHomeHero";
import { CategoryRail } from "@/components/directory-v2/rails/CategoryRail";
import { CityCard } from "@/components/directory-v2/cards/CityCard";
import { ProviderCardV2 } from "@/components/directory-v2/cards/ProviderCardV2";

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear();
  const base = getBaseUrl();
  return {
    title: truncateTitle(`UAE Healthcare Directory — 12,500+ Providers [${year}]`),
    description: truncateDescription(
      `Compare 12,500+ DHA/DOH/MOHAP-licensed hospitals, clinics & dentists across Dubai, Abu Dhabi & Sharjah. Ratings, reviews, insurance, hours & directions. Free.`
    ),
    openGraph: {
      type: "website",
      title: "UAE Healthcare Directory — 12,500+ Doctors, Clinics & Hospitals",
      description:
        "Free directory of 12,500+ DHA/DOH/MOHAP-licensed healthcare providers. Compare hospitals, clinics & dentists in Dubai, Abu Dhabi, Sharjah by rating, insurance & specialty.",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory by Zavis",
      url: `${base}/directory`,
      images: [
        { url: `${base}/images/og-default.png`, width: 1200, height: 630, alt: "UAE Open Healthcare Directory" },
      ],
    },
    alternates: {
      canonical: `${base}/directory`,
      languages: {
        "en-AE": `${base}/directory`,
        "ar-AE": `${base}/ar`,
      },
    },
  };
}

export const revalidate = 21600;

// Icon palette for category rail (unicode-free, accessible SVG via lucide-react)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hospitals: <Stethoscope className="h-4 w-4" strokeWidth={1.75} />,
  dental: <Smile className="h-4 w-4" strokeWidth={1.75} />,
  "dental-clinics": <Smile className="h-4 w-4" strokeWidth={1.75} />,
  dentists: <Smile className="h-4 w-4" strokeWidth={1.75} />,
  pediatrics: <Baby className="h-4 w-4" strokeWidth={1.75} />,
  "mental-health": <Brain className="h-4 w-4" strokeWidth={1.75} />,
  cardiology: <Heart className="h-4 w-4" strokeWidth={1.75} />,
  ophthalmology: <Eye className="h-4 w-4" strokeWidth={1.75} />,
  ent: <Ear className="h-4 w-4" strokeWidth={1.75} />,
  orthopedics: <Bone className="h-4 w-4" strokeWidth={1.75} />,
  dermatology: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
  "general-medicine": <Stethoscope className="h-4 w-4" strokeWidth={1.75} />,
  gynecology: <UserRound className="h-4 w-4" strokeWidth={1.75} />,
  fertility: <UserRound className="h-4 w-4" strokeWidth={1.75} />,
  pharmacy: <Pill className="h-4 w-4" strokeWidth={1.75} />,
  laboratory: <FlaskConical className="h-4 w-4" strokeWidth={1.75} />,
  aesthetic: <Syringe className="h-4 w-4" strokeWidth={1.75} />,
  aesthetics: <Syringe className="h-4 w-4" strokeWidth={1.75} />,
  clinics: <Stethoscope className="h-4 w-4" strokeWidth={1.75} />,
};
function iconFor(slug: string): React.ReactNode {
  return CATEGORY_ICONS[slug] ?? <Stethoscope className="h-4 w-4" strokeWidth={1.75} />;
}

export default async function DirectoryHomePage() {
  const cities = getCities();
  const categories = getCategories();
  const base = getBaseUrl();

  const [cityCounts, catCounts, topProviders] = await Promise.all([
    safe(Promise.all(cities.map((c) => getProviderCountByCity(c.slug))), cities.map(() => 0) as number[], "cityCounts"),
    safe(Promise.all(categories.map((cat) => getProviderCountByCategory(cat.slug))), categories.map(() => 0) as number[], "catCounts"),
    safe(getTopRatedProviders(undefined, 12), [] as Awaited<ReturnType<typeof getTopRatedProviders>>, "topProviders"),
  ]);

  const cityCountMap = Object.fromEntries(cities.map((c, i) => [c.slug, cityCounts[i]]));
  const rawTotal = cityCounts.reduce((s, n) => s + n, 0);
  const totalProviders = rawTotal > 0 ? rawTotal : 12500;

  const categoriesWithCount = categories
    .map((c, i) => ({ ...c, count: catCounts[i] }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  const featuredCities = [...cities]
    .sort((a, b) => (cityCountMap[b.slug] ?? 0) - (cityCountMap[a.slug] ?? 0))
    .slice(0, 8);

  const featured = topProviders.filter((p) => Number(p.googleRating) > 0).slice(0, 8);

  // Inspiration links (SEO-rich long-tail — stays in SSR HTML)
  const inspirationLinks = [
    { label: "24-hour clinics in Dubai", href: "/directory/dubai/24-hour" },
    { label: "Pediatric hospitals in Abu Dhabi", href: "/directory/abu-dhabi/hospitals" },
    { label: "Dental clinics in Dubai Marina", href: "/directory/dubai/marina/dental-clinics" },
    { label: "Dermatologists in Sharjah", href: "/directory/sharjah/dermatology" },
    { label: "Cardiology specialists in Al Ain", href: "/directory/al-ain/cardiology" },
    { label: "Mental health in Dubai", href: "/directory/dubai/mental-health" },
    { label: "ENT specialists in Ajman", href: "/directory/ajman/ent" },
    { label: "Eye clinics in Abu Dhabi", href: "/directory/abu-dhabi/ophthalmology" },
    { label: "Walk-in clinics in Dubai", href: "/directory/dubai/walk-in" },
    { label: "Emergency care in Sharjah", href: "/directory/sharjah/emergency" },
    { label: "Gynecologists in Dubai", href: "/directory/dubai/gynecology" },
    { label: "Orthopedic surgeons in Abu Dhabi", href: "/directory/abu-dhabi/orthopedics" },
    { label: "Government hospitals in Dubai", href: "/directory/dubai/government" },
    { label: "Fertility clinics in Dubai", href: "/directory/dubai/fertility" },
    { label: "Pharmacies with home delivery", href: "/pharmacy/how-delivery-works" },
    { label: "Dubai clinics accepting Daman", href: "/directory/dubai/insurance/daman" },
    { label: "Clinics in Arabic in Dubai", href: "/directory/dubai/language/ar" },
    { label: "Aesthetic clinics in Dubai", href: "/directory/dubai/aesthetic" },
  ];

  const homeFaqs = [
    {
      question: "What is the UAE Open Healthcare Directory?",
      answer:
        "A free, comprehensive directory of licensed healthcare providers across all seven Emirates. Data sourced from official DHA, DOH, and MOHAP registers. Ratings from Google Maps. By Zavis.",
    },
    {
      question: "How do I find a doctor near me?",
      answer:
        "Use the search pill at the top — filter by specialty, city, date and insurance. Or browse the city and specialty grids below.",
    },
    {
      question: "Where does the data come from?",
      answer:
        "All listings are sourced from official UAE health authority registers: DHA (Dubai), DOH (Abu Dhabi & Al Ain), and MOHAP (Sharjah, Ajman, RAK, Fujairah, UAQ).",
    },
    {
      question: "Can clinics update their listing?",
      answer:
        "Yes. Healthcare providers can claim their listing for free with a DHA/DOH/MOHAP licence. Once verified, update contact details, hours, and services.",
    },
  ];

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UAE Open Healthcare Directory",
    url: `${base}/directory`,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const railItems = categoriesWithCount.slice(0, 14).map((c) => ({
    slug: c.slug,
    name: c.name,
    count: c.count,
    icon: iconFor(c.slug),
    href: `/directory/dubai/${c.slug}`,
  }));

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(homeFaqs)} />

      {/* ───── Hero ───── */}
      <DirectoryHomeHero totalProviders={totalProviders} />

      {/* ───── Category rail (sticky below header on scroll) ───── */}
      <div className="sticky top-20 z-20 bg-surface-cream/90 backdrop-blur-md border-b border-ink-line">
        <div className="max-w-z-container mx-auto">
          <CategoryRail items={railItems} />
        </div>
      </div>

      {/* ───── Cities mosaic ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Browse by Emirate
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Healthcare, city by city.
            </h2>
          </div>
          <Link
            href="/find-a-doctor"
            className="hidden md:inline-flex items-center gap-1.5 font-sans text-z-body-sm font-medium text-ink hover:text-ink-soft group"
          >
            See all cities
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredCities.map((city, idx) => {
            const isLarge = idx === 0;
            const regulator =
              city.slug === "dubai"
                ? "DHA Verified"
                : city.slug === "abu-dhabi" || city.slug === "al-ain"
                ? "DOH Verified"
                : "MOHAP Verified";
            return (
              <div
                key={city.slug}
                className={isLarge ? "col-span-2 row-span-2" : ""}
              >
                <CityCard
                  slug={city.slug}
                  name={city.name}
                  href={`/directory/${city.slug}`}
                  providerCount={cityCountMap[city.slug] ?? 0}
                  regulator={regulator}
                  size={isLarge ? "lg" : "md"}
                  priority={idx < 2}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── Top-rated providers grid ───── */}
      {featured.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <header className="flex items-end justify-between gap-6 mb-6">
            <div>
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Top-rated this month
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Providers patients love.
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

      {/* ───── Trust pillars ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              Icon: ShieldCheck,
              title: "Government-verified",
              desc:
                "Every listing is cross-referenced against DHA, DOH, or MOHAP licensed facility registers. If it isn't licensed, it isn't here.",
            },
            {
              Icon: Star,
              title: "Real patient reviews",
              desc:
                "Google ratings pulled directly from verified patient reviews — no curation, no pay-to-play, no fake 5-stars.",
            },
            {
              Icon: Sparkles,
              title: "Free. Forever.",
              desc:
                "No paywall. No login. No tracking scripts. Built as a public utility for UAE residents and visitors alike.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-z-lg bg-white border border-ink-line p-7 hover:shadow-z-card transition-shadow duration-z-base"
            >
              <div className="h-11 w-11 rounded-z-md bg-accent-muted flex items-center justify-center">
                <f.Icon className="h-5 w-5 text-accent-deep" />
              </div>
              <h3 className="font-display font-semibold text-ink text-z-h2 mt-5">{f.title}</h3>
              <p className="font-sans text-ink-soft text-z-body leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── AEO answer block (preserved for search visibility) ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="answer-block rounded-z-md bg-white border border-ink-line p-6 sm:p-8 max-w-4xl">
          <p className="font-sans text-z-body text-ink-soft leading-[1.75]">
            <span className="font-semibold text-ink">According to the UAE Open Healthcare Directory,</span>{" "}
            there are {totalProviders.toLocaleString()}+ licensed healthcare providers listed across all seven
            emirates of the United Arab Emirates — Dubai, Abu Dhabi, Sharjah, Ajman, Al Ain, Ras Al Khaimah,
            Fujairah, and Umm Al Quwain. These facilities are regulated by three government health authorities:
            the Dubai Health Authority (DHA) oversees Dubai, the Department of Health (DOH) regulates Abu Dhabi
            and Al Ain, and the Ministry of Health and Prevention (MOHAP) governs Sharjah, Ajman, Ras Al Khaimah,
            Fujairah, and Umm Al Quwain. The directory covers 26 medical specialties — hospitals, dental clinics,
            dermatology, cardiology, ophthalmology, mental health, pharmacy, and pediatrics among them — with
            each listing providing verified contact details, Google ratings from patient reviews, accepted
            insurance plans, operating hours, and directions. Data sourced from official government licensed
            facility registers.
          </p>
        </div>
      </section>

      {/* ───── Claim-listing CTA (dark) ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-8 sm:p-12 lg:p-16">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-3">
                For healthcare providers
              </p>
              <h2 className="font-display font-semibold text-white text-display-lg tracking-[-0.02em] leading-[1.05]">
                Own a clinic? Claim your free listing.
              </h2>
              <p className="font-sans text-white/70 text-z-body mt-4 max-w-lg leading-relaxed">
                Verify in under 2 minutes with your DHA/DOH/MOHAP licence. Update hours, insurance, services.
                Reach thousands of patients actively searching — for free.
              </p>
              <Link
                href="/claim"
                className="mt-7 inline-flex items-center gap-2 rounded-z-pill bg-accent hover:bg-accent-light text-white font-sans font-semibold text-z-body-sm px-6 py-3.5 transition-colors shadow-[0_8px_24px_-8px_rgba(0,200,83,0.5)]"
              >
                Claim your listing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { n: "2 min", l: "Verify your clinic" },
                { n: "Free", l: "Forever, no card" },
                { n: "Live", l: "Real patient ratings" },
                { n: "24/7", l: "Edit anytime" },
              ].map((s) => (
                <div key={s.l} className="rounded-z-md bg-white/[0.04] border border-white/10 p-5">
                  <p className="font-display font-semibold text-white text-z-h1 leading-none">{s.n}</p>
                  <p className="font-sans text-white/60 text-z-caption mt-2">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Inspiration grid (SEO long-tail, 3 cols text) ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Explore
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Inspiration for your next appointment.
          </h2>
        </header>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 border-t border-ink-line pt-6">
          {inspirationLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="font-sans text-z-body text-ink hover:underline decoration-ink decoration-1 underline-offset-2"
              >
                {l.label}
                <span className="block font-sans text-z-body-sm text-ink-muted mt-0.5">
                  {l.href.includes("/directory/") ? "Licensed providers" : "Guide"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───── GCC ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Across the Gulf
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Directories across the GCC.
          </h2>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { flag: "🇶🇦", name: "Qatar", href: "/qa/directory" },
            { flag: "🇸🇦", name: "Saudi Arabia", href: "/sa/directory" },
            { flag: "🇧🇭", name: "Bahrain", href: "/bh/directory" },
            { flag: "🇰🇼", name: "Kuwait", href: "/kw/directory" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-center gap-4 rounded-z-md bg-white border border-ink-line px-5 py-4 hover:border-ink transition-colors"
            >
              <span className="text-[28px] leading-none">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-ink text-z-body-sm leading-tight">{c.name}</p>
                <p className="font-sans text-z-caption text-ink-muted mt-0.5">Browse providers</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Good to know.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={homeFaqs} />
        </div>
      </section>
    </>
  );
}
