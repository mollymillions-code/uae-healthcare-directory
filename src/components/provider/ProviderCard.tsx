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
      className="group block py-5 rule"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-warm transition-colors truncate">
              {name}
            </h3>
            {isVerified && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-warm border border-warm/30 px-1.5 py-0.5">
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-ink-300 mb-2">{address}</p>
          {shortDescription && (
            <p className="text-sm text-ink-400 line-clamp-2 leading-relaxed font-serif">
              {shortDescription}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            {googleRating && Number(googleRating) > 0 && (
              <span className="font-mono text-xs text-ink-300">
                {googleRating}★ ({googleReviewCount?.toLocaleString()})
              </span>
            )}
            {phone && (
              <span className="font-mono text-xs text-ink-200">{phone}</span>
            )}
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-ink-200 group-hover:text-warm transition-colors mt-1 flex-shrink-0" />
      </div>
    </Link>
  );
}
