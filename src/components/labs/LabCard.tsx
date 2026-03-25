import Link from "next/link";
import { ArrowRight, Home, Clock, MapPin, Award } from "lucide-react";
import type { LabProfile } from "@/lib/labs";

interface LabCardProps {
  lab: LabProfile;
  testCount?: number;
  packageCount?: number;
  cheapestFrom?: number;
}

const TYPE_LABELS: Record<LabProfile["type"], string> = {
  chain: "Lab Chain",
  hospital: "Hospital Lab",
  "home-service": "Home Service",
  boutique: "Standalone Lab",
};

export function LabCard({ lab, testCount, packageCount, cheapestFrom }: LabCardProps) {
  return (
    <Link
      href={`/labs/${lab.slug}`}
      className="border border-light-200 hover:border-accent transition-colors group block"
    >
      {/* Header */}
      <div className="p-4 border-b border-light-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-dark text-sm leading-tight group-hover:text-accent transition-colors">
              {lab.name}
            </h3>
            <span className="badge text-[9px] mt-1">{TYPE_LABELS[lab.type]}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
        </div>
        <p className="text-[11px] text-muted line-clamp-2 mt-2">{lab.description}</p>
      </div>

      {/* Quick stats */}
      <div className="px-4 py-3 bg-light-50 grid grid-cols-2 gap-2">
        {cheapestFrom !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-accent">
              From AED {cheapestFrom}
            </span>
          </div>
        )}
        {testCount !== undefined && (
          <div className="text-[11px] text-muted">
            {testCount} tests listed
          </div>
        )}
        {lab.branchCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="w-3 h-3" />
            {lab.branchCount} branches
          </div>
        )}
        {packageCount !== undefined && packageCount > 0 && (
          <div className="text-[11px] text-muted">
            {packageCount} packages
          </div>
        )}
      </div>

      {/* Features */}
      <div className="p-4 space-y-1.5">
        {lab.homeCollection && (
          <div className="flex items-center gap-2 text-xs text-dark">
            <Home className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            Home collection {lab.homeCollectionFee === 0 ? "(free)" : `(AED ${lab.homeCollectionFee})`}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-dark">
          <Clock className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          Results in {lab.turnaroundHours}h
        </div>
        {lab.accreditations.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-dark">
            <Award className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            {lab.accreditations.join(", ")}
          </div>
        )}
      </div>

      {/* Cities */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {lab.cities.slice(0, 5).map((city) => (
            <span key={city} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-medium capitalize">
              {city.replace(/-/g, " ")}
            </span>
          ))}
          {lab.cities.length > 5 && (
            <span className="text-[10px] text-muted">+{lab.cities.length - 5} more</span>
          )}
        </div>
      </div>
    </Link>
  );
}
