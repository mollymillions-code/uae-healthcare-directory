import { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { Pagination } from "@/components/shared/Pagination";
import { getProviders, getCityBySlug, getCategoryBySlug } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search Healthcare Providers",
  description: "Search for hospitals, clinics, dentists, and specialists across the UAE.",
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    city?: string;
    category?: string;
    area?: string;
    page?: string;
    sort?: string;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const { q, city, category, area, page: pageStr, sort } = searchParams;
  const page = Number(pageStr) || 1;

  const { providers, total, totalPages } = getProviders({
    query: q,
    citySlug: city,
    categorySlug: category,
    areaSlug: area,
    page,
    limit: 20,
    sort: (sort as "rating" | "name" | "relevance") || "rating",
  });

  const cityName = city ? getCityBySlug(city)?.name : undefined;
  const categoryName = category ? getCategoryBySlug(category)?.name : undefined;

  // Build base URL for pagination
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (category) params.set("category", category);
  if (area) params.set("area", area);
  if (sort) params.set("sort", sort);
  const baseUrl = `/search?${params.toString()}`;

  return (
    <div className="container-tc py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-4">Search Healthcare Providers</h1>
        <SearchBar defaultQuery={q} defaultCity={city} defaultCategory={category} />

        {/* Popular searches — show when no active query */}
        {!q && !city && !category && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-muted">Popular:</span>
            {[
              { label: "Hospitals in Dubai", href: "/directory/dubai/hospitals" },
              { label: "Dental in Abu Dhabi", href: "/directory/abu-dhabi/dental" },
              { label: "Pharmacies in Sharjah", href: "/directory/sharjah/pharmacy" },
              { label: "Clinics in Dubai", href: "/directory/dubai/clinics" },
              { label: "Eye Care in Dubai", href: "/directory/dubai/ophthalmology" },
              { label: "Pediatrics in Abu Dhabi", href: "/directory/abu-dhabi/pediatrics" },
            ].map((s) => (
              <Link key={s.href} href={s.href} className="text-xs px-3 py-1.5 border border-light-300 text-muted hover:border-accent hover:text-accent transition-colors">
                {s.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="mb-6">
        <div className="section-header">
          <h2>
            {total} result{total !== 1 ? "s" : ""} found
            {q && <span> for &ldquo;{q}&rdquo;</span>}
            {cityName && <span> in {cityName}</span>}
            {categoryName && <span> in {categoryName}</span>}
          </h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-muted">Sort:</span>
          {[
            { value: "name", label: "A-Z" },
            { value: "rating", label: "Top Rated" },
          ].map((s) => {
            const sortParams = new URLSearchParams();
            if (q) sortParams.set("q", q);
            if (city) sortParams.set("city", city);
            if (category) sortParams.set("category", category);
            if (area) sortParams.set("area", area);
            sortParams.set("sort", s.value);
            return (
              <Link
                key={s.value}
                href={`/search?${sortParams.toString()}`}
                className={`text-xs px-3 py-1.5 border ${sort === s.value ? "bg-accent text-white border-accent" : "border-light-300 text-muted hover:border-dark"} transition-colors`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      {providers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              name={provider.name}
              slug={provider.slug}
              citySlug={provider.citySlug}
              categorySlug={provider.categorySlug}
              address={provider.address}
              phone={provider.phone}
              website={provider.website}
              shortDescription={provider.shortDescription}
              googleRating={provider.googleRating}
              googleReviewCount={provider.googleReviewCount}
              isClaimed={provider.isClaimed}
              isVerified={provider.isVerified}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-light-200 bg-light-50">
          <div className="w-12 h-12 bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-accent text-xl font-bold">?</span>
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No results found</h2>
          <p className="text-muted mb-6">
            Try adjusting your search terms or filters.
          </p>
          <div className="flex justify-center gap-3">
            <a href="/search" className="btn-accent">Clear Search</a>
            <a href="/" className="btn-dark">Browse Directory</a>
          </div>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  );
}
