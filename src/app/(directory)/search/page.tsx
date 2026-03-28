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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, city, category, area, page: pageStr, sort } = searchParams;
  const page = Number(pageStr) || 1;

  const { providers, total, totalPages } = await getProviders({
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">Search Healthcare Providers</h1>
        <SearchBar defaultQuery={q} defaultCity={city} defaultCategory={category} />

        {/* Popular searches — show when no active query */}
        {!q && !city && !category && (
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
              <Link key={s.href} href={s.href} className="text-xs px-3 py-1.5 border border-black/[0.06] text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors">
                {s.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            {total} result{total !== 1 ? "s" : ""} found
            {q && <span> for &ldquo;{q}&rdquo;</span>}
            {cityName && <span> in {cityName}</span>}
            {categoryName && <span> in {categoryName}</span>}
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="font-['Geist',sans-serif] text-xs text-black/40">Sort:</span>
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
                className={`text-xs px-3 py-1.5 border ${sort === s.value ? "bg-[#006828] text-white border-[#006828]" : "border-black/[0.06] text-black/40 hover:border-[#1c1c1c]"} transition-colors`}
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
        <div className="text-center py-16 border border-black/[0.06] bg-[#f8f8f6]">
          <div className="w-12 h-12 bg-[#006828]/[0.04] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#006828] text-xl font-bold">?</span>
          </div>
          <h2 className="text-xl font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">No results found</h2>
          <p className="text-black/40 mb-6">
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
