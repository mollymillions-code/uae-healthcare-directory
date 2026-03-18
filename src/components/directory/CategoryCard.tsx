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
      className="group flex items-center gap-3 bg-white border border-light-200 p-3.5 hover:border-accent hover:bg-accent-muted transition-all duration-200"
    >
      <div className="h-10 w-10 bg-accent-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
        <IconComponent className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-dark group-hover:text-accent transition-colors truncate">
          {name}
        </h3>
        {providerCount !== undefined && providerCount > 0 && (
          <p className="text-xs text-muted">{providerCount} {providerCount === 1 ? "provider" : "providers"}</p>
        )}
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-light-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}
