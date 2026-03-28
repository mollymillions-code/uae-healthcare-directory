import { Star } from "lucide-react";

interface ReviewCardProps {
  authorName: string;
  rating: number;
  text: string | null;
  relativeTime?: string | null;
}

export function ReviewCard({ authorName, rating, text, relativeTime }: ReviewCardProps) {
  return (
    <div className="border border-black/[0.06] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#006828]/[0.04] flex items-center justify-center">
            <span className="text-sm font-semibold text-[#006828]">
              {authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1c1c1c]">{authorName}</p>
            {relativeTime && (
              <p className="text-xs text-black/40">{relativeTime}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < rating ? "fill-yellow-400 text-yellow-400" : "fill-light-200 text-light-200"
              }`}
            />
          ))}
        </div>
      </div>
      {text && (
        <p className="text-sm text-black/40 leading-relaxed line-clamp-4">
          {text}
        </p>
      )}
    </div>
  );
}
