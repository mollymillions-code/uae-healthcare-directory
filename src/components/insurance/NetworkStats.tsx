import Link from "next/link";
export interface InsurerNetworkStats {
  slug: string;
  name: string;
  totalProviders: number;
  byCity: { citySlug: string; cityName: string; providerCount: number }[];
  byCategory: { categorySlug: string; categoryName: string; providerCount: number }[];
}

interface NetworkStatsProps {
  stats: InsurerNetworkStats;
  /** Show full breakdown or compact summary */
  compact?: boolean;
}

export function NetworkStats({ stats, compact = false }: NetworkStatsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        <span className="font-bold text-accent text-lg">{stats.totalProviders.toLocaleString()}</span>
        <span className="text-muted">providers across {stats.byCity.length} cities</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-accent">{stats.totalProviders.toLocaleString()}</span>
        <span className="text-sm text-muted">total providers in network</span>
      </div>

      {/* By City */}
      <div>
        <h3 className="text-sm font-bold text-dark mb-3">Providers by City</h3>
        <div className="space-y-2">
          {stats.byCity.map((city) => {
            const pct = stats.totalProviders > 0 ? (city.providerCount / stats.totalProviders) * 100 : 0;
            return (
              <div key={city.citySlug}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <Link
                    href={`/directory/${city.citySlug}/insurance/${stats.slug}`}
                    className="text-dark hover:text-accent transition-colors font-medium"
                  >
                    {city.cityName}
                  </Link>
                  <span className="text-muted font-bold">{city.providerCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-light-200 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Category (top 10) */}
      <div>
        <h3 className="text-sm font-bold text-dark mb-3">Top Specialties in Network</h3>
        <div className="flex flex-wrap gap-1.5">
          {stats.byCategory.slice(0, 10).map((cat) => (
            <span
              key={cat.categorySlug}
              className="text-[11px] bg-light-100 text-dark px-2 py-1 font-medium"
            >
              {cat.categoryName} <span className="text-accent font-bold">{cat.providerCount}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
