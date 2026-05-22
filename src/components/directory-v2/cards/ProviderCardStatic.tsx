import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { collectProviderImageUrls } from "@/lib/media/provider-images";
import { VerifiedClinicBadge } from "@/components/provider/VerifiedClinicBadge";

export interface ProviderCardStaticProps {
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  categoryName?: string | null;
  areaName?: string | null;
  address?: string | null;
  googleRating?: string | number | null;
  googleReviewCount?: number | null;
  isClaimed?: boolean | null;
  isVerified?: boolean | null;
  photos?: string[] | null;
  galleryPhotos?: Array<{ url?: string | null } | string> | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  basePath?: string;
  priority?: boolean;
}

export function ProviderCardStatic(p: ProviderCardStaticProps) {
  const base = p.basePath ?? "/directory";
  const href = `${base}/${p.citySlug}/${p.categorySlug}/${p.slug}`;
  const rating = p.googleRating ? Number(p.googleRating) : 0;
  const hasRating = rating > 0;
  const image =
    collectProviderImageUrls(p, { limit: 1 })[0] ??
    `/images/categories/${p.categorySlug}.webp`;

  return (
    <article className="group relative w-full">
      <Link href={href} prefetch={false} className="block rounded-z-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-deep focus-visible:ring-offset-2">
        <div className="relative aspect-z-card overflow-hidden rounded-z-md bg-ink-line">
          <Image
            src={image}
            alt={p.name}
            fill
            quality={55}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
            priority={p.priority}
            fetchPriority={p.priority ? "high" : "auto"}
            className="object-cover transition-transform duration-z-med ease-z-standard group-hover:scale-[1.03]"
          />
          {p.isVerified && (
            <div className="absolute left-3 top-3">
              <VerifiedClinicBadge variant="inline" />
            </div>
          )}
        </div>

        <div className="mt-3 px-0.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-sans font-semibold text-ink text-z-body line-clamp-1 group-hover:underline decoration-ink decoration-1 underline-offset-2">
              {p.name}
            </h3>
            {hasRating && (
              <span className="inline-flex items-center gap-1 font-sans text-z-body-sm text-ink whitespace-nowrap pt-0.5">
                <Star className="h-3.5 w-3.5 fill-ink text-ink" />
                {rating.toFixed(2)}
                {p.googleReviewCount ? (
                  <span className="text-ink-muted">({p.googleReviewCount})</span>
                ) : null}
              </span>
            )}
          </div>
          {(p.categoryName || p.areaName) && (
            <p className="font-sans text-z-body-sm text-ink-soft line-clamp-1 mt-0.5">
              {[p.categoryName, p.areaName].filter(Boolean).join(" · ")}
            </p>
          )}
          {p.address && (
            <p className="font-sans text-z-body-sm text-ink-muted line-clamp-1 mt-0.5">
              {p.address}
            </p>
          )}
          {p.isClaimed && (
            <p className="font-sans text-z-caption text-ink-soft mt-1.5">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3 w-3 text-accent-dark" strokeWidth={2.5} />
                Claimed by provider
              </span>
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
