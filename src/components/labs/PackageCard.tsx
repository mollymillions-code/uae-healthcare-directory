import Link from "next/link";
import { Package, Check } from "lucide-react";
import type { HealthPackage } from "@/lib/labs";
import { getLabProfile, formatPrice } from "@/lib/labs";

interface PackageCardProps {
  pkg: HealthPackage;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const lab = getLabProfile(pkg.labSlug);

  return (
    <div className="border border-black/[0.06] hover:border-[#006828]/15 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-4 h-4 text-[#006828] flex-shrink-0" />
          <p className="text-[11px] text-black/40 uppercase tracking-wide font-bold">
            {lab?.name || pkg.labSlug}
          </p>
        </div>
        <h3 className="font-bold text-[#1c1c1c] text-sm">{pkg.name}</h3>
        <p className="text-[11px] text-black/40 mt-1">{pkg.targetAudience}</p>
      </div>

      {/* Price */}
      <div className="px-4 py-3 bg-[#f8f8f6]">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold text-[#1c1c1c]">{formatPrice(pkg.price)}</p>
          {pkg.discountedPrice && (
            <p className="text-xs text-black/40 line-through">{formatPrice(pkg.discountedPrice)}</p>
          )}
        </div>
        <p className="text-[11px] text-black/40">{pkg.biomarkerCount} biomarkers</p>
      </div>

      {/* Includes */}
      <div className="p-4 space-y-1.5">
        {pkg.includes.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-[#1c1c1c]">
            <Check className="w-3.5 h-3.5 text-[#006828] flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>

      {/* Suitable for */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {pkg.suitableFor.map((s) => (
          <span key={s} className="text-[10px] bg-[#006828]/[0.04] text-[#006828]-dark px-1.5 py-0.5 font-medium capitalize">
            {s === "all" ? "Men & Women" : s === "male" ? "Men" : "Women"}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-black/[0.06]">
        <Link
          href={`/labs/${pkg.labSlug}`}
          className="text-[11px] font-bold text-[#006828] hover:text-[#006828]-dark transition-colors"
        >
          View all {lab?.name} tests →
        </Link>
      </div>
    </div>
  );
}
