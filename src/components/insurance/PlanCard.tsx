import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  type InsurancePlan,
  formatPremium,
  formatLimit,
  getTierLabel,
} from "@/lib/constants/insurance-plans";

const TIER_COLORS: Record<InsurancePlan["tier"], string> = {
  basic: "bg-dark-500 text-white",
  enhanced: "bg-accent text-white",
  premium: "bg-dark text-white",
  vip: "bg-accent-dark text-white",
};

interface PlanCardProps {
  plan: InsurancePlan;
  insurerName: string;
  insurerSlug: string;
  networkSize?: number;
  showCompareCheckbox?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (planId: string) => void;
}

export function PlanCard({
  plan,
  insurerName,
  insurerSlug,
  networkSize,
  showCompareCheckbox,
  isSelected,
  onToggleCompare,
}: PlanCardProps) {
  const cov = plan.coverage;
  const coverageItems = [
    { label: "Dental", covered: cov.dental },
    { label: "Optical", covered: cov.optical },
    { label: "Maternity", covered: cov.maternity },
    { label: "Mental Health", covered: cov.mentalHealth },
    { label: "International", covered: cov.internationalCoverage },
  ];

  return (
    <div className="border border-light-200 hover:border-accent transition-colors relative">
      {/* Header */}
      <div className="p-4 border-b border-light-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted uppercase tracking-wide font-bold mb-1">
              {insurerName}
            </p>
            <h3 className="font-bold text-dark text-sm leading-tight">{plan.name}</h3>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 flex-shrink-0 ${TIER_COLORS[plan.tier]}`}>
            {getTierLabel(plan.tier)}
          </span>
        </div>
        <p className="text-xs text-muted line-clamp-2">{plan.targetAudience}</p>
      </div>

      {/* Pricing */}
      <div className="px-4 py-3 bg-light-50">
        <p className="text-lg font-bold text-dark">{formatPremium(plan.premiumRange)}</p>
        <p className="text-[11px] text-muted">
          Annual limit: {formatLimit(plan.annualLimit)} · {plan.roomType} room · {plan.copayOutpatient}% co-pay
        </p>
      </div>

      {/* Coverage quick-view */}
      <div className="p-4 space-y-1.5">
        {coverageItems.map(({ label, covered }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            {covered ? (
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-light-300 flex-shrink-0" />
            )}
            <span className={covered ? "text-dark" : "text-muted line-through"}>
              {label}
              {label === "Dental" && covered && plan.dentalLimit > 0 && (
                <span className="text-muted"> (AED {plan.dentalLimit.toLocaleString()})</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {plan.highlights.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {plan.highlights.slice(0, 3).map((h) => (
              <span key={h} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-medium">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-light-200 flex items-center justify-between gap-2">
        {networkSize !== undefined && (
          <p className="text-[11px] text-muted">
            <span className="font-bold text-accent">{networkSize.toLocaleString()}</span> providers
          </p>
        )}
        <Link
          href={`/insurance/${insurerSlug}`}
          className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors ml-auto"
        >
          View details →
        </Link>
      </div>

      {/* Compare checkbox */}
      {showCompareCheckbox && onToggleCompare && (
        <label className="absolute top-3 right-3 flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleCompare(plan.id)}
            className="w-4 h-4 accent-[#00c853]"
          />
          <span className="text-[10px] text-muted font-medium">Compare</span>
        </label>
      )}
    </div>
  );
}
