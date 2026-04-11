import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/shared/Pagination";
import {
  getCityBySlug, getCities, getCategories,
  getInsuranceProviders, getProvidersByInsurance, getProviderCountByInsurance,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
  truncateTitle, truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  DUO_FACET_MIN_PROVIDERS,
  getInsurancePlansByGeo,
  INSURANCE_DATA_VERIFIED_AT,
} from "@/lib/insurance-facets/data";

export const revalidate = 21600;

// SSR pagination (Item 0.5). `getProvidersByInsurance` returns the full
// in-scope list, so we slice in-memory per page.
const INSURANCE_PAGE_SIZE = 30;

function parsePage(searchParams?: { page?: string }): number {
  const raw = Number(searchParams?.page ?? "1");
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

interface Props {
  params: { city: string; insurer: string };
  searchParams?: { page?: string };
}

// ─── Regulator helpers ────────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getMandatoryNote(citySlug: string): string {
  if (citySlug === "dubai")
    return "Dubai mandates health insurance for all residents and employees under the Dubai Health Insurance Law.";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Abu Dhabi requires mandatory health insurance for all residents and UAE nationals under DOH regulations.";
  return `Health insurance in ${citySlug.replace(/-/g, " ")} follows UAE federal MOHAP guidelines; while not locally mandated, most employers provide group cover.`;
}

function getInsurerTypeLabel(type: string): string {
  switch (type) {
    case "mandatory": return "Mandatory / Government";
    case "premium": return "Government Premium";
    case "tpa": return "Third-Party Administrator";
    default: return "Private";
  }
}

