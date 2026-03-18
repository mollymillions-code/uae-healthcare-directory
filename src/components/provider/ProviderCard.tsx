import Link from "next/link";
import { MapPin, Phone, Globe } from "lucide-react";
import { StarRating } from "@/components/shared/StarRating";

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
  website,
  shortDescription,
  googleRating,
  googleReviewCount,
  isClaimed,
  isVerified,
}: ProviderCardProps) {
  return (
    <Link
      href={`/uae/${citySlug}/${categorySlug}/${slug}`}
      className="card p-5 block group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {isVerified && (
              <span className="badge-green">Verified</span>
            )}
            {isClaimed && (
              <span className="badge-gray">Claimed</span>
            )}
          </div>
        </div>
      </div>

      {googleRating && (
        <div className="mb-3">
          <StarRating
            rating={Number(googleRating)}
            reviewCount={googleReviewCount ?? undefined}
            size="sm"
          />
        </div>
      )}

      {shortDescription && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {shortDescription}
        </p>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        {website && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{new URL(website).hostname}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
