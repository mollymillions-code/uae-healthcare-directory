"use client";

import { Search } from "lucide-react";
import { getSearchFacetDisplayLabel } from "@/lib/search/normalization";
import { cn } from "../shared/cn";

export type SearchSegment = "specialty" | "city" | "date" | "insurance";

export interface SearchPillState {
  specialty: string;
  city: string;
  date: string;
  insurance: string;
}

interface SearchPillProps {
  variant: "expanded" | "compact";
  state: SearchPillState;
  activeSegment?: SearchSegment | null;
  onSegmentClick?: (segment: SearchSegment) => void;
  onSubmit?: () => void;
  className?: string;
}

const SEGMENTS: { key: SearchSegment; label: string; placeholder: string }[] = [
  { key: "specialty", label: "Specialty", placeholder: "Any specialty" },
  { key: "city",      label: "City",      placeholder: "Anywhere in UAE" },
  { key: "date",      label: "Date",      placeholder: "Anytime" },
  { key: "insurance", label: "Insurance", placeholder: "Any insurance" },
];

/**
 * SearchPill — segmented pill with expanded (hero) and compact (header) variants.
 * Segments hover-fill into an inner rounded pill; the active segment gets an
 * elevated white-with-shadow lift and neighboring dividers fade.
 */
export function SearchPill({
  variant,
  state,
  activeSegment,
  onSegmentClick,
  onSubmit,
  className,
}: SearchPillProps) {
  const isExpanded = variant === "expanded";

  return (
    <div
      className={cn(
        "items-stretch bg-white rounded-z-search border border-ink-hairline",
        isExpanded
          ? "flex w-full max-w-[calc(100vw-2rem)] flex-col p-1 shadow-z-pill sm:inline-flex sm:h-[68px] sm:w-auto sm:max-w-none sm:flex-row sm:p-0"
          : "inline-flex h-[48px] shadow-z-card",
        className
      )}
    >
      {SEGMENTS.map((seg, i) => {
        const isActive = activeSegment === seg.key;
        const prevActive = activeSegment === SEGMENTS[i - 1]?.key;
        const showDivider = i > 0 && !isActive && !prevActive;
        const displayValue = getSearchFacetDisplayLabel(seg.key, state[seg.key]);

        return (
          <div key={seg.key} className={cn("relative flex items-stretch", isExpanded && "w-full sm:w-auto")}>
            {showDivider && (
              <div
                className={cn(
                  "hidden w-px bg-ink-hairline self-center sm:block",
                  isExpanded ? "h-8" : "h-6"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onSegmentClick?.(seg.key)}
              className={cn(
                "group relative flex flex-col justify-center text-left transition-all duration-z-base ease-z-standard",
                "rounded-z-search",
                isExpanded ? "w-full min-w-0 px-4 py-3 sm:w-auto sm:px-6 sm:py-2" : "px-4 py-1.5",
                isActive
                  ? "bg-white shadow-z-pill z-10"
                  : "hover:bg-ink-line/60",
                // Width control per segment — give each some breathing room
                isExpanded ? "sm:min-w-[140px]" : "min-w-[96px]"
              )}
            >
              {isExpanded && (
                <span className="font-sans text-z-micro text-ink uppercase tracking-[0.04em] pointer-events-none">
                  {seg.label}
                </span>
              )}
              <span
                className={cn(
                  "font-sans pointer-events-none truncate",
                  isExpanded ? "text-z-body-sm mt-0.5" : "text-z-body-sm",
                  displayValue ? "text-ink font-medium" : "text-ink-muted"
                )}
              >
                {displayValue || seg.placeholder}
              </span>
            </button>
          </div>
        );
      })}

      {/* Submit — circular icon, expands with label when any segment active */}
      <div className={cn("flex items-center", isExpanded ? "px-1 pb-1 sm:pb-0 sm:pl-0 sm:pr-2" : "pr-1.5")}>
        <button
          type="button"
          onClick={onSubmit}
          aria-label="Search"
          className={cn(
            "inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-z-pill transition-all duration-z-base ease-z-standard",
            isExpanded ? "h-11 w-full sm:h-12" : "h-9",
            activeSegment
              ? isExpanded
                ? "px-5"
                : "px-4"
              : isExpanded
                ? "sm:w-12"
                : "w-9"
          )}
        >
          <Search className={cn(isExpanded ? "h-4 w-4" : "h-3.5 w-3.5")} strokeWidth={2.5} />
          {activeSegment && (
            <span
              className={cn(
                "font-sans font-semibold whitespace-nowrap",
                isExpanded ? "text-z-body-sm" : "text-z-caption"
              )}
            >
              Search
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
