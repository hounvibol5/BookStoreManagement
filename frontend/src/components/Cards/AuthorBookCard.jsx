import { Link } from "react-router-dom";

export default function AuthorBookCard({ book }) {
  if (!book) return null;

  const price = Number.parseFloat(book.price || 0);
  const stock = Number(book.stock || 0);
  const rating = Number.parseFloat(
    book.rating ?? book.average_rating ?? book.avg_rating ?? book.rate,
  );

  return (
    <Link
      to={`/books/${book.id}`}
      className="block rounded-lg border border-border bg-white px-4 py-3 transition hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight text-dark">
            {book.title}
          </p>
          <p className="mt-1 text-sm text-muted">
            {book.published_year || "Unknown year"} | $
            {Number.isFinite(price) ? price.toFixed(2) : "0.00"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {stock > 0 ? `${stock} left` : "Out"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {book.category_name && (
          <p className="truncate text-xs font-semibold text-primary">
            {book.category_name}
          </p>
        )}

        <span className="shrink-0 text-xs font-bold text-amber-500">
          {Number.isFinite(rating) ? `${rating.toFixed(1)} / 5` : "New"}
        </span>
      </div>
    </Link>
  );
}
