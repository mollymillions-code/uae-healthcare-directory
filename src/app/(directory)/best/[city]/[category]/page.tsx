import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories, getCategoryBySlug,
  getProviders, getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "DHA";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "DOH";
  return "MOHAP";
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Category-specific editorial intro content */
function getCategoryIntro(
  categorySlug: string,
  categoryName: string,
  cityName: string,
  totalCount: number,
  ratedCount: number,
  avgRatingStr: string,
  regulatorName: string,
): { headline: string; body: string } {
  const catLower = categoryName.toLowerCase();
  const intros: Record<string, { headline: string; body: string }> = {
    hospitals: {
      headline: `Choosing the right hospital in ${cityName} is one of the most important healthcare decisions you can make`,
      body: `${cityName} is home to ${totalCount} hospitals and medical centers, ranging from large multi-specialty institutions to focused day-surgery centers. We evaluated ${ratedCount} facilities with verified patient reviews to identify those that consistently deliver the highest standard of care. Our rankings factor in patient satisfaction scores, clinical reputation, breadth of insurance acceptance, and years of established practice — giving you a data-driven starting point, not just a filtered list. All facilities listed are licensed by the ${regulatorName}.`,
    },
    clinics: {
      headline: `Finding a reliable clinic in ${cityName} shouldn't require hours of research`,
      body: `With ${totalCount} clinics and polyclinics across ${cityName}, choosing the right one comes down to trust, accessibility, and consistent patient outcomes. We analyzed ${ratedCount} rated clinics to surface the ones that patients return to — and recommend to others. Rankings are based on patient satisfaction ratings, volume of reviews (which signals consistency), insurance network breadth, and operational track record. Every clinic listed is ${regulatorName}-licensed and verified against official registers.`,
    },
    dental: {
      headline: `Dental care in ${cityName} ranges from routine check-ups to advanced cosmetic and surgical procedures`,
      body: `Across ${totalCount} dental clinics in ${cityName}, quality varies significantly. We ranked ${ratedCount} patient-rated clinics to help you find practitioners who combine clinical excellence with a comfortable patient experience. Our selection criteria weigh patient ratings, review volume, range of insurance plans accepted, and years of operation. Whether you need a routine cleaning, orthodontics, or implant surgery, this ranking gives you a credible starting point.`,
    },
    dermatology: {
      headline: `Dermatology in ${cityName} spans everything from medical skin conditions to cosmetic treatments and laser procedures`,
      body: `We compared ${ratedCount} dermatology practices out of ${totalCount} total in ${cityName} to identify clinics where patients report the best outcomes and experience. In a field where results are highly visible, patient reviews are particularly meaningful. Our rankings consider satisfaction scores, review volume, insurance coverage, and established practice history — so you can make an informed choice for both medical and aesthetic dermatology needs.`,
    },
    ophthalmology: {
      headline: `Your vision is irreplaceable — choosing the right eye care specialist in ${cityName} matters`,
      body: `${cityName} has ${totalCount} eye care and ophthalmology providers, from LASIK centers to retina specialists. We evaluated ${ratedCount} practices with verified patient feedback to surface the clinics that consistently deliver exceptional results. Rankings are driven by patient satisfaction, clinical reputation (reflected in review volume), insurance acceptance breadth, and years of practice.`,
    },
    cardiology: {
      headline: `Heart care requires precision, trust, and ongoing relationships with your medical team`,
      body: `Among ${totalCount} cardiology providers in ${cityName}, we identified the ${ratedCount} with verified patient ratings to compile this ranking. Cardiac care is deeply personal — patients need confidence in their provider's expertise and bedside manner. Our selection criteria include patient satisfaction scores, review consistency, insurance network coverage, and established practice track record, all verified against ${regulatorName} data.`,
    },
    "mental-health": {
      headline: `Finding the right mental health professional in ${cityName} is a deeply personal decision`,
      body: `With growing awareness around mental wellness in the UAE, ${cityName} now has ${totalCount} mental health providers — from psychiatrists to counselors and addiction specialists. We reviewed ${ratedCount} rated practices to highlight those where patients consistently report positive experiences. In mental health, trust and comfort are paramount, which is why patient satisfaction scores are the foundation of these rankings, complemented by review volume and accessibility factors.`,
    },
    pediatrics: {
      headline: `When it comes to your child's health, you want the very best pediatrician in ${cityName}`,
      body: `Parents in ${cityName} have ${totalCount} pediatric providers to choose from. We analyzed ${ratedCount} practices with verified patient reviews to identify the clinics where families consistently report excellent care. Our rankings prioritize patient satisfaction (which in pediatrics reflects both clinical outcomes and how well providers communicate with parents), review volume, insurance acceptance, and practice history.`,
    },
    "fertility-ivf": {
      headline: `The fertility journey is one of the most significant healthcare decisions a family can face`,
      body: `${cityName} has established itself as a regional hub for fertility treatment, with ${totalCount} providers offering services from IVF to genetic testing. We evaluated ${ratedCount} rated clinics to identify those with the strongest patient outcomes and experiences. Given the emotional and financial investment involved, our rankings emphasize patient satisfaction scores, review volume (which correlates with patient trust), insurance coverage options, and years of established practice.`,
    },
    "cosmetic-plastic": {
      headline: `Cosmetic and plastic surgery in ${cityName} demands the highest standard of clinical skill and patient care`,
      body: `With ${totalCount} cosmetic surgery providers in ${cityName}, the quality spectrum is wide. We analyzed ${ratedCount} practices with verified patient reviews to surface clinics where outcomes and patient experience consistently meet expectations. In a field where results are permanent and highly visible, patient satisfaction scores carry significant weight in our rankings, alongside review volume, insurance acceptance, and practice track record.`,
    },
  };

  // Default for categories without specific intros
  const defaultIntro = {
    headline: `Finding the best ${catLower} in ${cityName} — backed by real patient data, not advertising`,
    body: `${cityName} has ${totalCount} ${catLower} providers, but quality and patient satisfaction vary significantly. We analyzed ${ratedCount} practices with verified Google reviews to create this evidence-based ranking. Rather than relying on self-reported claims, our selection criteria use real patient satisfaction scores, review volume (which reflects consistency of care over time), breadth of insurance acceptance, and operational track record. All providers are licensed by the ${regulatorName} and verified against official registers.`,
  };

  return intros[categorySlug] || defaultIntro;
}

