"use client";

import { useState, useMemo } from "react";
import { Calculator, ChevronDown } from "lucide-react";

interface Plan {
  id: string;
  insurerSlug: string;
  insurerName: string;
  name: string;
  tier: string;
  copayOutpatient: number;
  annualLimit: number;
}

interface Props {
  procedureName: string;
  typicalCost: number;
  insuranceCoverage: string;
  setting: string;
  plans: Plan[];
}

export function CostEstimator({
  procedureName,
  typicalCost,
  insuranceCoverage,
  setting,
  plans,
}: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isCovered =
    insuranceCoverage === "typically-covered" ||
    insuranceCoverage === "partially-covered";

  const estimate = useMemo(() => {
    if (!selectedPlanId) return null;

    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return null;

    let copayPercent: number;
    if (!isCovered) {
      copayPercent = 100;
    } else if (setting === "inpatient") {
      copayPercent = 0;
    } else if (setting === "day-case") {
      copayPercent = Math.min(plan.copayOutpatient, 20);
    } else {
      copayPercent = plan.copayOutpatient;
    }

    const estimatedCopay = Math.round(typicalCost * (copayPercent / 100));
    const insurancePays = typicalCost - estimatedCopay;

    return {
      plan,
      copayPercent,
      estimatedCopay,
      insurancePays,
    };
  }, [selectedPlanId, plans, typicalCost, isCovered, setting]);

  // Group plans by insurer
  const grouped = useMemo(() => {
    const map = new Map<string, Plan[]>();
    for (const plan of plans) {
      const arr = map.get(plan.insurerName) || [];
      arr.push(plan);
      map.set(plan.insurerName, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [plans]);

  return (
    <div className="border border-black/[0.06] bg-[#f8f8f6]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#006828]" />
          <h3 className="text-sm font-bold text-[#1c1c1c]">
            Out-of-Pocket Cost Estimator
          </h3>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-black/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-black/[0.06] pt-4">
          <p className="text-xs text-black/40 mb-4">
            Select your insurance plan to estimate what you would pay out of pocket
            for a {procedureName.toLowerCase()}.
          </p>

          {/* Plan selector */}
          <div className="mb-4">
            <label
              htmlFor="plan-select"
              className="block text-xs font-bold text-[#1c1c1c] mb-1"
            >
              Your Insurance Plan
            </label>
            <select
              id="plan-select"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full border border-black/[0.06] bg-white p-2 text-sm text-[#1c1c1c]"
            >
              <option value="">Select a plan...</option>
              {grouped.map(([insurerName, insurerPlans]) => (
                <optgroup key={insurerName} label={insurerName}>
                  {insurerPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.tier})
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="no-insurance">No Insurance (Self-Pay)</option>
            </select>
          </div>

          {/* Estimate result */}
          {selectedPlanId === "no-insurance" && (
            <div className="bg-white border border-black/[0.06] p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-[11px] text-black/40">Typical Cost</p>
                  <p className="text-lg font-bold text-[#1c1c1c]">
                    AED {typicalCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-black/40">You Pay</p>
                  <p className="text-lg font-bold text-red-600">
                    AED {typicalCost.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-black/40">
                Without insurance, you pay the full amount. Consider getting a
                UAE health insurance plan to reduce out-of-pocket costs.
              </p>
            </div>
          )}

          {estimate && (
            <div className="bg-white border border-black/[0.06] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge text-[9px]">{estimate.plan.tier}</span>
                <span className="text-xs font-bold text-[#1c1c1c]">
                  {estimate.plan.insurerName} — {estimate.plan.name}
                </span>
              </div>

              {!isCovered ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[11px] text-black/40">Typical Cost</p>
                      <p className="text-lg font-bold text-[#1c1c1c]">
                        AED {typicalCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-black/40">You Pay</p>
                      <p className="text-lg font-bold text-red-600">
                        AED {typicalCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-2">
                    <p className="text-xs text-red-800">
                      {insuranceCoverage === "not-covered"
                        ? "This procedure is classified as cosmetic and is not covered by insurance."
                        : "This procedure is rarely covered by standard insurance plans. Check your specific plan."}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-[11px] text-black/40">Typical Cost</p>
                      <p className="text-base font-bold text-[#1c1c1c]">
                        AED {typicalCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-black/40">Insurance Pays</p>
                      <p className="text-base font-bold text-green-700">
                        AED {estimate.insurancePays.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-black/40">You Pay (est.)</p>
                      <p className="text-base font-bold text-[#006828]">
                        AED {estimate.estimatedCopay.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="h-3 bg-light-200 flex overflow-hidden mb-3">
                    <div
                      className="bg-green-500 h-full"
                      style={{
                        width: `${((estimate.insurancePays / typicalCost) * 100).toFixed(0)}%`,
                      }}
                    />
                    <div
                      className="bg-[#006828] h-full"
                      style={{
                        width: `${((estimate.estimatedCopay / typicalCost) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-black/40">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 inline-block" />
                      Insurance ({100 - estimate.copayPercent}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#006828] inline-block" />
                      Co-pay ({estimate.copayPercent}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-black/40 mt-3 leading-relaxed">
            This is an indicative estimate only. Actual out-of-pocket costs depend on
            your specific plan terms, pre-authorisation status, provider network
            tier, and clinical complexity. Always confirm with your insurer before
            proceeding.
          </p>
        </div>
      )}
    </div>
  );
}
