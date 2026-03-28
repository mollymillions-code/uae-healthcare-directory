"use client";

import { Check, X } from "lucide-react";
import {
  type InsurancePlan,
  formatPremium,
  formatLimit,
  getTierLabel,
  getInsurerProfile,
} from "@/lib/constants/insurance-plans";

interface ComparisonTableProps {
  plans: InsurancePlan[];
  onRemove?: (planId: string) => void;
}

function CoverageCell({ covered }: { covered: boolean }) {
  return covered ? (
    <Check className="w-4 h-4 text-[#006828] mx-auto" />
  ) : (
    <X className="w-4 h-4 text-light-300 mx-auto" />
  );
}

export function ComparisonTable({ plans, onRemove }: ComparisonTableProps) {
  if (plans.length === 0) return null;

  const rows: {
    label: string;
    getValue: (p: InsurancePlan) => React.ReactNode;
    isBoolean?: boolean;
  }[] = [
    { label: "Insurer", getValue: (p) => getInsurerProfile(p.insurerSlug)?.name || p.insurerSlug },
    { label: "Tier", getValue: (p) => getTierLabel(p.tier) },
    { label: "Annual Premium", getValue: (p) => formatPremium(p.premiumRange) },
    { label: "Annual Limit", getValue: (p) => formatLimit(p.annualLimit) },
    { label: "Room Type", getValue: (p) => p.roomType.charAt(0).toUpperCase() + p.roomType.slice(1) },
    { label: "Outpatient Co-pay", getValue: (p) => p.copayOutpatient === 0 ? "None" : `${p.copayOutpatient}%` },
    { label: "Pharmacy Co-pay", getValue: (p) => p.copayPharmacy === 0 ? "None" : `${p.copayPharmacy}%` },
    { label: "Pre-existing Wait", getValue: (p) => p.preExistingWaitMonths === 0 ? "Day 1" : `${p.preExistingWaitMonths} months` },
    { label: "Maternity Wait", getValue: (p) => p.maternityWaitMonths === -1 ? "Not covered" : p.maternityWaitMonths === 0 ? "Day 1" : `${p.maternityWaitMonths} months` },
    { label: "Inpatient", getValue: (p) => <CoverageCell covered={p.coverage.inpatient} />, isBoolean: true },
    { label: "Outpatient", getValue: (p) => <CoverageCell covered={p.coverage.outpatient} />, isBoolean: true },
    { label: "Dental", getValue: (p) => p.coverage.dental ? `AED ${p.dentalLimit.toLocaleString()}` : <X className="w-4 h-4 text-light-300 mx-auto" /> },
    { label: "Optical", getValue: (p) => p.coverage.optical ? `AED ${p.opticalLimit.toLocaleString()}` : <X className="w-4 h-4 text-light-300 mx-auto" /> },
    { label: "Maternity", getValue: (p) => <CoverageCell covered={p.coverage.maternity} />, isBoolean: true },
    { label: "Mental Health", getValue: (p) => <CoverageCell covered={p.coverage.mentalHealth} />, isBoolean: true },
    { label: "Preventive", getValue: (p) => <CoverageCell covered={p.coverage.preventive} />, isBoolean: true },
    { label: "Home Healthcare", getValue: (p) => <CoverageCell covered={p.coverage.homeHealthcare} />, isBoolean: true },
    { label: "Alt. Medicine", getValue: (p) => <CoverageCell covered={p.coverage.alternativeMedicine} />, isBoolean: true },
    { label: "International", getValue: (p) => <CoverageCell covered={p.coverage.internationalCoverage} />, isBoolean: true },
  ];

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b-2 border-[#1c1c1c]">
            <th className="text-left py-3 px-3 font-bold text-[#1c1c1c] w-40">Feature</th>
            {plans.map((plan) => (
              <th key={plan.id} className="text-center py-3 px-3 font-bold text-[#1c1c1c]">
                <div className="text-xs">{plan.name}</div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(plan.id)}
                    className="text-[10px] text-black/40 hover:text-[#006828] mt-1"
                  >
                    Remove
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-[#f8f8f6]" : ""}>
              <td className="py-2.5 px-3 text-xs font-medium text-[#1c1c1c]">{row.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="py-2.5 px-3 text-xs text-center text-[#1c1c1c]">
                  {row.getValue(plan)}
                </td>
              ))}
            </tr>
          ))}
          {/* Exclusions row */}
          <tr className="border-t border-black/[0.06]">
            <td className="py-2.5 px-3 text-xs font-medium text-[#1c1c1c] align-top">Key Exclusions</td>
            {plans.map((plan) => (
              <td key={plan.id} className="py-2.5 px-3 text-[11px] text-black/40 text-left">
                <ul className="space-y-0.5">
                  {plan.exclusions.map((e) => (
                    <li key={e}>· {e}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
