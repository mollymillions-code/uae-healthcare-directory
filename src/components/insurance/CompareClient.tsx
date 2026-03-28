"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { ComparisonTable } from "@/components/insurance/ComparisonTable";
import {
  INSURER_PROFILES,
  getAllPlans,
} from "@/lib/constants/insurance-plans";

function getComparablePlans(planIds: string[]) {
  const all = getAllPlans();
  return planIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as import("@/lib/constants/insurance-plans").InsurancePlan[];
}

export function CompareClient() {
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const allPlans = useMemo(() => getAllPlans(), []);
  const comparedPlans = useMemo(
    () => getComparablePlans(selectedPlanIds),
    [selectedPlanIds]
  );

  function addPlan(planId: string) {
    if (selectedPlanIds.length < 4 && !selectedPlanIds.includes(planId)) {
      setSelectedPlanIds([...selectedPlanIds, planId]);
    }
  }

  function removePlan(planId: string) {
    setSelectedPlanIds(selectedPlanIds.filter((id) => id !== planId));
  }

  return (
    <>
      {/* Plan selector */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedPlanIds.map((id) => {
            const plan = allPlans.find((p) => p.id === id);
            const insurer = INSURER_PROFILES.find((i) => i.slug === plan?.insurerSlug);
            return plan ? (
              <div
                key={id}
                className="flex items-center gap-2 bg-[#006828]/[0.04] border border-[#006828] px-3 py-1.5"
              >
                <span className="text-xs font-bold text-[#1c1c1c]">
                  {insurer?.name}: {plan.name}
                </span>
                <button
                  onClick={() => removePlan(id)}
                  className="text-[#006828] hover:text-[#006828]-dark text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ) : null;
          })}
        </div>

        {selectedPlanIds.length < 4 && (
          <div className="border border-black/[0.06] p-4">
            <p className="text-xs font-bold text-[#1c1c1c] mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add a plan ({4 - selectedPlanIds.length} remaining)
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {INSURER_PROFILES.map((insurer) => (
                <div key={insurer.slug}>
                  <p className="text-[10px] text-black/40 font-bold uppercase tracking-wide mb-1">
                    {insurer.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {insurer.plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => addPlan(plan.id)}
                        disabled={selectedPlanIds.includes(plan.id)}
                        className={`text-[11px] px-2.5 py-1 border transition-colors ${
                          selectedPlanIds.includes(plan.id)
                            ? "bg-[#006828]/[0.04] border-[#006828] text-[#006828]-dark cursor-default"
                            : "border-black/[0.06] text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04]"
                        }`}
                      >
                        {plan.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison */}
      {comparedPlans.length >= 2 ? (
        <div className="border border-black/[0.06] p-4">
          <ComparisonTable plans={comparedPlans} onRemove={removePlan} />
        </div>
      ) : (
        <div className="text-center py-16 border border-black/[0.06]">
          <p className="text-black/40 mb-2">Select at least 2 plans to compare</p>
          <p className="text-xs text-black/40">
            Use the selector above to add plans, or{" "}
            <Link href="/insurance" className="text-[#006828] font-bold">
              browse all plans
            </Link>{" "}
            first.
          </p>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/insurance"
          className="flex items-center gap-1.5 text-sm text-[#006828] font-bold hover:text-[#006828]-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Insurance Navigator
        </Link>
      </div>
    </>
  );
}
