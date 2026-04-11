import { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { searchHealthcare } from "@/lib/search/match";
import type {
  HealthcareEntityType,
  HealthcareSearchQuery,
  HealthcareSearchResult,
} from "@/lib/search/types";
import { getCityBySlug, getCategoryBySlug } from "@/lib/data";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { CONDITIONS } from "@/lib/constants/conditions";
import { LANGUAGES } from "@/lib/constants/languages";

/**
 * Search results page.
 *
 * Part of Zocdoc Roadmap Item 9 (Codex Rec 5). Healthcare-intent search —
 * grouped results (doctors → facilities → conditions → insurance hubs) from
 * `searchHealthcare()`, with a widening fallback when the exact-filter set
 * returns nothing.
 *
 * Crawl discipline (Item 0): this page is `noindex,follow` and is NOT in any
 * sitemap. `robots.ts` disallows `/search`. Do not re-add it.
 */
export const metadata: Metadata = {
  title: "Search Healthcare Providers",
  description: "Search UAE doctors, hospitals, clinics, and specialists by reason, condition, specialty, insurance, and language.",
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    city?: string;
    /** New: preferred specialty key. */
    specialty?: string;
    /** Legacy: older homepage links used `category`. Accept both. */
    category?: string;
    condition?: string;
    insurance?: string;
    language?: string;
    area?: string;
    entityType?: string;
    emergency?: string;
    reason?: string;
    page?: string;
  };
}

function coerceEntityType(raw?: string): HealthcareEntityType {
  if (raw === "doctor" || raw === "facility") return raw;
  return "both";
}

function buildBaseUrl(sp: SearchPageProps["searchParams"]): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.city) params.set("city", sp.city);
  if (sp.specialty) params.set("specialty", sp.specialty);
  else if (sp.category) params.set("specialty", sp.category);
  if (sp.condition) params.set("condition", sp.condition);
  if (sp.insurance) params.set("insurance", sp.insurance);
  if (sp.language) params.set("language", sp.language);
  if (sp.area) params.set("area", sp.area);
  if (sp.entityType) params.set("entityType", sp.entityType);
  if (sp.emergency) params.set("emergency", sp.emergency);
  if (sp.reason) params.set("reason", sp.reason);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

function ResultCard({ result }: { result: HealthcareSearchResult }) {
  return (
    <Link
      href={result.url}
      className="group block border border-black/[0.06] bg-white hover:border-[#006828]/20 hover:bg-[#006828]/[0.02] transition-colors rounded-xl p-4"
    >
      <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors line-clamp-2">
        {result.title}
      </h3>
      {result.subtitle && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-2">
          {result.subtitle}
        </p>
      )}
    </Link>
  );
}