export const dynamicParams = true;

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const insurer = getInsuranceProviders().find((i) => i.slug === params.insurer);
  if (!insurer) return {};
  const count = await getProviderCountByInsurance(insurer.slug, city.slug);
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const page = parsePage(searchParams);
  const pageSuffix = page > 1 ? `?page=${page}` : "";
  const titlePageSuffix = page > 1 ? ` | Page ${page}` : "";
  const urlBase = `${base}/directory/${city.slug}/insurance/${insurer.slug}`;
  const url = `${urlBase}${pageSuffix}`;

  // Geo gate — Thiqa & other geo-scoped plans never index outside their scope.
  const geoEligible = getInsurancePlansByGeo(city.slug).some((p) => p.slug === insurer.slug);
  // Content gate — below min provider count, keep the URL live but noindex.
  const contentEligible = count >= DUO_FACET_MIN_PROVIDERS;
  const isIndexable = geoEligible && contentEligible;

  const rawTitle = `Clinics Accepting ${insurer.name} Insurance in ${city.name} | ${count} ${count === 1 ? "Provider" : "Providers"}${titlePageSuffix}`;
  const rawDescription = `Find ${count} ${regulator}-licensed healthcare providers in ${city.name} that accept ${insurer.name} insurance. Includes hospitals, clinics, dental, dermatology & more. Verified listings with ratings, reviews, and contact details. Last verified ${INSURANCE_DATA_VERIFIED_AT}.`;
  const title = truncateTitle(rawTitle, 58);
  const description = truncateDescription(rawDescription, 155);

  return {
    title,
    description,
    alternates: {
      // Self-canonical per paginated page (Item 0.5). Below-gate pages still
      // canonical to the 2-facet parent without ?page=N.
      canonical: isIndexable ? url : `${base}/insurance/${insurer.slug}`,
    },
    robots: isIndexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: truncateTitle(`${insurer.name} Insurance — ${count} Providers in ${city.name}${titlePageSuffix}`, 58),
      description: truncateDescription(`${count} ${regulator}-regulated providers in ${city.name} accept ${insurer.name}. Browse hospitals, clinics, dental & specialists — last verified ${INSURANCE_DATA_VERIFIED_AT}.`, 155),
      url,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InsuranceProviderPage({ params, searchParams }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const allInsurers = getInsuranceProviders();
  const insurer = allInsurers.find((i) => i.slug === params.insurer);
  if (!insurer) notFound();

  const providers = await getProvidersByInsurance(insurer.slug, city.slug);
  const count = providers.length;
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const mandatoryNote = getMandatoryNote(city.slug);

  // ─── SSR pagination (Item 0.5) ─────────────────────────────────────────────
  // Slice the in-memory list so `?page=N` is server-rendered rather than
  // hidden behind client fetch. Past-last-page → 404 so Googlebot doesn't
  // index empty shells.
  const currentPage = parsePage(searchParams);
  const totalPages = Math.max(1, Math.ceil(count / INSURANCE_PAGE_SIZE));
  if (count > 0 && currentPage > totalPages) notFound();
  const pageStart = (currentPage - 1) * INSURANCE_PAGE_SIZE;
  const pagedProviders = providers.slice(pageStart, pageStart + INSURANCE_PAGE_SIZE);

  // ─── Category breakdown ─────────────────────────────────────────────────────
  const categories = getCategories();
  const catBreakdown = categories
    .map((cat) => ({
      ...cat,
      insurerCount: providers.filter((p) => p.categorySlug === cat.slug).length,
    }))
    .filter((c) => c.insurerCount > 0)
    .sort((a, b) => b.insurerCount - a.insurerCount);

  // ─── Top-rated providers ─────────────────────────────────────────────────────
  const topRated = [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 5);

  // ─── Other cities this insurer is accepted in ────────────────────────────────
  const otherCitiesRaw = getCities().filter((c) => c.slug !== city.slug);
  const otherCityCounts = await Promise.all(
    otherCitiesRaw.map((c) => getProviderCountByInsurance(insurer.slug, c.slug))
  );
  const otherCities = otherCitiesRaw
    .map((c, i) => ({ ...c, count: otherCityCounts[i] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ─── Related insurers in this city (top 5 by name proximity, pre-computed) ──
  const popularSlugs = ["daman", "axa", "cigna", "bupa", "oman-insurance", "nas", "mednet", "orient", "dic", "takaful-emarat"];
  const relatedInsurersRaw = allInsurers
    .filter((i) => i.slug !== insurer.slug && popularSlugs.includes(i.slug))
    .slice(0, 5);
  const relatedInsurerCounts = await Promise.all(
    relatedInsurersRaw.map((i) => getProviderCountByInsurance(i.slug, city.slug))
  );
  const relatedInsurers = relatedInsurersRaw
    .map((i, idx) => ({ ...i, count: relatedInsurerCounts[idx] }))
    .filter((i) => i.count > 0);

  // ─── Rich answer paragraph ────────────────────────────────────────────────────
  const topCategory = catBreakdown[0];
  const coverageNote =
    insurer.type === "mandatory"
      ? `As a mandatory government insurer, ${insurer.name} is the backbone of UAE employer health coverage.`
      : insurer.type === "premium"
      ? `${insurer.name} is a premium government programme for UAE nationals, providing full coverage at no cost.`
      : `${insurer.name} is a ${getInsurerTypeLabel(insurer.type).toLowerCase()} insurer widely accepted across the UAE.`;

  const answerParagraph = count > 0
    ? `According to the UAE Open Healthcare Directory, ${count} ${regulator}-licensed healthcare ${count === 1 ? "provider" : "providers"} in ${city.name} accept ${insurer.name} insurance. ${mandatoryNote} ${coverageNote}${topCategory ? ` The majority of ${insurer.name} providers in ${city.name} fall under the ${topCategory.name} category (${topCategory.insurerCount} ${topCategory.insurerCount === 1 ? "provider" : "providers"}).` : ""} Provider licenses are sourced from the official ${regulator} register. Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit. Last verified ${INSURANCE_DATA_VERIFIED_AT}.`
    : `${insurer.name} insurance data for ${city.name} is currently being compiled. ${mandatoryNote} ${coverageNote} Check back soon, or browse the full ${city.name} provider directory below.`;

  // ─── FAQs ────────────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: `Does ${insurer.name} cover healthcare in ${city.name}?`,
      answer: `Yes. ${insurer.name} insurance is accepted at ${count} healthcare ${count === 1 ? "provider" : "providers"} in ${city.name}, UAE, regulated by the ${regulator}. ${insurer.description} Use the UAE Open Healthcare Directory to find specific clinics, hospitals, and specialists that accept ${insurer.name} in ${city.name}.`,
    },
    {
      question: `How many providers accept ${insurer.name} in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} ${regulator}-licensed healthcare ${count === 1 ? "provider" : "providers"} in ${city.name} that accept ${insurer.name} insurance. This includes hospitals, clinics, dental practices, specialist centers, and diagnostics labs. Provider licenses are sourced from the official ${regulator} register. Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit. Last verified ${INSURANCE_DATA_VERIFIED_AT}.`,
    },
    {
      question: `What is the co-pay for ${insurer.name} in ${city.name}?`,
      answer: `Co-pay rates for ${insurer.name} in ${city.name} vary by plan tier and facility type. ${insurer.type === "mandatory" ? `For the standard Daman Essential Benefits Plan (EBP) in Dubai, the outpatient co-pay is typically 20% (capped at AED 500/year). Enhanced plans may have lower or zero co-pay.` : insurer.type === "premium" ? `Thiqa provides near-zero co-pay for UAE nationals at all government and most private facilities in ${city.name}.` : `Most private insurer plans charge 10–20% co-pay for outpatient visits. Check your specific ${insurer.name} plan schedule for exact rates.`} Contact ${insurer.name} or your HR broker for your policy's exact co-pay schedule.`,
    },
    {
      question: `Does ${insurer.name} cover emergency care in ${city.name}?`,
      answer: `Yes, emergency care is covered under all ${insurer.name} plans in ${city.name}. In the UAE, emergency treatment cannot be refused at any ${regulator}-licensed facility. ${insurer.type === "mandatory" || insurer.type === "premium" ? `${insurer.name} covers emergency services at all government and most private hospitals in ${city.name}.` : `For ${insurer.name}, emergency treatment at any hospital in ${city.name} is covered — pre-authorisation is not required for genuine emergencies.`}`,
    },
    {
      question: `Can I use ${insurer.name} insurance at hospitals in ${city.name}?`,
      answer: `Yes — ${providers.filter((p) => p.categorySlug === "hospitals").length} hospital${providers.filter((p) => p.categorySlug === "hospitals").length !== 1 ? "s" : ""} in ${city.name} accept ${insurer.name} insurance according to the UAE Open Healthcare Directory. Always verify directly with the hospital's insurance desk before your visit, as network inclusion can change. You can browse all ${insurer.name}-accepting hospitals in ${city.name} on this page.`,
    },
    {
      question: `What specialists accept ${insurer.name} insurance in ${city.name}?`,
      answer: `${insurer.name} is accepted by a wide range of specialists in ${city.name}${catBreakdown.length > 0 ? `, including: ${catBreakdown.slice(0, 5).map((c) => `${c.name} (${c.insurerCount})`).join(", ")}` : ""}. Browse the UAE Open Healthcare Directory listings above to filter by specialty and find the right provider for your needs. All providers are ${regulator}-licensed.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Insurance", url: `${base}/directory/${city.slug}/insurance` },
        { name: insurer.name },
      ])} />
      {providers.length > 0 && (
        <JsonLd data={itemListSchema(`Healthcare Providers Accepting ${insurer.name} in ${city.name}`, providers.slice(0, 20), city.name, base)} />
      )}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance", href: `/directory/${city.slug}/insurance` },
        { label: insurer.name },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {insurer.name} Insurance — Healthcare Providers in {city.name}
          </h1>
          <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0 mt-1">{insurer.type}</span>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {count} verified {count === 1 ? "provider" : "providers"} · {regulator} licensed · Last updated {INSURANCE_DATA_VERIFIED_AT}
        </p>
      </div>

      {/* Answer Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{answerParagraph}</p>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/directory/${city.slug}/insurance`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All insurance in {city.name}
        </Link>
        <Link
          href={`/insurance/${insurer.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          {insurer.name} plans &amp; coverage
        </Link>
        <Link
          href="/insurance/compare"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          Compare insurers
        </Link>
      </div>

      {/* Category Breakdown */}
      {catBreakdown.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Providers by Category</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {catBreakdown.map((cat) => (
              <Link
                key={cat.slug}
                href={`/directory/${city.slug}/${cat.slug}`}
                className="flex items-center gap-2 border border-black/[0.06] px-3 py-2 hover:border-[#006828]/15 group transition-colors"
              >
                <span className="text-xs font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  {cat.name}
                </span>
                <span className="bg-[#006828] text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                  {cat.insurerCount}
                </span>
              </Link>
            ))}
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-3">
            Showing {catBreakdown.length} {catBreakdown.length === 1 ? "category" : "categories"} with {insurer.name}-accepting providers in {city.name}.
            Click a category to browse all {city.name} providers in that specialty.
          </p>
        </section>
      )}

      {/* Top-rated section */}
      {topRated.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top-Rated {insurer.name} Providers in {city.name}</h2>
          </div>
          <div className="space-y-0">
            {topRated.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-black/[0.06] last:border-b-0">
                <span className="text-xs font-bold text-black/40 w-5 flex-shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                    className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors block truncate"
                  >
                    {p.name}
                  </Link>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 truncate">{p.address}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                    {p.googleRating} ★
                  </span>
                  {p.googleReviewCount > 0 && (
                    <span className="font-['Geist',sans-serif] text-xs text-black/40">({p.googleReviewCount.toLocaleString()})</span>
                  )}
                </div>
                <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0">{p.categorySlug.replace(/-/g, " ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All providers grid — SSR-paginated (Item 0.5) */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">All {insurer.name} Providers in {city.name}</h2>
        </div>

        {pagedProviders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedProviders.map((p) => (
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
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={`/directory/${city.slug}/insurance/${insurer.slug}`}
            />
            {count > INSURANCE_PAGE_SIZE && (
              <div className="mt-4 text-center">
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
                  Page {currentPage} of {totalPages} · {count.toLocaleString()} {insurer.name}-accepting {count === 1 ? "provider" : "providers"} in {city.name}.
                </p>
              </div>
            )}
          </>

        ) : (
          <div className="text-center py-12 border border-black/[0.06]">
            <p className="text-black/40 mb-2">No providers accepting {insurer.name} found in {city.name} yet.</p>
            <Link href={`/directory/${city.slug}`} className="text-[#006828] text-sm font-bold">
              View all healthcare providers in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* FAQs */}
      <FaqSection faqs={faqs} title={`${insurer.name} Insurance in ${city.name} — FAQ`} />

      {/* Cross-link: other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{insurer.name} in Other Emirates</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/directory/${c.slug}/insurance/${insurer.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">{c.name}</p>
                <p className="text-xs text-[#006828] font-bold mt-1">{c.count} {c.count === 1 ? "provider" : "providers"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related insurers */}
      {relatedInsurers.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Insurance Plans in {city.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedInsurers.map((ins) => (
              <Link
                key={ins.slug}
                href={`/directory/${city.slug}/insurance/${ins.slug}`}
                className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1c1c1c] text-sm">{ins.name}</h3>
                  <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">{ins.type}</span>
                </div>
                <p className="font-['Geist',sans-serif] text-xs text-black/40 line-clamp-2 mb-2">{ins.description}</p>
                <p className="text-xs font-bold text-[#006828]">
                  {ins.count} {ins.count === 1 ? "provider" : "providers"} in {city.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Compare CTA */}
      <div className="bg-[#1c1c1c] text-white p-6 flex items-center justify-between mb-8">
        <div>
          <p className="font-bold text-sm">Compare {insurer.name} with other insurers</p>
          <p className="text-xs text-white/70 mt-1">
            Side-by-side plan comparison — premiums, co-pay, dental, maternity, and network size
          </p>
        </div>
        <Link
          href="/insurance/compare"
          className="bg-[#006828] text-white px-4 py-2 text-xs font-bold hover:bg-green-600 transition-colors flex-shrink-0"
        >
          Compare plans
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Provider licenses are sourced from the official {regulator} register.
          Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit.
          For plan-specific coverage, co-pay, and pre-authorisation queries, contact {insurer.name} directly or your employer&apos;s HR broker. Last verified {INSURANCE_DATA_VERIFIED_AT}.
        </p>
      </div>
    </div>
  );
}
