import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number | null;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, reviewCount, size = "md" }: StarRatingProps) {
  if (!rating) return null;

  const numRating = Number(rating);
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.3;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${iconSize} ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "fill-light-200 text-light-200"
            }`}
          />
        ))}
      </div>
      <span className={`${textSize} font-semibold text-[#1c1c1c]`}>
        {numRating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className={`${textSize} text-black/40`}>
          ({reviewCount.toLocaleString()} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
