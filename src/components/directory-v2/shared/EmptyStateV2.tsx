import { Search } from "lucide-react";
import { cn } from "./cn";

interface EmptyStateV2Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateV2({ title, description, actionLabel, onAction, className }: EmptyStateV2Props) {
  return (
    <div className={cn("py-16 flex flex-col items-center text-center max-w-md mx-auto", className)}>
      <div className="h-16 w-16 rounded-full bg-surface-cream flex items-center justify-center mb-4">
        <Search className="h-7 w-7 text-ink-soft" strokeWidth={1.75} />
      </div>
      <h3 className="font-display font-semibold text-ink text-z-h2">{title}</h3>
      {description && <p className="font-sans text-ink-soft text-z-body mt-2">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 font-sans font-semibold text-z-body-sm text-ink underline underline-offset-2 hover:text-ink-soft"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
