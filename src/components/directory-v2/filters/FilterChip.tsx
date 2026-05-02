"use client";

import { X } from "lucide-react";
import { cn } from "../shared/cn";

interface FilterChipProps {
  label: string;
  applied?: boolean;
  count?: number;
  onClick?: () => void;
  onClear?: () => void;
  asLink?: boolean;
  href?: string;
}

/**
 * Airbnb-style filter chip. Default = white with 1px hairline. Applied = solid
 * black fill with white text. Flip happens on a 150ms color transition.
 */
export function FilterChip({ label, applied, count, onClick, onClear }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={applied}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-z-pill px-3.5 py-1.5 font-sans text-z-body-sm whitespace-nowrap",
        "transition-colors duration-z-fast",
        applied
          ? "bg-state-applied text-white border border-state-applied hover:bg-ink-soft"
          : "bg-white text-ink border border-ink-hairline hover:border-ink"
      )}
    >
      {label}
      {applied && typeof count === "number" && count > 0 && (
        <span className="font-semibold opacity-80">({count})</span>
      )}
      {applied && onClear && (
        <span
          role="button"
          aria-label="Clear filter"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-0.5 -mr-1 opacity-80 hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
}
