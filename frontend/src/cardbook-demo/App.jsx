import { useState } from "react";
import StarRating from "./StarRating";

const cards = [
  {
    id: "react-state",
    front: "React State",
    back: "State stores data that can change over time and re-render UI.",
  },
  {
    id: "local-storage",
    front: "localStorage",
    back: "A browser storage API that persists string values across sessions.",
  },
  {
    id: "aria-label",
    front: "aria-label",
    back: "An accessibility label for controls that do not have visible text.",
  },
];

export default function App() {
  const [ratings, setRatings] = useState({});

  const handleRate = (cardId, rating) => {
    setRatings((current) => ({ ...current, [cardId]: rating }));
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 32,
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ margin: "0 0 24px", fontSize: 32 }}>Cardbook</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          maxWidth: 900,
        }}
      >
        {cards.map((card) => (
          <article
            key={card.id}
            style={{
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>{card.front}</h2>
            <p style={{ minHeight: 72, margin: "0 0 16px", color: "#475569" }}>
              {card.back}
            </p>

            <StarRating
              cardId={card.id}
              initialRating={0}
              onRate={(rating) => handleRate(card.id, rating)}
            />

            <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 14 }}>
              Current rating: {ratings[card.id] ?? "saved in localStorage"}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
