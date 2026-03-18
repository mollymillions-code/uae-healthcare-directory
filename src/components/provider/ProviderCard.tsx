import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ProviderCardProps {
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  shortDescription?: string | null;
  googleRating?: string | null;
  googleReviewCount?: number | null;
  isClaimed?: boolean | null;
  isVerified?: boolean | null;
}

export function ProviderCard({
  name, slug, citySlug, categorySlug, address, phone,
  shortDescription, googleRating, googleReviewCount, isVerified,
}: ProviderCardProps) {
  return (
    <Link
      href={`/uae/${citySlug}/${categorySlug}/${slug}`}
      className="provider-card group block"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors truncate">
              {name}
            </h3>
            {isVerified && (
              <span className="badge text-[9px]">Verified</span>
            )}
          </div>
          <p className="text-xs text-muted mb-1">{address}</p>
          {shortDescription && (
            <p className="text-xs text-muted/70 line-clamp-1">{shortDescription}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {googleRating && Number(googleRating) > 0 && (
              <span className="text-xs font-bold text-accent">
                {googleRating} ★ <span className="text-muted font-normal">({googleReviewCount?.toLocaleString()})</span>
              </span>
            )}
            {phone && <span className="text-xs text-muted">{phone}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-light-300 group-hover:text-accent transition-colors mt-1 flex-shrink-0" />
      </div>
    </Link>
  );
}
