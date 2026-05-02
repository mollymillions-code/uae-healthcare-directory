import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
import { safe } from "@/lib/safeData";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";

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
  const count = await safe(
    getProviderCountByInsurance(insurer.slug, city.slug),
    0,
    "ins-count-meta",
  );
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

  const providers = await safe(
    getProvidersByInsurance(insurer.slug, city.slug),
    [] as Awaited<ReturnType<typeof getProvidersByInsurance>>,
    "providersByInsurance",
  );
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

  // ─── Other cities this insurer is accepted in ────────────────────────────────
  const otherCitiesRaw = getCities().filter((c) => c.slug !== city.slug);
  const otherCityCounts = await Promise.all(
    otherCitiesRaw.map((c) =>
      safe(getProviderCountByInsurance(insurer.slug, c.slug), 0, `other-city:${c.slug}`)
    )
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
    relatedInsurersRaw.map((i) =>
      safe(getProviderCountByInsurance(i.slug, city.slug), 0, `related:${i.slug}`)
    )
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
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance", href: `/directory/${city.slug}/insurance` },
        { label: insurer.name },
      ]}
      eyebrow={`${insurer.name} · ${city.name}`}
      title={`${insurer.name} Insurance — Providers in ${city.name}.`}
      subtitle={
        <>
          {count} verified {count === 1 ? "provider" : "providers"} · {regulator} licensed · Last updated {INSURANCE_DATA_VERIFIED_AT}
        </>
      }
      aeoAnswer={answerParagraph}
      total={count}
      providers={pagedProviders.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        citySlug: p.citySlug,
        categorySlug: p.categorySlug,
        categoryName: null,
        address: p.address,
        googleRating: p.googleRating,
        googleReviewCount: p.googleReviewCount,
        isClaimed: p.isClaimed,
        isVerified: p.isVerified,
        photos: p.photos ?? null,
        coverImageUrl: p.coverImageUrl ?? null,
      }))}
      pagination={
        totalPages > 1 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/directory/${city.slug}/insurance/${insurer.slug}`}
          />
        ) : undefined
      }
      schemas={
        <>
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
        </>
      }
      belowGrid={
        <>
          {/* Category breakdown */}
          {catBreakdown.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                {insurer.name} providers by category
              </h2>
              <ul className="flex flex-wrap gap-2">
                {catBreakdown.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/directory/${city.slug}/insurance/${insurer.slug}/${cat.slug}`}
                      className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {cat.name}
                      <span className="text-ink-muted">· {cat.insurerCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other cities */}
          {otherCities.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                {insurer.name} in other emirates
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {otherCities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/directory/${c.slug}/insurance/${insurer.slug}`}
                      className="block rounded-z-md bg-white border border-ink-line px-4 py-3 hover:border-ink transition-colors text-center"
                    >
                      <p className="font-sans font-semibold text-ink text-z-body-sm">{c.name}</p>
                      <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                        {c.count} {c.count === 1 ? "provider" : "providers"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related insurers */}
          {relatedInsurers.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Other insurance plans in {city.name}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {relatedInsurers.map((ins) => (
                  <li key={ins.slug}>
                    <Link
                      href={`/directory/${city.slug}/insurance/${ins.slug}`}
                      className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {ins.name}
                      <span className="text-ink-muted">· {ins.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
              {insurer.name} in {city.name} — questions
            </h2>
            <div className="max-w-3xl">
              <FaqSection faqs={faqs} title={`${insurer.name} Insurance in ${city.name} — FAQ`} />
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-ink-line pt-4">
            <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
              <strong>Disclaimer:</strong> Provider licenses are sourced from the official {regulator} register.
              Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit.
              For plan-specific coverage, co-pay, and pre-authorisation queries, contact {insurer.name} directly or your employer&apos;s HR broker. Last verified {INSURANCE_DATA_VERIFIED_AT}.
            </p>
          </div>
        </>
      }
    />
  );
}
