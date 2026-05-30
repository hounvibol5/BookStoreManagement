import { useState } from "react";

const sizes = {
  sm: {
    root: "mt-1.5 gap-2 border-0 bg-transparent p-0 text-sm shadow-none",
    stars: "gap-0.5",
    star: "h-4 w-4",
    button: "p-0.5",
    count: "text-xs",
    emptyText: "New",
  },
  md: {
    root: "gap-3 rounded-xl border-2 border-border bg-white px-5 py-3 text-base shadow-sm",
    stars: "gap-1",
    star: "h-5 w-5",
    button: "p-1",
    count: "hidden text-sm xl:inline",
    emptyText: "New arrival",
  },
};

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StarIcon({ filled, className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={joinClasses(
        className,
        "transition-colors",
        filled ? "text-amber-400" : "text-slate-300",
      )}
      fill="currentColor"
    >
      <path d="m12 2.6 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.6-4.4 6.3-.9L12 2.6Z" />
    </svg>
  );
}

function normalizeRating(value) {
  const rating = Number.parseFloat(value);

  if (!Number.isFinite(rating)) return null;
  return Math.min(5, Math.max(0, rating));
}

export default function Rating({
  rating,
  reviewCount = 0,
  userRating = null,
  className = "",
  disabled = false,
  isLoading = false,
  label = "Book rating",
  onRate,
  size = "md",
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const normalizedRating = normalizeRating(rating);
  const normalizedUserRating = normalizeRating(userRating);
  const displayRating = normalizedUserRating ?? normalizedRating;
  const roundedRating = displayRating === null ? 0 : Math.round(displayRating);
  const roundedUserRating =
    normalizedUserRating === null ? 0 : Math.round(normalizedUserRating);
  const isInteractive = typeof onRate === "function";
  const isDisabled = disabled || isLoading;
  const sizeClasses = sizes[size] || sizes.md;
  const previewRating =
    isInteractive && hoverRating > 0
      ? hoverRating
      : isInteractive && roundedUserRating > 0
        ? roundedUserRating
        : roundedRating;
  const count = Number(reviewCount);
  const safeReviewCount =
    Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  const ratingLabel =
    displayRating === null
      ? "No rating yet"
      : `${displayRating.toFixed(1)} out of 5`;

  const handleRate = (value) => {
    if (isDisabled) return;
    onRate(value);
  };

  const handleKeyDown = (event) => {
    if (!isInteractive || isDisabled) return;

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextRating = Math.min(5, Math.max(1, previewRating + direction));

    setHoverRating(nextRating);
    onRate(nextRating);
  };

  return (
    <div
      className={joinClasses(
        "inline-flex items-center justify-center font-semibold",
        sizeClasses.root,
        isDisabled && isInteractive && "opacity-70",
        className,
      )}
    >
      <div
        className={joinClasses("flex shrink-0 items-center", sizeClasses.stars)}
        aria-label={isInteractive ? label : ratingLabel}
        role={isInteractive ? "radiogroup" : undefined}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) =>
          isInteractive ? (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={roundedUserRating > 0 && star === roundedUserRating}
              disabled={isDisabled}
              aria-label={`Rate ${star} out of 5`}
              onClick={() => handleRate(star)}
              onFocus={() => setHoverRating(star)}
              onBlur={() => setHoverRating(0)}
              onMouseEnter={() => setHoverRating(star)}
              className={joinClasses(
                "rounded-sm transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                sizeClasses.button,
              )}
            >
              <StarIcon
                className={sizeClasses.star}
                filled={star <= previewRating}
              />
            </button>
          ) : (
            <StarIcon
              key={star}
              className={sizeClasses.star}
              filled={star <= roundedRating}
            />
          ),
        )}
      </div>
      <span className="whitespace-nowrap text-dark">
        {isLoading
          ? "Saving..."
          : normalizedUserRating !== null
            ? `Your ${normalizedUserRating.toFixed(1)} / 5`
            : normalizedRating === null
              ? sizeClasses.emptyText
              : `${normalizedRating.toFixed(1)} / 5`}
      </span>
      {normalizedUserRating !== null && normalizedRating !== null && (
        <span className={`whitespace-nowrap text-muted ${sizeClasses.count}`}>
          Avg {normalizedRating.toFixed(1)} / 5
        </span>
      )}
      <span className={`whitespace-nowrap text-muted ${sizeClasses.count}`}>
        {safeReviewCount} {safeReviewCount === 1 ? "customer" : "customers"}
      </span>
    </div>
  );
}
