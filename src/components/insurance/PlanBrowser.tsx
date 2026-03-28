"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { ComparisonTable } from "./ComparisonTable";
import {
  INSURER_PROFILES,
  getAllPlans,
  type InsurancePlan,
} from "@/lib/constants/insurance-plans";

function getComparablePlans(planIds: string[]) {
  const all = getAllPlans();
  return planIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as InsurancePlan[];
}

type TierFilter = "all" | InsurancePlan["tier"];

export function PlanBrowser() {
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [insurerFilter, setInsurerFilter] = useState("all");
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const allPlans = useMemo(() => getAllPlans(), []);

  const filteredPlans = useMemo(() => {
    let plans = allPlans;
    if (tierFilter !== "all") {
      plans = plans.filter((p) => p.tier === tierFilter);
    }
    if (insurerFilter !== "all") {
      plans = plans.filter((p) => p.insurerSlug === insurerFilter);
    }
    return plans;
  }, [allPlans, tierFilter, insurerFilter]);

  function toggleCompare(planId: string) {
    setSelectedPlanIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : prev.length < 4
        ? [...prev, planId]
        : prev
    );
  }

  const comparedPlans = useMemo(
    () => getComparablePlans(selectedPlanIds),
    [selectedPlanIds]
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SlidersHorizontal className="w-4 h-4 text-black/40" />
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as TierFilter)}
          className="text-xs border border-black/[0.06] px-3 py-2 bg-white text-[#1c1c1c] focus:border-[#006828] focus:outline-none"
        >
          <option value="all">All tiers</option>
          <option value="basic">Basic</option>
          <option value="enhanced">Enhanced</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
        </select>
        <select
          value={insurerFilter}
          onChange={(e) => setInsurerFilter(e.target.value)}
          className="text-xs border border-black/[0.06] px-3 py-2 bg-white text-[#1c1c1c] focus:border-[#006828] focus:outline-none"
        >
          <option value="all">All insurers</option>
          {INSURER_PROFILES.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <span className="text-xs text-black/40 ml-auto">
          {filteredPlans.length} plans
        </span>
      </div>

      {/* Compare bar */}
      {selectedPlanIds.length > 0 && (
        <div className="bg-dark text-white px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-xs">
            <span className="font-bold">{selectedPlanIds.length}</span> plan{selectedPlanIds.length !== 1 ? "s" : ""} selected (max 4)
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPlanIds([])}
              className="text-xs text-white/70 hover:text-white"
            >
              Clear
            </button>
            {selectedPlanIds.length >= 2 && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs font-bold bg-[#006828] text-white px-4 py-1.5 hover:bg-[#004d1c] transition-colors"
              >
                {showComparison ? "Hide comparison" : "Compare side-by-side"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {showComparison && comparedPlans.length >= 2 && (
        <div className="mb-8 border border-[#006828] p-4">
          <h3 className="text-sm font-bold text-[#1c1c1c] mb-4">Side-by-Side Comparison</h3>
          <ComparisonTable
            plans={comparedPlans}
            onRemove={(id) => {
              setSelectedPlanIds((prev) => prev.filter((i) => i !== id));
              if (selectedPlanIds.length <= 2) setShowComparison(false);
            }}
          />
        </div>
      )}

      {/* Plan grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => {
          const insurer = INSURER_PROFILES.find((p) => p.slug === plan.insurerSlug);
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              insurerName={insurer?.name || ""}
              insurerSlug={plan.insurerSlug}
              showCompareCheckbox
              isSelected={selectedPlanIds.includes(plan.id)}
              onToggleCompare={toggleCompare}
            />
          );
        })}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-black/40">No plans match your filters.</p>
        </div>
      )}
    </div>
  );
}
