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

  return (
    <Link
      href={`${basePath}/${citySlug}/${categorySlug}/${slug}`}
      className="group block bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Facility type tag + Rating badge row */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">{categoryName}</span>
        {rating > 0 && (
          <span className="inline-flex items-center gap-1 bg-[#006828] text-white text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">
            {googleRating} ★
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl">
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
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors truncate tracking-tight">
              {name}
            </h3>
            {isVerified && (
              <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[9px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">Verified</span>
            )}
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-1">{address}</p>
          {shortDescription && (
            <p className="font-['Geist',sans-serif] text-xs text-black/30 line-clamp-1">{shortDescription}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {rating > 0 && (
              <span className="font-['Geist',sans-serif] text-xs font-medium text-[#006828]">
                {googleRating} ★ <span className="text-black/30 font-normal">({googleReviewCount?.toLocaleString()})</span>
              </span>
            )}
            {phone && (
              <span className="font-['Geist',sans-serif] text-xs text-black/30">{phone}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0" />
      </div>
    </Link>
  );
}
