import Link from "next/link";
import { ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";

interface CategoryCardProps {
  name: string;
  slug: string;
  icon: string;
  citySlug?: string;
  providerCount?: number;
}

export function CategoryCard({ name, slug, icon, citySlug, providerCount }: CategoryCardProps) {
  const href = citySlug ? `/uae/${citySlug}/${slug}` : `/uae/dubai/${slug}`;

  // Dynamically get icon component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[icon] || Icons.Stethoscope;

  return (
    <Link
      href={href}
      className="card p-4 group flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
        <IconComponent className="h-5 w-5 text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-gray-900 group-hover:text-brand-600 transition-colors truncate">
          {name}
        </h3>
        {providerCount !== undefined && (
          <p className="text-xs text-gray-500">{providerCount} providers</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
    </Link>
  );
}
