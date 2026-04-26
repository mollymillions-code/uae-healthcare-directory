"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Building2, Loader2, Search } from "lucide-react";

type ClaimSearchResult = {
  id: string;
  name: string;
  slug: string;
  address: string;
  citySlug: string;
  categorySlug: string;
  licenseNumber?: string;
  isClaimed: boolean;
};

export function ClaimProviderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClaimSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const broaderResultsHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("entityType", "facility");
    params.set("intent", "claim");
    return `/search?${params.toString()}`;
  }, [query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    setError("");
    setSearched(true);
    setResults([]);

    if (trimmed.length < 2) {
      setError("Enter at least two characters from the clinic name, address, or licence number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/claim/search?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search listings right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3"
        role="search"
        aria-label="Find your listing to claim"
      >
        <label className="sr-only" htmlFor="claim-provider-search">
          Search clinic name, address, or licence number
        </label>
        <input
          id="claim-provider-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Clinic, hospital, pharmacy, licence number..."
          className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-accent-deep hover:bg-ink text-white rounded-z-pill px-5 py-3 font-sans font-semibold text-z-body-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-z-md bg-white border border-red-200 p-4 flex items-start gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="font-sans text-z-body-sm text-red-700">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-z-md border border-ink-line divide-y divide-ink-line overflow-hidden">
          {results.map((provider) => (
            <div key={provider.id} className="bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-11 w-11 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-accent-deep" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-ink text-z-body leading-tight">
                    {provider.name}
                  </h3>
                  <p className="font-sans text-z-body-sm text-ink-muted mt-1 line-clamp-2">
                    {provider.address}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-2">
                    {[provider.citySlug, provider.categorySlug, provider.licenseNumber ? `Licence ${provider.licenseNumber}` : ""]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                </div>
                <Link
                  href={`/claim/${provider.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-z-pill bg-accent hover:bg-accent-dark text-white px-4 py-2.5 font-sans font-semibold text-z-body-sm transition-colors"
                >
                  {provider.isClaimed ? "Submit access request" : "Claim listing"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="rounded-z-md bg-surface-cream border border-ink-line p-5">
          <h3 className="font-display font-semibold text-ink text-z-h3">
            No matching listing found.
          </h3>
          <p className="font-sans text-z-body-sm text-ink-soft mt-1 leading-relaxed">
            Try a shorter clinic name or search the full directory. If the practice is not listed,
            request a new listing and include your trade licence and regulator details.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={broaderResultsHref}
              className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink text-ink hover:bg-surface-cream px-4 py-2.5 font-sans font-medium text-z-body-sm transition-colors"
            >
              View directory results
            </Link>
            <Link
              href="/request-listing"
              className="inline-flex items-center gap-2 rounded-z-pill bg-accent text-white hover:bg-accent-dark px-4 py-2.5 font-sans font-semibold text-z-body-sm transition-colors"
            >
              Request a listing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