function ResultGroup({
  title,
  results,
  countLabel,
}: {
  title: string;
  results: HealthcareSearchResult[];
  countLabel?: string;
}) {
  if (results.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {title}
        </h2>
        {countLabel && (
          <span className="font-['Geist',sans-serif] text-xs text-black/40">{countLabel}</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((r) => (
          <ResultCard key={`${r.kind}:${r.url}`} result={r} />
        ))}
      </div>
    </section>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Item 0.5: SSR pagination — page N renders directly server-side.
  const rawPage = Number(searchParams.page ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  // Back-compat: accept the legacy `category` param and map it to `specialty`.
  const specialty = searchParams.specialty || searchParams.category;

  const query: HealthcareSearchQuery = {
    query: searchParams.q,
    city: searchParams.city,
    specialty,
    condition: searchParams.condition,
    insurance: searchParams.insurance,
    language: searchParams.language,
    area: searchParams.area,
    entityType: coerceEntityType(searchParams.entityType),
    emergency: searchParams.emergency === "true" || searchParams.emergency === "1",
    reason: searchParams.reason,
    page,
  };

  const results = await searchHealthcare(query);

  const baseUrl = buildBaseUrl(searchParams);
  const cityName = query.city ? getCityBySlug(query.city)?.name : undefined;
  const categoryName = specialty ? getCategoryBySlug(specialty)?.name : undefined;
  const insuranceName = query.insurance
    ? INSURANCE_PROVIDERS.find((i) => i.slug === query.insurance)?.name
    : undefined;
  const conditionName = query.condition
    ? CONDITIONS.find((c) => c.slug === query.condition)?.name
    : undefined;
  const languageName = query.language
    ? LANGUAGES.find((l) => l.slug === query.language)?.name
    : undefined;

  const hasAnyActive = Boolean(
    query.query ||
      query.city ||
      query.specialty ||
      query.condition ||
      query.insurance ||
      query.language ||
      query.emergency
  );

  const totalResults =
    results.facilities.length +
    results.doctors.length +
    results.conditions.length +
    results.insuranceHubs.length;
  const pageSize = 12;
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(results.totalFacilities, results.totalDoctors, 1) / pageSize)
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">
          Search Healthcare Providers
        </h1>
        <SearchBar
          defaultQuery={query.query}
          defaultCity={query.city}
          defaultCategory={specialty}
          defaultCondition={query.condition}
          defaultInsurance={query.insurance}
          defaultLanguage={query.language}
          defaultEntityType={query.entityType}
          defaultEmergency={query.emergency}
        />

        {/* Popular searches — show when no active query */}
        {!hasAnyActive && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">Popular:</span>
            {[
              { label: "Hospitals in Dubai", href: "/directory/dubai/hospitals" },
              { label: "Dental in Abu Dhabi", href: "/directory/abu-dhabi/dental" },
              { label: "Pharmacies in Sharjah", href: "/directory/sharjah/pharmacy" },
              { label: "Clinics in Dubai", href: "/directory/dubai/clinics" },
              { label: "Eye Care in Dubai", href: "/directory/dubai/ophthalmology" },
              { label: "Pediatrics in Abu Dhabi", href: "/directory/abu-dhabi/pediatrics" },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="text-xs px-3 py-1.5 border border-black/[0.06] text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors rounded-full"
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Results Header — dynamic summary of active filters */}
      {hasAnyActive && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
              {query.query && <span> for &ldquo;{query.query}&rdquo;</span>}
              {categoryName && <span> in {categoryName}</span>}
              {conditionName && <span> · {conditionName}</span>}
              {cityName && <span> in {cityName}</span>}
              {insuranceName && <span> accepting {insuranceName}</span>}
              {languageName && <span> speaking {languageName}</span>}
              {query.emergency && <span> · emergency</span>}
            </h2>
          </div>
          {results.widened && totalResults > 0 && (
            <div className="mb-4 border-l-4 border-[#c68a00] bg-[#c68a00]/[0.06] rounded-xl py-3 px-4">
              <p className="font-['Geist',sans-serif] text-sm text-black/60">
                No exact matches — here are some related providers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result groups — doctors first, facilities, conditions, insurance hubs */}
      {totalResults > 0 ? (
        <>
          <ResultGroup
            title="Doctors"
            results={results.doctors}
            countLabel={
              results.totalDoctors > results.doctors.length
                ? `${results.totalDoctors.toLocaleString()} total`
                : undefined
            }
          />
          <ResultGroup
            title="Facilities"
            results={results.facilities}
            countLabel={
              results.totalFacilities > results.facilities.length
                ? `${results.totalFacilities.toLocaleString()} total`
                : undefined
            }
          />
          <ResultGroup title="Care guides" results={results.conditions} />
          <ResultGroup title="Insurance networks" results={results.insuranceHubs} />

          <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
        </>
      ) : (
        <div className="text-center py-16 border border-black/[0.06] bg-[#f8f8f6] rounded-2xl">
          <div className="w-12 h-12 bg-[#006828]/[0.04] flex items-center justify-center mx-auto mb-4 rounded-full">
            <span className="text-[#006828] text-xl font-bold">?</span>
          </div>
          <h2 className="text-xl font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
            No results found
          </h2>
          <p className="text-black/40 mb-6 font-['Geist',sans-serif] text-sm">
            Try adjusting your filters or widening the search.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/search" className="btn-accent">Clear Search</Link>
            <Link href="/directory" className="btn-dark">Browse Directory</Link>
          </div>
        </div>
      )}
    </div>
  );
}
