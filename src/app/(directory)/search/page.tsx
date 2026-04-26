import { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/shared/Pagination";
import { searchHealthcare } from "@/lib/search/match";
import type {
  HealthcareEntityType,
  HealthcareSearchQuery,
  HealthcareSearchResult,
} from "@/lib/search/types";
import { getCityBySlug, getCategoryBySlug } from "@/lib/data";
import { EmptyStateV2 } from "@/components/directory-v2/shared/EmptyStateV2";
import { SearchControls } from "./_components/SearchControls";
import { ArrowUpRight, UserRound, Building2, BookOpen, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Search Healthcare Providers",
  description:
    "Search UAE doctors, hospitals, clinics, and specialists by reason, condition, specialty, insurance, and language.",
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    city?: string;
    specialty?: string;
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
  if (sp.entityType && sp.entityType !== "both") params.set("entityType", sp.entityType);
  if (sp.emergency) params.set("emergency", sp.emergency);
  if (sp.reason) params.set("reason", sp.reason);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

const RESULT_ICONS: Record<string, React.ElementType> = {
  doctor: UserRound,
  facility: Building2,
  condition: BookOpen,
  insurance: ShieldCheck,
};

function ResultCard({ result, kind }: { result: HealthcareSearchResult; kind: keyof typeof RESULT_ICONS }) {
  const Icon = RESULT_ICONS[kind] ?? Building2;
  return (
    <Link
      href={result.url}
      className="group relative flex items-start gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
    >
      <div className="h-11 w-11 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-accent-deep" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-ink text-z-body leading-tight line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {result.title}
        </h3>
        {result.subtitle && (
          <p className="font-sans text-z-body-sm text-ink-muted line-clamp-2 mt-1">{result.subtitle}</p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-ink-muted group-hover:text-ink group-hover:rotate-0 transition-all flex-shrink-0" />
    </Link>
  );
}

function ResultGroup({
  title,
  kind,
  results,
  countLabel,
}: {
  title: string;
  kind: keyof typeof RESULT_ICONS;
  results: HealthcareSearchResult[];
  countLabel?: string;
}) {
  if (results.length === 0) return null;
  return (
    <section>
      <header className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display font-semibold text-ink text-z-h1 tracking-[-0.012em]">{title}</h2>
        {countLabel && (
          <span className="font-sans text-z-body-sm text-ink-muted">{countLabel}</span>
        )}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 z-stagger">
        {results.map((r) => (
          <ResultCard key={`${r.kind}:${r.url}`} result={r} kind={kind} />
        ))}
      </div>
    </section>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawPage = Number(searchParams.page ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
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
  const specialtyName = specialty ? getCategoryBySlug(specialty)?.name : undefined;

  const hasAnyActive = Boolean(
    query.query || query.city || query.specialty || query.condition ||
    query.insurance || query.language || query.emergency
  );

  const visibleResults =
    results.facilities.length + results.doctors.length +
    results.conditions.length + results.insuranceHubs.length;
  const totalResults =
    results.totalFacilities + results.totalDoctors +
    results.conditions.length + results.insuranceHubs.length;
  const pageSize = 12;
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(results.totalFacilities, results.totalDoctors, 1) / pageSize)
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-32 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8">
          <header className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Search
            </p>
            <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.02] tracking-[-0.028em]">
              {hasAnyActive
                ? `${totalResults} ${totalResults === 1 ? "result" : "results"}${
                    query.query ? ` for "${query.query}"` : ""
                  }${specialtyName ? ` · ${specialtyName}` : ""}${
                    cityName ? ` in ${cityName}` : ""
                  }.`
                : "Find the right care."}
            </h1>
            {!hasAnyActive && (
              <p className="font-sans text-ink-soft text-z-body sm:text-[17px] mt-4 leading-relaxed">
                Search by reason, specialty, city, insurance, or language — across 12,500+ verified healthcare providers in the UAE.
              </p>
            )}
          </header>

          <SearchControls
            initialQuery={query.query ?? ""}
            initialCity={query.city ?? ""}
            initialSpecialty={specialty ?? ""}
            initialCondition={query.condition ?? ""}
            initialInsurance={query.insurance ?? ""}
            initialLanguage={query.language ?? ""}
            initialEntityType={query.entityType ?? "both"}
            initialEmergency={!!query.emergency}
            totalResults={totalResults}
          />
        </div>
      </section>

      {/* Results */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {hasAnyActive && results.widened && totalResults > 0 && (
          <div className="mb-6 rounded-z-md bg-accent-muted border border-accent/20 px-5 py-3">
            <p className="font-sans text-z-body-sm text-accent-deep">
              No exact matches — showing closest results.
            </p>
          </div>
        )}

        {visibleResults > 0 ? (
          <div className="space-y-12">
            <ResultGroup
              title="Doctors"
              kind="doctor"
              results={results.doctors}
              countLabel={
                results.totalDoctors > results.doctors.length
                  ? `${results.totalDoctors.toLocaleString()} total`
                  : undefined
              }
            />
            <ResultGroup
              title="Facilities"
              kind="facility"
              results={results.facilities}
              countLabel={
                results.totalFacilities > results.facilities.length
                  ? `${results.totalFacilities.toLocaleString()} total`
                  : undefined
              }
            />
            <ResultGroup title="Care guides" kind="condition" results={results.conditions} />
            <ResultGroup title="Insurance networks" kind="insurance" results={results.insuranceHubs} />

            <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
          </div>
        ) : totalResults > 0 ? (
          <div className="space-y-8">
            <EmptyStateV2
              title="No results on this page."
              description="Use the pagination below to go back to an earlier results page."
            />
            <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
          </div>
        ) : (
          <EmptyStateV2
            title={hasAnyActive ? "No matches for those filters." : "Start searching above."}
            description={
              hasAnyActive
                ? "Try removing a filter or widening your search by city or specialty."
                : "Use the search pill above to filter by specialty, city, insurance, language or condition."
            }
            actionLabel={hasAnyActive ? "Clear all filters" : undefined}
          />
        )}

        {/* Popular shortcuts when nothing searched */}
        {!hasAnyActive && (
          <div className="mt-10">
            <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-4">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Hospitals in Dubai", href: "/directory/dubai/hospitals" },
                { label: "Dentists in Abu Dhabi", href: "/directory/abu-dhabi/dental" },
                { label: "Pharmacies in Sharjah", href: "/directory/sharjah/pharmacy" },
                { label: "Pediatrics in Dubai", href: "/directory/dubai/pediatrics" },
                { label: "Eye care in Al Ain", href: "/directory/al-ain/ophthalmology" },
                { label: "24-hour clinics", href: "/directory/dubai/24-hour" },
                { label: "Walk-in clinics", href: "/directory/dubai/walk-in" },
                { label: "Emergency care", href: "/directory/dubai/emergency" },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
