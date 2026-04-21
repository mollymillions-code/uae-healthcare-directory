import { Star } from "lucide-react";
import { cn } from "../shared/cn";

interface SubScore {
  label: string;
  score: number;
}

interface ReviewDistributionProps {
  overallRating: number;
  reviewCount?: number;
  subScores?: SubScore[];
  className?: string;
}

/**
 * Overall rating block: huge rating on left, 6 sub-score bars on right. For
 * healthcare, Airbnb's "Cleanliness / Accuracy / Check-in" become our
 * "Punctuality / Diagnosis clarity / Bedside manner / Follow-up / Facility / Value".
 */
export function ReviewDistribution({ overallRating, reviewCount, subScores, className }: ReviewDistributionProps) {
  const defaultSubs: SubScore[] = subScores ?? [
    { label: "Punctuality", score: overallRating },
    { label: "Diagnosis clarity", score: overallRating },
    { label: "Bedside manner", score: overallRating },
    { label: "Follow-up", score: overallRating },
    { label: "Facility", score: overallRating },
    { label: "Value", score: overallRating },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start", className)}>
      <div className="md:col-span-4">
        <div className="flex items-baseline gap-3">
          <Star className="h-7 w-7 sm:h-9 sm:w-9 fill-ink text-ink" />
          <span className="font-display font-semibold text-ink text-[40px] sm:text-[48px] leading-none tracking-[-0.02em]">
            {overallRating.toFixed(2)}
          </span>
        </div>
        {typeof reviewCount === "number" && reviewCount > 0 && (
          <p className="font-sans text-z-body-sm text-ink-soft mt-3">
            Based on {reviewCount.toLocaleString()} patient {reviewCount === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>

      <dl className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
        {defaultSubs.map((s) => {
          const pct = Math.max(0, Math.min(100, (s.score / 5) * 100));
          return (
            <div key={s.label} className="flex items-center gap-3">
              <dt className="font-sans text-z-body-sm text-ink flex-1">{s.label}</dt>
              <div className="w-24 sm:w-32 h-1 rounded-full bg-ink-line overflow-hidden">
                <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
              </div>
              <dd className="font-sans text-z-body-sm text-ink w-7 text-right tabular-nums">
                {s.score.toFixed(1)}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