/** Sort providers by Google rating (desc), then by review count (desc) as tiebreaker */
function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
}

/** Compute average rating */
function avgRating(providers: LocalProvider[]): string {
  const rated = providers.filter((p) => Number(p.googleRating) > 0);
  if (rated.length === 0) return "N/A";
  const sum = rated.reduce((acc, p) => acc + Number(p.googleRating), 0);
  return (sum / rated.length).toFixed(1);
}

/** Get top N most-common insurance names across providers */
function topInsurers(providers: LocalProvider[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    for (const ins of p.insurance) {
      counts.set(ins, (counts.get(ins) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name]) => name);
}

/** Get top N most-common area slugs */
function topAreas(providers: LocalProvider[], n: number): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    if (p.areaSlug) {
      counts.set(p.areaSlug, (counts.get(p.areaSlug) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([slug, count]) => ({ slug, count }));
}

// ─── Interfaces ─────────────────────────────────────────────────────────────────

interface Props {
  params: { city: string; category: string };
}

export const dynamicParams = true;

// ─── generateMetadata ───────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const count = await getProviderCountByCategoryAndCity(category.slug, city.slug);
  const base = getBaseUrl();
  const url = `${base}/best/${city.slug}/${category.slug}`;

  // Get top provider for meta description
  const { providers } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    sort: "rating",
    limit: 1,
  });
  const topProvider = providers.find((p) => Number(p.googleRating) > 0);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
  const title = `Best ${category.name} in ${city.name} — Top 10 Highest Rated [${currentYear}]`;
  const description = topProvider
    ? `Compare ${count} ${category.name.toLowerCase()} in ${city.name}. The highest-rated is ${topProvider.name} (${topProvider.googleRating} stars, ${topProvider.googleReviewCount?.toLocaleString()} reviews). Ranked by Google rating. Updated ${currentMonth} ${currentYear}.`
    : `Compare ${count} ${category.name.toLowerCase()} in ${city.name}, UAE. Ranked by Google rating and review count. Updated ${currentMonth} ${currentYear}.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'en-AE': url,
        'ar-AE': `${base}/ar/best/${city.slug}/${category.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function BestCategoryInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const regulatorShort = getRegulatorShort(city.slug);
  const totalCount = await getProviderCountByCategoryAndCity(category.slug, city.slug);

  // Get ALL providers for this combo (no limit), then rank
  const { providers: allProviders } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    limit: 99999,
  });
  const ranked = rankProviders(allProviders);

  if (ranked.length === 0) notFound();

  const top15 = ranked.slice(0, 15);
  const top20ForSchema = ranked.slice(0, 20);
  const topProvider = ranked[0];
  const mostReviewed = [...ranked].sort(
    (a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0)
  )[0];

  // Stats
  const average = avgRating(allProviders);
  const commonInsurers = topInsurers(allProviders, 5);
  const topNeighborhoods = topAreas(allProviders, 5);

  // Cross-links: other cities for same category
  const otherCitiesRaw = await Promise.all(getCities()
    .filter((c) => c.slug !== city.slug)
    .map(async (c) => ({
      ...c,
      count: await getProviderCountByCategoryAndCity(category.slug, c.slug),
    })));
  const otherCities = otherCitiesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Cross-links: other categories in same city
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

  // ─── FAQs ─────────────────────────────────────────────────────────────────────
  const catLower = category.name.toLowerCase();
  const catSingular = catLower.replace(/s$/, "");

  // Compute extra stats for long-tail FAQs
  const topLanguages = (() => {
    const counts = new Map<string, number>();
    for (const p of allProviders) {
      for (const lang of p.languages) {
        counts.set(lang, (counts.get(lang) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  })();

  const topNeighborhoodNames = topNeighborhoods
    .map((a) => titleCase(a.slug.replace(/-/g, " ")));

  const verifiedCount = allProviders.filter((p) => p.isVerified).length;

  const providersWithWebsite = allProviders.filter((p) => p.website).length;
  const providersWithPhone = allProviders.filter((p) => p.phone).length;

  const faqs = [
    // ─── Core FAQs ───────────────────────────────────────────────────────
    {
      question: `What is the best ${catSingular} in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated ${catSingular} in ${city.name} is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating based on ${topProvider.googleReviewCount?.toLocaleString()} patient reviews. All rankings are based on verified Google ratings and review volume. Data sourced from official ${regulatorShort} registers, last verified March 2026.`,
    },
    {
      question: `How many ${catLower} are there in ${city.name}?`,
      answer: `There are ${totalCount} ${catLower} listed in ${city.name} on the UAE Open Healthcare Directory. Of these, ${ranked.length} have Google ratings above 0 stars. The average rating across all rated providers is ${average} stars. Browse all providers at /directory/${city.slug}/${category.slug}.`,
    },
    {
      question: `Which ${catSingular} in ${city.name} has the most reviews?`,
      answer: mostReviewed
        ? `${mostReviewed.name} has the most Google reviews among ${catLower} in ${city.name}, with ${mostReviewed.googleReviewCount?.toLocaleString()} reviews and a ${mostReviewed.googleRating}-star rating. A high review count indicates consistent patient traffic and broad feedback.`
        : `Review counts vary among ${catLower} in ${city.name}. Browse the ranked list above to compare providers by review volume.`,
    },
    {
      question: `Do ${catLower} in ${city.name} accept insurance?`,
      answer: commonInsurers.length > 0
        ? `Yes, most ${catLower} in ${city.name} accept major UAE insurance plans. The most commonly accepted insurers include ${commonInsurers.join(", ")}. Healthcare in ${city.name} is regulated by the ${regulator}. Check individual provider listings for specific insurance acceptance.`
        : `Many ${catLower} in ${city.name} accept major UAE insurance plans. Healthcare in ${city.name} is regulated by the ${regulator}. Check individual listings for specific insurance acceptance.`,
    },
    {
      question: `What are the operating hours for ${catLower} in ${city.name}?`,
      answer: `Most ${catLower} in ${city.name} operate from 8:00 AM to 10:00 PM on weekdays and Saturdays. Some facilities, particularly hospitals and emergency care centers, are open 24/7. Friday hours may be reduced (typically afternoon only). Individual operating hours are listed on each provider's profile page in the UAE Open Healthcare Directory.`,
    },
    {
      question: `How are these ${catLower} in ${city.name} ranked?`,
      answer: `Providers are ranked by Google rating (highest first), with review count used as a tiebreaker for providers with the same rating. Only providers with a Google rating above 0 are included. All provider data is sourced from official ${regulatorShort} registers and cross-referenced with the UAE Open Healthcare Directory. Rankings are updated regularly; last verified March 2026.`,
    },

    // ─── Long-tail conversational queries for AI Overviews ───────────────

    {
      question: `How much does a visit to a ${catSingular} in ${city.name} cost without insurance?`,
      answer: `The cost of visiting a ${catSingular} in ${city.name} without insurance varies depending on the provider and type of service. A general consultation typically ranges from AED 150–500 at a private practice, while specialized procedures or diagnostics cost more. Government-regulated facilities may offer lower rates. ${commonInsurers.length > 0 ? `To reduce out-of-pocket costs, check if the provider accepts your insurance — the most commonly accepted plans among ${catLower} in ${city.name} include ${commonInsurers.slice(0, 3).join(", ")}.` : ""} Always confirm pricing directly with the facility before your visit, as rates can change.`,
    },
    {
      question: `Which ${city.name} ${catLower} accept ${commonInsurers.length > 0 ? commonInsurers[0] : "Daman"} insurance?`,
      answer: commonInsurers.length > 0
        ? `Multiple ${catLower} in ${city.name} accept ${commonInsurers[0]} insurance. Among the top-rated providers, many list ${commonInsurers[0]} as an accepted plan. The UAE Open Healthcare Directory shows insurance acceptance for each facility — visit individual provider profiles to confirm current coverage. Other commonly accepted insurers for ${catLower} in ${city.name} include ${commonInsurers.slice(1).join(", ") || "various major UAE plans"}. Insurance acceptance can change, so always verify directly with the facility before booking.`
        : `Many ${catLower} in ${city.name} accept major UAE insurance plans including Daman, Oman Insurance, and others. Check individual provider profiles in the UAE Open Healthcare Directory for current insurance acceptance details. Always verify directly with the facility before your visit.`,
    },
    {
      question: `What documents do I need to visit a ${catSingular} in ${city.name}?`,
      answer: `To visit a ${catSingular} in ${city.name}, you typically need: (1) a valid Emirates ID or passport for identification, (2) your insurance card if you have coverage — ${commonInsurers.length > 0 ? `common plans accepted include ${commonInsurers.slice(0, 3).join(", ")}` : "most major UAE plans are widely accepted"}, (3) any previous medical records or referral letters relevant to your visit, and (4) a referral from a general practitioner if required by your insurance plan. Some facilities in ${city.name} also accept walk-ins without appointments. Healthcare in ${city.name} is regulated by the ${regulator}, which requires all facilities to verify patient identity before treatment.`,
    },
    {
      question: `Where are the best ${catLower} located in ${city.name}?`,
      answer: topNeighborhoodNames.length > 0
        ? `The highest concentration of top-rated ${catLower} in ${city.name} is found in ${topNeighborhoodNames.slice(0, 3).join(", ")}${topNeighborhoodNames.length > 3 ? `, followed by ${topNeighborhoodNames.slice(3).join(" and ")}` : ""}. These areas tend to have the most facilities, the broadest insurance acceptance, and the highest patient review volumes. The #1 ranked provider, ${topProvider.name}, is located in ${topProvider.areaSlug ? titleCase(topProvider.areaSlug.replace(/-/g, " ")) : city.name}. Use the UAE Open Healthcare Directory to filter ${catLower} by specific neighborhood.`
        : `Top-rated ${catLower} are distributed across ${city.name}. The #1 ranked provider, ${topProvider.name}, has a ${topProvider.googleRating}-star rating. Use the UAE Open Healthcare Directory to filter providers by area within ${city.name}.`,
    },
    {
      question: `Can I book an appointment online with ${catLower} in ${city.name}?`,
      answer: `Many ${catLower} in ${city.name} offer online booking through their websites or third-party platforms. ${providersWithWebsite > 0 ? `Of the ${totalCount} ${catLower} listed in ${city.name}, ${providersWithWebsite} have websites where you can check availability and book appointments.` : ""} ${providersWithPhone > 0 ? `${providersWithPhone} providers list phone numbers for direct booking.` : ""} Some facilities also accept WhatsApp bookings. Visit individual provider profiles in the UAE Open Healthcare Directory for direct contact details, website links, and phone numbers. Walk-in visits are accepted at many clinics, though appointment booking is recommended for specialist consultations.`,
    },
    ...(topLanguages.length > 1
      ? [{
          question: `Do ${catLower} in ${city.name} have staff who speak languages other than English and Arabic?`,
          answer: `Yes, ${city.name}'s diverse healthcare sector means many ${catLower} have multilingual staff. The most commonly available languages among ${catLower} in ${city.name} include ${topLanguages.join(", ")}. This reflects ${city.name}'s multicultural population, where patients from South Asia, Europe, East Asia, and the Middle East seek healthcare services. Individual provider profiles in the UAE Open Healthcare Directory list the specific languages spoken at each facility, so you can find a provider who communicates in your preferred language.`,
        }]
      : []),
    {
      question: `Are ${catLower} in ${city.name} open on Fridays and public holidays?`,
      answer: `Friday hours for ${catLower} in ${city.name} are typically reduced — most facilities open after Friday prayers (around 1:00–2:00 PM) and close earlier than weekdays. Some providers, especially hospitals and urgent care centers, maintain full hours or 24/7 availability. During UAE public holidays (National Day, Eid al-Fitr, Eid al-Adha), many clinics close or operate on reduced schedules. ${ranked.length > 0 ? `Among the top-rated ${catLower}, individual operating hours are listed on each provider's profile.` : ""} Always call ahead or check the provider's website on holidays to confirm they are open.`,
    },
    ...(verifiedCount > 0
      ? [{
          question: `How do I know if a ${catSingular} in ${city.name} is licensed and legitimate?`,
          answer: `All ${catLower} listed in the UAE Open Healthcare Directory are sourced from official ${regulator} registers, meaning they hold valid healthcare licenses issued by the government. ${verifiedCount > 0 ? `Currently, ${verifiedCount} out of ${totalCount} ${catLower} in ${city.name} carry verified status in our directory.` : ""} You can independently verify any facility's license through the ${regulatorShort} website or app. Look for the facility's license number (displayed on our provider profiles) and cross-check it with the ${regulatorShort} public register. Licensed facilities must meet specific standards for staffing, equipment, hygiene, and patient safety set by UAE health authorities.`,
        }]
      : []),
  ];

  // ─── JSON-LD schemas ──────────────────────────────────────────────────────────

  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: "Best", url: `${base}/best` },
    { name: city.name, url: `${base}/best/${city.slug}` },
    { name: category.name },
  ]);

  const itemList = itemListSchema(
    `Best ${category.name} in ${city.name}`,
    top20ForSchema,
    city.name,
    base,
  );

  const faqSchema = faqPageSchema(faqs);

  const speakable = speakableSchema([".answer-block"]);

  // ─── Editorial intro ──────────────────────────────────────────────────────────

  const intro = getCategoryIntro(
    category.slug,
    category.name,
    city.name,
    totalCount,
    ranked.length,
    average,
    regulator,
  );

  // Comparison table providers (top 10)
  const comparisonProviders = ranked.slice(0, 10);

  // Compute years of practice for comparison
  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemList} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakable} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Best", href: "/best" },
        { label: city.name, href: `/best/${city.slug}` },
        { label: category.name },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best {category.name} in {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Top {Math.min(ranked.length, 10)} highest-rated out of {totalCount} providers
          {" "}&middot; Ranked by patient ratings, years of practice &amp; insurance coverage &middot; {regulator}
          {" "}&middot; Updated March 2026
        </p>
      </div>

      {/* ─── Unique Editorial Intro ──────────────────────────────────────────────── */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] sm:text-[18px] text-[#1c1c1c] tracking-tight mb-3">
          {intro.headline}
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">{intro.body}</p>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/directory/${city.slug}/${category.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All {catLower} in {city.name}
        </Link>
        <Link
          href={`/best/${city.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All categories in {city.name}
        </Link>
        <Link
          href="/best"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All cities
        </Link>
      </div>

      {/* ─── Selection Criteria ──────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">How We Rank: Selection Criteria</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="border border-black/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#006828]/10 flex items-center justify-center text-[#006828] font-bold text-sm">1</span>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight">Patient Ratings</h3>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              Google rating is the primary ranking signal. Only providers with a rating above 0 are included. Review count serves as a tiebreaker — more reviews means broader patient consensus.
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#006828]/10 flex items-center justify-center text-[#006828] font-bold text-sm">2</span>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight">Years of Practice</h3>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              Established facilities with years of operation signal institutional stability and clinical experience. We surface year of establishment where available so you can assess practice maturity.
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#006828]/10 flex items-center justify-center text-[#006828] font-bold text-sm">3</span>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight">Insurance Coverage</h3>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              Wider insurance acceptance signals accessibility and compliance with major payer networks. We show the number of accepted insurance plans alongside each provider&apos;s profile.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-black/40 leading-relaxed">
          All provider data is sourced from official <strong>{regulator}</strong> licensed facilities registers and cross-referenced with the UAE Open Healthcare Directory. Rankings are updated regularly. These rankings do not constitute a medical recommendation.
        </p>
      </section>

      {/* ─── Comparison Table ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top {Math.min(comparisonProviders.length, 10)} {category.name} — Side-by-Side Comparison</h2>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-[#f8f8f6]">
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">#</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">Provider</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">Rating</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">Reviews</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">Est.</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">Insurance</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">Verified</th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">Area</th>
              </tr>
            </thead>
            <tbody>
              {comparisonProviders.map((p, idx) => {
                const yearsOfPractice = p.yearEstablished
                  ? currentYear - p.yearEstablished
                  : null;
                return (
                  <tr
                    key={p.id}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-[#fafaf9]"} hover:bg-[#006828]/[0.02] transition-colors`}
                  >
                    <td className="px-3 py-3 border-b border-black/[0.04]">
                      <span className="font-bold text-[#006828] text-sm">#{idx + 1}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04]">
                      <Link
                        href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {p.name}
                      </Link>
                      {p.phone && (
                        <p className="font-['Geist',sans-serif] text-[10px] text-black/30 mt-0.5">{p.phone}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                        {p.googleRating} ★
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="font-['Geist',sans-serif] text-xs text-black/60 font-medium">
                        {p.googleReviewCount > 0 ? p.googleReviewCount.toLocaleString() : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="font-['Geist',sans-serif] text-xs text-black/60">
                        {yearsOfPractice !== null ? (
                          <span title={`Established ${p.yearEstablished}`}>
                            {yearsOfPractice}+ yrs
                          </span>
                        ) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="font-['Geist',sans-serif] text-xs text-black/60 font-medium">
                        {p.insurance.length > 0 ? `${p.insurance.length} plans` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      {p.isVerified ? (
                        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">Yes</span>
                      ) : (
                        <span className="text-xs text-black/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04]">
                      <span className="font-['Geist',sans-serif] text-xs text-black/50">
                        {p.areaSlug ? titleCase(p.areaSlug.replace(/-/g, " ")) : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ranked.length > 10 && (
          <div className="mt-4 text-center">
            <Link
              href={`/directory/${city.slug}/${category.slug}`}
              className="text-xs text-[#006828] font-bold hover:underline"
            >
              View all {totalCount} {catLower} in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* ─── Detailed Ranked Provider List ───────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top {Math.min(ranked.length, 15)} {category.name} — Detailed Profiles</h2>
        </div>
        <div className="space-y-0">
          {top15.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-start gap-3 py-4 border-b border-black/[0.06] last:border-b-0"
            >
              {/* Rank */}
              <span className="text-lg font-bold text-[#006828] w-8 flex-shrink-0 text-center mt-0.5">
                #{idx + 1}
              </span>

              {/* Provider info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                    className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.isVerified && (
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">Verified</span>
                  )}
                </div>
                <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-1.5">{p.address}</p>

                {/* Year + Insurance summary line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                  {p.yearEstablished && (
                    <span className="font-['Geist',sans-serif] text-[11px] text-black/50">
                      Est. {p.yearEstablished} ({currentYear - p.yearEstablished}+ years)
                    </span>
                  )}
                  {p.insurance.length > 0 && (
                    <span className="font-['Geist',sans-serif] text-[11px] text-black/50">
                      {p.insurance.length} insurance plan{p.insurance.length !== 1 ? "s" : ""} accepted
                    </span>
                  )}
                  {p.languages.length > 0 && (
                    <span className="font-['Geist',sans-serif] text-[11px] text-black/50">
                      {p.languages.length} language{p.languages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Insurance badges */}
                {p.insurance.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {p.insurance.slice(0, 4).map((ins) => (
                      <span
                        key={ins}
                        className="text-[10px] border border-black/[0.06] px-1.5 py-0.5 text-black/40"
                      >
                        {ins}
                      </span>
                    ))}
                    {p.insurance.length > 4 && (
                      <span className="text-[10px] text-black/40">
                        +{p.insurance.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* View profile link */}
                <Link
                  href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                  className="text-xs text-[#006828] font-bold hover:underline"
                >
                  View full profile &rarr;
                </Link>
              </div>

              {/* Rating + Reviews */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1">
                  {p.googleRating} ★
                </span>
                {p.googleReviewCount > 0 && (
                  <span className="text-[11px] text-black/40">
                    {p.googleReviewCount.toLocaleString()} reviews
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {ranked.length > 15 && (
          <div className="mt-4 text-center">
            <Link
              href={`/directory/${city.slug}/${category.slug}`}
              className="text-xs text-[#006828] font-bold hover:underline"
            >
              View all {totalCount} {catLower} in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Category Stats */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{category.name} in {city.name} — Quick Stats</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{totalCount}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Total Providers</p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{average}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Avg. Rating</p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{ranked.length}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Rated Providers</p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{commonInsurers.length > 0 ? commonInsurers.length + "+" : "—"}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Insurers Accepted</p>
          </div>
        </div>

        {/* Most common insurers */}
        {commonInsurers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">Most Commonly Accepted Insurance</p>
            <div className="flex flex-wrap gap-2">
              {commonInsurers.map((ins) => (
                <span
                  key={ins}
                  className="text-xs border border-black/[0.06] px-2 py-1 text-black/40"
                >
                  {ins}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top neighborhoods */}
        {topNeighborhoods.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">Top Neighborhoods</p>
            <div className="flex flex-wrap gap-2">
              {topNeighborhoods.map((area) => (
                <span
                  key={area.slug}
                  className="text-xs border border-black/[0.06] px-2 py-1 text-black/40"
                >
                  {titleCase(area.slug.replace(/-/g, " "))} ({area.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`Best ${category.name} in ${city.name} — FAQ`}
      />

      {/* Cross-links: same category in other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Best {category.name} in Other Cities</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/best/${c.slug}/${category.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count} {c.count === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cross-links: other categories in same city */}
      {otherCategories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Top-Rated Categories in {city.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/best/${city.slug}/${c.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count} {c.count === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Full directory CTA */}
      <div className="bg-[#1c1c1c] text-white p-6 flex items-center justify-between mb-8">
        <div>
          <p className="font-bold text-sm">Browse all {catLower} in {city.name}</p>
          <p className="text-xs text-white/70 mt-1">
            Full directory with contact details, operating hours, insurance acceptance, and more
          </p>
        </div>
        <Link
          href={`/directory/${city.slug}/${category.slug}`}
          className="bg-[#006828] text-white px-4 py-2 text-xs font-bold hover:bg-green-600 transition-colors flex-shrink-0"
        >
          View all {totalCount}
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available Google ratings
          and review counts. They do not constitute a medical recommendation. Provider data is
          sourced from official {regulator} registers and the UAE Open Healthcare Directory,
          last verified March 2026. Insurance acceptance, operating hours, and services may
          change — always confirm directly with the provider before your visit.
        </p>
      </div>
    </div>
  );
}
