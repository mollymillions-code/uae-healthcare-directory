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
      className="border border-black/[0.06] hover:border-[#006828]/15 transition-colors group block"
    >
      {/* Header */}
      <div className="p-4 border-b border-black/[0.06]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1c1c1c] text-sm leading-tight group-hover:text-[#006828] transition-colors">
              {lab.name}
            </h3>
            <span className="badge text-[9px] mt-1">{TYPE_LABELS[lab.type]}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-[#006828] transition-colors flex-shrink-0 mt-1" />
        </div>
        <p className="text-[11px] text-black/40 line-clamp-2 mt-2">{lab.description}</p>
      </div>

      {/* Quick stats */}
      <div className="px-4 py-3 bg-[#f8f8f6] grid grid-cols-2 gap-2">
        {cheapestFrom !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#006828]">
              From AED {cheapestFrom}
            </span>
          </div>
        )}
        {testCount !== undefined && (
          <div className="text-[11px] text-black/40">
            {testCount} tests listed
          </div>
        )}
        {lab.branchCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-black/40">
            <MapPin className="w-3 h-3" />
            {lab.branchCount} branches
          </div>
        )}
        {packageCount !== undefined && packageCount > 0 && (
          <div className="text-[11px] text-black/40">
            {packageCount} packages
          </div>
        )}
      </div>

      {/* Features */}
      <div className="p-4 space-y-1.5">
        {lab.homeCollection && (
          <div className="flex items-center gap-2 text-xs text-[#1c1c1c]">
            <Home className="w-3.5 h-3.5 text-[#006828] flex-shrink-0" />
            Home collection {lab.homeCollectionFee === 0 ? "(free)" : `(AED ${lab.homeCollectionFee})`}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-[#1c1c1c]">
          <Clock className="w-3.5 h-3.5 text-[#006828] flex-shrink-0" />
          Results in {lab.turnaroundHours}h
        </div>
        {lab.accreditations.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#1c1c1c]">
            <Award className="w-3.5 h-3.5 text-[#006828] flex-shrink-0" />
            {lab.accreditations.join(", ")}
          </div>
        )}
      </div>

      {/* Cities */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {lab.cities.slice(0, 5).map((city) => (
            <span key={city} className="text-[10px] bg-[#006828]/[0.04] text-[#006828]-dark px-1.5 py-0.5 font-medium capitalize">
              {city.replace(/-/g, " ")}
            </span>
          ))}
          {lab.cities.length > 5 && (
            <span className="text-[10px] text-black/40">+{lab.cities.length - 5} more</span>
          )}
        </div>
      </div>
    </Link>
  );
}
