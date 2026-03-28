import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CityCardProps {
  name: string;
  slug: string;
  emirate: string;
  providerCount?: number;
}

export function CityCard({ name, slug, emirate, providerCount }: CityCardProps) {
  // Check if a generated city image exists
  const hasImage = ["dubai", "abu-dhabi", "sharjah", "al-ain"].includes(slug);

  return (
    <Link
      href={`/directory/${slug}`}
      className="group relative overflow-hidden border border-black/[0.06] hover:border-[#006828]/15 transition-colors"
    >
      {/* City image or gradient background */}
      <div className="h-28 relative bg-gradient-to-br from-dark to-dark-500 overflow-hidden">
        {hasImage && (
          <Image
            src={`/images/cities/${slug}.webp`}
            alt={`${name} skyline`}
            fill
            className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <h3 className="text-lg font-semibold text-white">
            {name}
          </h3>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-black/40">
            {emirate !== name ? `${emirate} Emirate` : "Emirate"}
          </p>
          {providerCount !== undefined && (
            <p className="text-sm font-medium text-[#006828]">
              {providerCount} {providerCount === 1 ? "provider" : "providers"}
            </p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-light-300 group-hover:text-[#006828] group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
