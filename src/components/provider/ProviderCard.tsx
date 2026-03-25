import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getCategoryImagePath } from "@/lib/helpers";
import { CATEGORIES } from "@/lib/constants/categories";

function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

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
  basePath?: string;
}

export function ProviderCard({
  name, slug, citySlug, categorySlug, address, phone,
  shortDescription, googleRating, googleReviewCount, isVerified,
  basePath = "/directory",
}: ProviderCardProps) {
  const rating = Number(googleRating) || 0;
  const category = getCategoryBySlug(categorySlug);
  const categoryName = category?.name || categorySlug;

  // Rating badge color
  const ratingBgClass = rating >= 4 ? "bg-green-600" : rating >= 3 ? "bg-yellow-500" : "bg-light-300";

  return (
    <Link
      href={`${basePath}/${citySlug}/${categorySlug}/${slug}`}
      className="provider-card group block relative"
    >
      {/* Facility type tag + Rating badge row */}
      <div className="flex items-center justify-between mb-2">
        <span className="badge text-[9px]">{categoryName}</span>
        {rating > 0 && (
          <span className={`${ratingBgClass} text-white text-[10px] font-bold px-1.5 py-0.5`}>
            {googleRating} ★
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden">
          <Image
            src={getCategoryImagePath(categorySlug)}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
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
            {rating > 0 && (
              <span className="text-xs font-bold text-accent">
                {googleRating} ★ <span className="text-muted font-normal">({googleReviewCount?.toLocaleString()})</span>
              </span>
            )}
            {phone && (
              <span className="text-xs text-muted">{phone}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-light-300 group-hover:text-accent transition-colors mt-1 flex-shrink-0" />
      </div>
    </Link>
  );
}
