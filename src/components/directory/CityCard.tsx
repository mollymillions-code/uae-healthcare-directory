import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";

interface CityCardProps {
  name: string;
  slug: string;
  emirate: string;
  providerCount?: number;
}

export function CityCard({ name, slug, emirate, providerCount }: CityCardProps) {
  return (
    <Link
      href={`/uae/${slug}`}
      className="card p-5 group flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-gray-500">
            {emirate !== name ? `${emirate} Emirate` : "Emirate"}
            {providerCount !== undefined && ` · ${providerCount} providers`}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
    </Link>
  );
}
