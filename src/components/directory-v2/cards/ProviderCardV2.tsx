"use client";

import Link from "next/link";
import { Accessibility, BadgeCheck, Star } from "lucide-react";
import { PhotoCarousel } from "./PhotoCarousel";
import { HeartButton } from "./HeartButton";
import { cn } from "../shared/cn";
import { collectProviderImageUrls } from "@/lib/media/provider-images";
import { VerifiedClinicBadge } from "@/components/provider/VerifiedClinicBadge";

export interface ProviderCardV2Props {
  id?: string;
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
  insurance?: string[] | null;
  languages?: string[] | null;
  services?: string[] | null;
  operatingHours?: Record<string, { open: string; close: string }> | null;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  } | null;
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
  const topInsurance = (p.insurance ?? []).filter(Boolean).slice(0, 2);
  const insuranceRemainder = Math.max(0, (p.insurance ?? []).length - topInsurance.length);
  const topLanguages = (p.languages ?? []).filter(Boolean).slice(0, 2);
  const topServices = (p.services ?? []).filter(Boolean).slice(0, 2);
  const wheelchair = Boolean(
    p.accessibilityOptions?.wheelchairAccessibleEntrance ||
      p.accessibilityOptions?.wheelchairAccessibleParking ||
      p.accessibilityOptions?.wheelchairAccessibleRestroom ||
      p.accessibilityOptions?.wheelchairAccessibleSeating
  );
  const hasHours = Boolean(
    p.operatingHours &&
      typeof p.operatingHours === "object" &&
      Object.keys(p.operatingHours).length > 0
  );

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
          <HeartButton
            ariaLabel={`Save ${p.name}`}
            size="sm"
            providerId={p.id}
            providerName={p.name}
            surface="card_v2"
            storageKey={p.id ? undefined : `zavis:saved:${p.slug}`}
          />
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
        {(topInsurance.length > 0 || topLanguages.length > 0 || wheelchair || hasHours) && (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Provider decision signals">
            {hasHours ? (
              <span className="inline-flex items-center rounded-z-pill bg-ink/5 px-2 py-0.5 font-sans text-z-micro font-medium text-ink-muted">
                Hours listed
              </span>
            ) : null}
            {topInsurance.map((insurance) => (
              <span
                key={insurance}
                title={insurance}
                className="inline-flex max-w-[96px] items-center truncate rounded-z-pill bg-accent-muted px-2 py-0.5 font-sans text-z-micro font-medium text-accent-dark"
              >
                {insurance}
              </span>
            ))}
            {insuranceRemainder > 0 && (
              <span className="inline-flex items-center rounded-z-pill bg-ink/5 px-2 py-0.5 font-sans text-z-micro font-medium text-ink-muted">
                +{insuranceRemainder} plans
              </span>
            )}
            {topLanguages.map((language) => (
              <span
                key={language}
                className="inline-flex items-center rounded-z-pill bg-ink/5 px-2 py-0.5 font-sans text-z-micro font-medium text-ink-soft"
              >
                {language}
              </span>
            ))}
            {wheelchair && (
              <span
                className="inline-flex items-center gap-1 rounded-z-pill bg-ink/5 px-2 py-0.5 font-sans text-z-micro font-medium text-ink-soft"
                aria-label="Wheelchair-accessible signals listed"
              >
                <Accessibility className="h-3 w-3" aria-hidden="true" />
                Accessible
              </span>
            )}
          </div>
        )}
        {topServices.length > 0 && (
          <p className="mt-1.5 font-sans text-z-caption text-ink-muted line-clamp-1">
            {topServices.join(" · ")}
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
