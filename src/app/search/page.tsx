import { Metadata } from "next";
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
          <span className="text-sm text-muted">Sort by:</span>
          <select
            className="input-tc text-sm py-1.5 w-auto"
            defaultValue={sort || "rating"}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("sort", e.target.value);
              window.location.href = url.toString();
            }}
          >
            <option value="rating">Highest Rated</option>
            <option value="name">Name A-Z</option>
            <option value="relevance">Relevance</option>
          </select>
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
