import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { getCategoryImagePath } from "@/lib/helpers";

interface CategoryCardProps {
  name: string;
  slug: string;
  icon: string;
  citySlug?: string;
  providerCount?: number;
}

export function CategoryCard({
  name,
  slug,
  icon,
  citySlug,
  providerCount,
}: CategoryCardProps) {
  const href = citySlug ? `/directory/${citySlug}/${slug}` : `/directory/dubai/${slug}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[icon] || Icons.Stethoscope;

  return (
    <Link
      href={href}
      className="group relative flex items-end overflow-hidden border border-light-200 h-28 hover:border-accent transition-all duration-200"
    >
      <Image
        src={getCategoryImagePath(slug)}
        alt={name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
      <div className="relative z-10 flex items-end justify-between w-full p-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <IconComponent className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-white truncate">
              {name}
            </h3>
            {providerCount !== undefined && providerCount > 0 && (
              <p className="text-xs text-white/70">{providerCount} {providerCount === 1 ? "provider" : "providers"}</p>
            )}
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </Link>
  );
}
