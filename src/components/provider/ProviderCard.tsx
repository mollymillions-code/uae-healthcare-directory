import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
  name,
  slug,
  citySlug,
  categorySlug,
  address,
  phone,
  shortDescription,
  googleRating,
  googleReviewCount,
  isVerified,
}: ProviderCardProps) {
  return (
    <Link
      href={`/uae/${citySlug}/${categorySlug}/${slug}`}
      className="group block py-5 border-b border-ink-light"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl text-ink group-hover:text-gold transition-colors truncate">
              {name}
            </h3>
            {isVerified && (
              <span className="font-kicker text-[9px] uppercase tracking-wider text-gold border border-gold/30 px-1.5 py-0.5">
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted mb-2">{address}</p>
          {shortDescription && (
            <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">
              {shortDescription}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 meta">
            {googleRating && Number(googleRating) > 0 && (
              <span>
                {googleRating}★ ({googleReviewCount?.toLocaleString()})
              </span>
            )}
            {phone && (
              <span>{phone}</span>
            )}
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-ink-muted group-hover:text-gold transition-colors mt-1 flex-shrink-0" />
      </div>
    </Link>
  );
}
