"use client";

import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { PhotoCarousel } from "./PhotoCarousel";
import { HeartButton } from "./HeartButton";
import { cn } from "../shared/cn";
import { collectProviderImageUrls } from "@/lib/media/provider-images";
import { VerifiedClinicBadge } from "@/components/provider/VerifiedClinicBadge";

export interface ProviderCardV2Props {
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
  coverImageUrl?: string | null;
  basePath?: string;
  ribbon?: string | null;
  priority?: boolean;
}

/**
 * Airbnb-style provider card. Entire card is clickable via an absolutely-
 * positioned overlay `<Link>`. The heart button + carousel controls sit above
 * the overlay with higher z-index — we can't nest <button> inside <a> (invalid
 * HTML, which is what made the card un-clickable before).
 */
export function ProviderCardV2(p: ProviderCardV2Props) {
  const base = p.basePath ?? "/directory";
  const href = `${base}/${p.citySlug}/${p.categorySlug}/${p.slug}`;
  const rating = p.googleRating ? Number(p.googleRating) : 0;
  const hasRating = rating > 0;

  const photos = collectProviderImageUrls(p);
  if (photos.length === 0) photos.push("/images/placeholder-provider.svg");

  return (
    <article className="group relative w-full">
      {/* Photo + overlay-interactives */}
      <div className="relative isolate">
        <PhotoCarousel
          photos={photos}
          alt={p.name}
          priority={p.priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
          fallbackSrc={`/images/categories/${p.categorySlug}.webp`}
        />

        {/* Top-left ribbon — non-interactive, allow overlay link clicks through */}
        {(p.ribbon || p.isVerified) && (
          <div className="absolute top-3 left-3 pointer-events-none z-20">
            {p.isVerified && !p.ribbon ? (
              <VerifiedClinicBadge variant="inline" />
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-z-pill bg-white/95 backdrop-blur px-2.5 py-1",
                  "font-sans text-z-micro text-ink uppercase tracking-[0.04em] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                )}
              >
                {p.isVerified && <BadgeCheck className="h-3 w-3 text-accent-deep" strokeWidth={2.5} />}
                {p.ribbon}
              </span>
            )}
          </div>
        )}

        {/* Heart — above overlay link */}
        <div className="absolute top-3 right-3 z-30">
          <HeartButton ariaLabel={`Save ${p.name}`} size="sm" storageKey={`zavis:saved:${p.slug}`} />
        </div>
      </div>

      {/* Text block */}
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

      {/* Overlay link — covers the whole card; sits below heart/carousel so they
          remain clickable. aria-label provides the accessible name. */}
      <Link
        href={href}
        aria-label={`View ${p.name}`}
        className="absolute inset-0 z-10 rounded-z-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-deep focus:outline-none"
      >
        <span className="sr-only">View {p.name}</span>
      </Link>
    </article>
  );
}
