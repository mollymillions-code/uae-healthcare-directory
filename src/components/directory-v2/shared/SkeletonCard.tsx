import { cn } from "./cn";

interface SkeletonCardProps {
  className?: string;
}

/**
 * Static neutral-grey card skeleton. No shimmer (deliberate — matches Airbnb's
 * calm placeholder approach).
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="aspect-z-card rounded-z-md bg-ink-line" />
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-ink-line" />
        <div className="h-3 w-1/2 rounded bg-ink-line/70" />
        <div className="h-3 w-1/3 rounded bg-ink-line/50" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
