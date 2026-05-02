"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "../shared/cn";

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
  priority?: boolean;
  sizes?: string;
  aspect?: "card" | "mosaic" | "wide";
  rounded?: boolean;
  maxDots?: number;
  /** Fallback image used when a photo fails to load (e.g. expired CDN URL). */
  fallbackSrc?: string;
}

/**
 * Airbnb-style photo carousel. Arrows appear only on container hover.
 * Dots telescope (outer dots shrink) when >maxDots. All animations pure CSS.
 */
export function PhotoCarousel({
  photos,
  alt,
  priority = false,
  sizes,
  aspect = "card",
  rounded = true,
  maxDots = 5,
  fallbackSrc = "/images/placeholder-provider.svg",
}: PhotoCarouselProps) {
  const safePhotos = useMemo(() => (photos.length > 0 ? photos : [fallbackSrc]), [photos, fallbackSrc]);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const go = useCallback(
    (dir: 1 | -1) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIdx((i) => (i + dir + safePhotos.length) % safePhotos.length);
    },
    [safePhotos.length]
  );

  const aspectClass =
    aspect === "card" ? "aspect-z-card" : aspect === "mosaic" ? "aspect-z-mosaic" : "aspect-z-wide";
  const activeSrc = safePhotos[idx] ?? safePhotos[0] ?? fallbackSrc;
  const activeEffective = failed[idx] ? fallbackSrc : activeSrc;

  return (
    <div
      className={cn(
        "group/carousel relative w-full overflow-hidden bg-ink-line",
        aspectClass,
        rounded && "rounded-z-md"
      )}
    >
      <Image
        key={`${activeSrc}-${idx}`}
        src={activeEffective}
        alt={`${alt}${safePhotos.length > 1 ? ` (${idx + 1} of ${safePhotos.length})` : ""}`}
        fill
        sizes={sizes}
        priority={priority && idx === 0}
        onError={() => setFailed((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))}
        className="object-cover transition-opacity duration-z-med ease-z-standard group-hover/carousel:scale-[1.03] transform-gpu"
        draggable={false}
      />

      {safePhotos.length > 1 && (
        <>
          {/* Arrows — hover-only */}
          <button
            type="button"
            onClick={go(-1)}
            aria-label="Previous photo"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/95 backdrop-blur",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-z-fast",
              "shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center",
              "hover:bg-white active:scale-95"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={go(1)}
            aria-label="Next photo"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/95 backdrop-blur",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-z-fast",
              "shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center",
              "hover:bg-white active:scale-95"
            )}
          >
            <ChevronRight className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
          </button>

          {/* Dots — bottom center, telescoping */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none">
            {safePhotos.map((_, i) => {
              const dist = Math.abs(i - idx);
              const showSmall = safePhotos.length > maxDots && dist > Math.floor(maxDots / 2);
              if (safePhotos.length > maxDots && dist > Math.floor(maxDots / 2) + 1) return null;
              return (
                <span
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-z-base bg-white",
                    i === idx ? "w-1.5 h-1.5 opacity-100" : "opacity-70",
                    showSmall ? "w-1 h-1" : "w-1.5 h-1.5",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                  )}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
