import { useEffect, useState } from "react";

const STAR_COUNT = 5;

function getStorageKey(cardId) {
  return `cardbook_rating_${cardId}`;
}

function normalizeRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) return 0;
  return Math.min(STAR_COUNT, Math.max(0, Math.floor(rating)));
}

function StarIcon({ filled }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{
        width: 24,
        height: 24,
        color: filled ? "#f59e0b" : "#94a3b8",
        transition: "color 150ms ease",
      }}
    >
      <path
        d="m12 2.6 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.6-4.4 6.3-.9L12 2.6Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function StarRating({ cardId, initialRating = 0, onRate }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(() =>
    normalizeRating(initialRating),
  );
  const [loadedCardId, setLoadedCardId] = useState("");

  useEffect(() => {
    const savedRating = localStorage.getItem(getStorageKey(cardId));

    setSelectedRating(
      savedRating === null
        ? normalizeRating(initialRating)
        : normalizeRating(savedRating),
    );
    setLoadedCardId(cardId);
  }, [cardId, initialRating]);

  useEffect(() => {
    if (loadedCardId !== cardId) return;

    const storageKey = getStorageKey(cardId);

    if (selectedRating > 0) {
      localStorage.setItem(storageKey, String(selectedRating));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [cardId, loadedCardId, selectedRating]);

  const displayRating = hoverRating || selectedRating;

  const handleRate = (rating) => {
    const nextRating = selectedRating === rating ? 0 : rating;

    setSelectedRating(nextRating);
    onRate?.(nextRating);
  };

  return (
    <div
      role="group"
      aria-label="Rate this card"
      onMouseLeave={() => setHoverRating(0)}
      style={{ display: "inline-flex", gap: 4 }}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const rating = index + 1;

        return (
          <button
            key={rating}
            type="button"
            aria-label={`Rate ${rating} out of 5`}
            onClick={() => handleRate(rating)}
            onFocus={() => setHoverRating(rating)}
            onBlur={() => setHoverRating(0)}
            onMouseEnter={() => setHoverRating(rating)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              padding: 2,
              border: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <StarIcon filled={rating <= displayRating} />
          </button>
        );
      })}
    </div>
  );
}
