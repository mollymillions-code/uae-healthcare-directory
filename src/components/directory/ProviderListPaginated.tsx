"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { Pagination } from "@/components/shared/Pagination";
import type { LocalProvider } from "@/lib/data";

interface Props {
  initialProviders: LocalProvider[];
  initialTotalPages: number;
  citySlug: string;
  categorySlug: string;
  areaSlug?: string;
  baseUrl: string;
  emptyMessage: string;
  basePath?: string;
}

export function ProviderListPaginated({
  initialProviders,
  initialTotalPages,
  citySlug,
  categorySlug,
  areaSlug,
  baseUrl,
  emptyMessage,
  basePath = "/directory",
}: Props) {
  const searchParams = useSearchParams();
  const page = Number(searchParams?.get("page")) || 1;
  const [providers, setProviders] = useState(initialProviders);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (page <= 1) {
      setProviders(initialProviders);
      setTotalPages(initialTotalPages);
      return;
    }
    setLoading(true);
    const url = `/api/providers?city=${citySlug}&category=${categorySlug}&page=${page}${areaSlug ? `&area=${areaSlug}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers ?? []);
        setTotalPages(data.totalPages ?? initialTotalPages);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(() => setLoading(false));
  }, [page, citySlug, categorySlug, areaSlug, initialProviders, initialTotalPages]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-[#f8f8f6] animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <>
      {providers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {providers.map((p) => (
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
              basePath={basePath}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-black/40">{emptyMessage}</p>
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
    </>
  );
}
