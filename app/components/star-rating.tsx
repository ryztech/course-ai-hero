import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

interface StarRatingDisplayProps {
  rating: number | null;
  total?: number;
  className?: string;
}

export function StarRatingDisplay({ rating, total, className }: StarRatingDisplayProps) {
  if (rating === null) return null;

  const rounded = Math.round(rating * 2) / 2;

  return (
    <span className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= rounded;
        const half = !filled && i + 0.5 <= rounded;
        return (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              filled
                ? "fill-yellow-400 text-yellow-400"
                : half
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-none text-muted-foreground"
            )}
          />
        );
      })}
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)}{total !== undefined && total > 0 ? ` (${total})` : ""}
      </span>
    </span>
  );
}

interface StarRatingInputProps {
  courseId: number;
  initialRating: number | null;
  onRated?: (rating: number) => void;
}

export function StarRatingInput({ courseId, initialRating, onRated }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(initialRating);
  const [submitting, setSubmitting] = useState(false);

  const display = hovered ?? current;

  async function handleClick(star: number) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/course-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating: star }),
      });
      setCurrent(star);
      onRated?.(star);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = display !== null && star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={submitting}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(star)}
            className="cursor-pointer focus-visible:outline-none disabled:cursor-not-allowed"
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              className={cn(
                "size-5 transition-colors",
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-muted-foreground hover:text-yellow-400"
              )}
            />
          </button>
        );
      })}
      <span className="ml-1 text-sm text-muted-foreground">
        {current ? `Your rating: ${current}/5` : "Rate this course"}
      </span>
    </div>
  );
}
