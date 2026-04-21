"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "../shared/cn";
import { FilterChip } from "./FilterChip";

export interface FilterChipItem {
  key: string;
  label: string;
  applied?: boolean;
  count?: number;
  onClick?: () => void;
  onClear?: () => void;
}

interface FilterChipRowProps {
  chips: FilterChipItem[];
  onOpenDrawer?: () => void;
  appliedCount?: number;
  rightSwitch?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

/**
 * Horizontal row of FilterChips + overflow "Filters" button on the right.
 * Sticks below the header when `sticky` is true.
 */
export function FilterChipRow({
  chips,
  onOpenDrawer,
  appliedCount,
  rightSwitch,
  sticky = true,
  className,
}: FilterChipRowProps) {
  return (
    <div
      className={cn(
        "bg-surface-cream/95 backdrop-blur-md border-b border-ink-line",
        sticky && "sticky top-20 z-30",
        className
      )}
    >
      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-3">
          <div
            className="flex-1 flex items-center gap-2 overflow-x-auto z-no-scrollbar"
            style={{ scrollSnapType: "x proximity" }}
          >
            {chips.map((c) => (
              <div key={c.key} style={{ scrollSnapAlign: "start" }}>
                <FilterChip
                  label={c.label}
                  applied={c.applied}
                  count={c.count}
                  onClick={c.onClick}
                  onClear={c.onClear}
                />
              </div>
            ))}
          </div>

          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-z-pill bg-white border border-ink-hairline",
                "px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:shadow-z-card transition-shadow duration-z-fast flex-shrink-0"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.5} />
              Filters
              {typeof appliedCount === "number" && appliedCount > 0 && (
                <span className="ml-0.5 h-4 min-w-[16px] px-1 rounded-full bg-state-applied text-white text-[10px] font-semibold inline-flex items-center justify-center">
                  {appliedCount}
                </span>
              )}
            </button>
          )}

          {rightSwitch && <div className="flex-shrink-0">{rightSwitch}</div>}
        </div>
      </div>
    </div>
  );
}
