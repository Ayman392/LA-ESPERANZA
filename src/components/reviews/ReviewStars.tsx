"use client";

import { Star } from "lucide-react";

type ReviewStarsProps = {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const starSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function ReviewStars({
  value,
  onChange,
  size = "md",
  label = "Rating",
}: ReviewStarsProps) {
  const roundedValue = Math.round(value);

  return (
    <div
      className="flex items-center gap-1 text-[#C9A96A]"
      aria-label={`${label}: ${value.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const isFilled = rating <= roundedValue;
        const Icon = (
          <Star
            aria-hidden
            className={`${starSizes[size]} ${
              isFilled ? "fill-current" : "fill-transparent text-[#C9A96A]/35"
            }`}
          />
        );

        return onChange ? (
          <button
            key={rating}
            type="button"
            aria-label={`Rate ${rating} out of 5 stars`}
            aria-pressed={rating === value}
            onClick={() => onChange(rating)}
            className="rounded-sm transition hover:scale-[1.04] hover:text-[#E6C78A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96A]"
          >
            {Icon}
          </button>
        ) : (
          <span key={rating}>{Icon}</span>
        );
      })}
    </div>
  );
}
