"use client";

import { useState, useMemo } from "react";
import { Scale } from "lucide-react";
import { LabComparisonTable } from "@/components/labs/LabComparisonTable";
import { LAB_PROFILES, compareLabs } from "@/lib/labs";

export function LabCompareInteractive() {
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  const comparison = useMemo(() => {
    if (selectedLabs.length < 2) return null;
    return compareLabs(selectedLabs);
  }, [selectedLabs]);

  function toggleLab(slug: string) {
    setSelectedLabs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 4
          ? [...prev, slug]
          : prev
    );
  }

  return (
    <>
      {/* Lab selector */}
      <div className="section-header">
        <h2>Select Labs to Compare</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-3">
        Choose 2–4 labs. {selectedLabs.length}/4 selected.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {LAB_PROFILES.map((lab) => {
          const isSelected = selectedLabs.includes(lab.slug);
          return (
            <button
              key={lab.slug}
              onClick={() => toggleLab(lab.slug)}
              className={`p-3 border text-left transition-colors ${
                isSelected
                  ? "border-accent bg-accent-muted"
                  : "border-light-200 hover:border-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="w-4 h-4 accent-[#00c853]"
                />
                <div>
                  <p className="text-xs font-bold text-dark">{lab.name}</p>
                  <p className="text-[10px] text-muted">
                    {lab.accreditations.join(", ") || "Licensed"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comparison results */}
      {selectedLabs.length < 2 && (
        <div className="text-center py-12 text-muted">
          <Scale className="w-12 h-12 mx-auto mb-3 text-light-300" />
          <p className="text-sm">Select at least 2 labs to start comparing</p>
        </div>
      )}

      {comparison && (
        <div>
          <div className="section-header">
            <h2>Price Comparison</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-xs text-muted mb-4">
            Comparing {comparison.commonTests.length} tests available at all selected labs.
            Green highlights indicate the cheapest option for each test.
          </p>
          <LabComparisonTable comparison={comparison} />
        </div>
      )}
    </>
  );
}
