import Link from "next/link";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";

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
  const href = citySlug ? `/uae/${citySlug}/${slug}` : `/uae/dubai/${slug}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[icon] || Icons.Stethoscope;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl bg-white border border-cream-200 p-3.5 hover:border-teal-200 hover:shadow-[0_4px_16px_rgba(13,115,119,0.06)] transition-all duration-200"
    >
      <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
        <IconComponent className="h-5 w-5 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-dark group-hover:text-teal-600 transition-colors truncate">
          {name}
        </h3>
        {providerCount !== undefined && providerCount > 0 && (
          <p className="text-xs text-charcoal/40">{providerCount} providers</p>
        )}
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-cream-300 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}
