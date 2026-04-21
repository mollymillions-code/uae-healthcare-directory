"use client";

import Image from "next/image";
import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { cn } from "../shared/cn";
import { PhotoViewer } from "./PhotoViewer";

interface PhotoMosaicProps {
  photos: string[];
  alt: string;
  priorityCount?: number;
  /** Fallback image when a photo fails to load (e.g. expired CDN URL). */
  fallbackSrc?: string;
}

/**
 * 1 big + 4 small mosaic (2/3 + 2×2). Rounded corners on outer edges only,
 * 8px gutters. Click any tile → PhotoViewer modal with shared-element transition.
 */
export function PhotoMosaic({ photos, alt, priorityCount = 1, fallbackSrc = "/images/placeholder-provider.svg" }: PhotoMosaicProps) {
  const safe = photos.length > 0 ? photos.slice(0, 5) : [fallbackSrc, fallbackSrc, fallbackSrc, fallbackSrc, fallbackSrc];
  // Pad to 5 if fewer — repeat the main image
  while (safe.length < 5) safe.push(safe[0]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [viewerStart, setViewerStart] = useState(0);

  const openAt = (i: number) => {
    setViewerStart(i);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-z-lg overflow-hidden aspect-[5/3] md:aspect-[2/1]">
          {/* Tile 0 — big */}
          <button
            type="button"
            onClick={() => openAt(0)}
            className="relative md:col-span-2 md:row-span-2 group overflow-hidden bg-ink-line"
          >
            <Image
              src={failed[0] ? fallbackSrc : safe[0]}
              alt={`${alt} photo 1`}
              fill
              priority={priorityCount > 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setFailed((prev) => ({ ...prev, 0: true }))}
              className="object-cover group-hover:brightness-95 transition-all duration-z-base"
            />
          </button>

          {/* Tiles 1–4 — hidden on mobile */}
          {[1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className="relative hidden md:block group overflow-hidden bg-ink-line"
            >
              <Image
                src={failed[i] ? fallbackSrc : safe[i]}
                alt={`${alt} photo ${i + 1}`}
                fill
                sizes="25vw"
                onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                className="object-cover group-hover:brightness-95 transition-all duration-z-base"
              />
            </button>
          ))}
        </div>

        {/* Show all photos CTA */}
        <button
          type="button"
          onClick={() => openAt(0)}
          className={cn(
            "absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-white border border-ink-hairline",
            "rounded-z-sm px-3.5 py-2 font-sans text-z-body-sm font-semibold text-ink hover:bg-surface-cream shadow-z-card transition-colors"
          )}
        >
          <Grid3x3 className="h-3.5 w-3.5" strokeWidth={2.5} />
          Show all photos
        </button>
      </div>

      <PhotoViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={photos.length > 0 ? photos : safe}
        startIndex={viewerStart}
        alt={alt}
      />
    </>
  );
}
