import { Check, X } from "lucide-react";
import { cn } from "../shared/cn";

interface Amenity {
  label: string;
  icon?: React.ReactNode;
  available?: boolean;
}

interface AmenityGridProps {
  title: string;
  items: Amenity[];
  maxVisible?: number;
  onShowAll?: () => void;
  className?: string;
}

/**
 * 2-column grid of facility/service items with checkmark icons. "Show all N"
 * button at the bottom opens a ShowAllModal (caller wires it up).
 */
export function AmenityGrid({ title, items, maxVisible = 10, onShowAll, className }: AmenityGridProps) {
  const visible = items.slice(0, maxVisible);

  return (
    <section className={cn("py-8 border-b border-ink-line z-anchor", className)}>
      <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">{title}</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10">
        {visible.map((it) => (
          <li key={it.label} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "flex items-center justify-center h-6 w-6 flex-shrink-0 mt-0.5",
                it.available === false ? "text-ink-muted" : "text-accent-deep"
              )}
            >
              {it.available === false ? (
                <X className="h-4 w-4" strokeWidth={2.25} />
              ) : (
                it.icon ?? <Check className="h-4 w-4" strokeWidth={2.25} />
              )}
            </span>
            <span
              className={cn(
                "font-sans text-z-body text-ink",
                it.available === false && "line-through text-ink-muted"
              )}
            >
              {it.label}
            </span>
          </li>
        ))}
      </ul>

      {items.length > maxVisible && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-6 inline-flex items-center justify-center bg-white border border-ink hover:bg-ink hover:text-white text-ink font-sans font-semibold text-z-body-sm rounded-z-sm px-5 py-3 transition-colors"
        >
          Show all {items.length} {title.toLowerCase()}
        </button>
      )}
    </section>
  );
}
