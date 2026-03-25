"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { ComparisonTable } from "@/components/insurance/ComparisonTable";
import {
  INSURER_PROFILES,
  getAllPlans,
  getComparablePlans,
} from "@/lib/insurance";

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
                className="flex items-center gap-2 bg-accent-muted border border-accent px-3 py-1.5"
              >
                <span className="text-xs font-bold text-dark">
                  {insurer?.name}: {plan.name}
                </span>
                <button
                  onClick={() => removePlan(id)}
                  className="text-accent hover:text-accent-dark text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ) : null;
          })}
        </div>

        {selectedPlanIds.length < 4 && (
          <div className="border border-light-200 p-4">
            <p className="text-xs font-bold text-dark mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add a plan ({4 - selectedPlanIds.length} remaining)
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {INSURER_PROFILES.map((insurer) => (
                <div key={insurer.slug}>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wide mb-1">
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
                            ? "bg-accent-muted border-accent text-accent-dark cursor-default"
                            : "border-light-200 text-dark hover:border-accent hover:bg-accent-muted"
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
        <div className="border border-light-200 p-4">
          <ComparisonTable plans={comparedPlans} onRemove={removePlan} />
        </div>
      ) : (
        <div className="text-center py-16 border border-light-200">
          <p className="text-muted mb-2">Select at least 2 plans to compare</p>
          <p className="text-xs text-muted">
            Use the selector above to add plans, or{" "}
            <Link href="/insurance" className="text-accent font-bold">
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
          className="flex items-center gap-1.5 text-sm text-accent font-bold hover:text-accent-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Insurance Navigator
        </Link>
      </div>
    </>
  );
}
