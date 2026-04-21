"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "../shared/cn";

interface CityCardProps {
  slug: string;
  name: string;
  href: string;
  providerCount?: number;
  regulator?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}

/**
 * Large image card with edge-to-edge photo, title + count overlaid. Used on
 * /directory home (city mosaic) and hubs. Flat hover — only photo zooms.
 */
export function CityCard({ slug, name, href, providerCount, regulator, size = "md", priority }: CityCardProps) {
  const aspectClass =
    size === "lg" ? "aspect-[4/3]" : size === "sm" ? "aspect-[3/4]" : "aspect-z-card";

  return (
    <Link
      href={href}
      className={cn(
        "group relative block w-full overflow-hidden rounded-z-md bg-ink-line",
        aspectClass
      )}
      aria-label={`Browse healthcare providers in ${name}`}
    >
      <Image
        src={`/images/cities/${slug}.webp`}
        alt={`${name} healthcare`}
        fill
        sizes={size === "lg" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 50vw, 25vw"}
        priority={priority}
        className="object-cover group-hover:scale-[1.05] transition-transform duration-z-slow ease-z-standard"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {regulator && (
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-z-pill bg-white/95 backdrop-blur px-2.5 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
          <span className="font-sans text-z-micro text-ink uppercase tracking-[0.04em]">{regulator}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
        <h3
          className={cn(
            "font-display font-semibold tracking-[-0.015em] leading-none",
            size === "lg" ? "text-z-h1 sm:text-display-md" : "text-z-h2"
          )}
        >
          {name}
        </h3>
        {typeof providerCount === "number" && providerCount > 0 && (
          <p className="font-sans text-z-body-sm text-white/80 mt-1.5">
            {providerCount.toLocaleString()} providers
          </p>
        )}
      </div>
    </Link>
  );
}
