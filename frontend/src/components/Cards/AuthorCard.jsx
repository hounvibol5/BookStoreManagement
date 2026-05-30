import { Link } from "react-router-dom";
import AuthorBookCard from "./AuthorBookCard";

function getInitials(name) {
  return String(name || "Author")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getBookRating(book) {
  const rating = Number.parseFloat(
    book.rating ?? book.average_rating ?? book.avg_rating ?? book.rate,
  );

  return Number.isFinite(rating) ? rating : null;
}

function getReviewCount(book) {
  const count = Number(
    book.review_count ??
      book.reviews_count ??
      book.rating_count ??
      book.ratings_count,
  );

  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function getAverageRating(books) {
  const ratings = books.map(getBookRating).filter((rating) => rating !== null);

  if (ratings.length === 0) return null;

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return total / ratings.length;
}

function getTopBook(books) {
  return [...books].sort((first, second) => {
    const firstScore = (getBookRating(first) || 0) * 100 + getReviewCount(first);
    const secondScore =
      (getBookRating(second) || 0) * 100 + getReviewCount(second);

    return secondScore - firstScore;
  })[0];
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-surface/70 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-bold text-dark">{value}</p>
    </div>
  );
}

export default function AuthorCard({ author }) {
  if (!author) return null;

  const books = author.books || [];
  const categories = author.categories || [];
  const averageRating = getAverageRating(books);
  const totalReviews = books.reduce(
    (sum, book) => sum + getReviewCount(book),
    0,
  );
  const availableBooks = books.filter((book) => Number(book.stock || 0) > 0);
  const sortedBooks = [...books].sort(
    (first, second) =>
      Number(second.published_year || 0) - Number(first.published_year || 0),
  );
  const topBook = getTopBook(books);
  const visibleBooks = sortedBooks.slice(0, 3);
  const hiddenBookCount = Math.max(books.length - visibleBooks.length, 0);
  const isPopular =
    books.length >= 3 ||
    totalReviews >= 150 ||
    (averageRating !== null && averageRating >= 4.6);
  const authorPath = `/authors/${encodeURIComponent(author.name)}`;

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isPopular && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                Popular
              </span>
            )}
            {topBook && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary">
                Top pick: {topBook.title}
              </span>
            )}
          </div>

          <Link
            to={authorPath}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <h2 className="font-display text-2xl font-bold leading-tight text-dark transition hover:text-primary">
              {author.name}
            </h2>
          </Link>
          <p className="mt-1 text-sm text-muted">
            {books.length} {books.length === 1 ? "book" : "books"}
            {categories.length > 0 &&
              ` across ${categories.length} genre${categories.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <Link
          to={authorPath}
          aria-label={`View ${author.name}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-100 font-display text-xl font-bold text-primary transition hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {author.image ? (
            <img
              src={author.image}
              alt={`${author.name} portrait`}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(author.name || "A") || "A"
          )}
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <Stat
          label="Rating"
          value={averageRating === null ? "New" : averageRating.toFixed(1)}
        />
        <Stat label="Reviews" value={totalReviews || "-"} />
        <Stat label="Available" value={availableBooks.length} />
      </div>

      {categories.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {categories.slice(0, 4).map((category) => (
            <span
              key={category}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {category}
            </span>
          ))}
          {categories.length > 4 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">
              +{categories.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="mt-auto space-y-3">
        {visibleBooks.map((book) => (
          <AuthorBookCard key={book.id} book={book} />
        ))}
      </div>

      <Link
        to={authorPath}
        className="mt-5 flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-primary transition hover:border-primary hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        View author details
      </Link>

      {hiddenBookCount > 0 && (
        <p className="mt-3 text-center text-sm font-semibold text-muted">
          +{hiddenBookCount} more {hiddenBookCount === 1 ? "book" : "books"} by{" "}
          {author.name}
        </p>
      )}
    </article>
  );
}
