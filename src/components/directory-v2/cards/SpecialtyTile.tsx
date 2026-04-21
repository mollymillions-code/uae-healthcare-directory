import Link from "next/link";
import Image from "next/image";
import { cn } from "../shared/cn";

interface SpecialtyTileProps {
  slug: string;
  name: string;
  href: string;
  providerCount?: number;
  icon?: React.ReactNode;
  /** Use image instead of icon */
  useImage?: boolean;
}

/**
 * Small square tile used in specialty grids on /directory home and /specialties.
 * Flat card, hairline ring, photo or icon at top, label below.
 */
export function SpecialtyTile({ slug, name, href, providerCount, icon, useImage }: SpecialtyTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block w-full rounded-z-md overflow-hidden bg-white border border-ink-line",
        "hover:shadow-z-card transition-shadow duration-z-base"
      )}
    >
      <div className="aspect-[4/3] relative bg-surface-cream">
        {useImage ? (
          <Image
            src={`/images/categories/${slug}.webp`}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-z-med ease-z-standard"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-accent-dark">
            <span className="h-10 w-10 flex items-center justify-center">{icon}</span>
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="font-sans font-semibold text-ink text-z-body-sm line-clamp-1">{name}</p>
        {typeof providerCount === "number" && providerCount > 0 && (
          <p className="font-sans text-z-caption text-ink-muted mt-0.5">
            {providerCount.toLocaleString()} providers
          </p>
        )}
      </div>
    </Link>
  );
}
