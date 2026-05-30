import { useState } from "react";
import { Link } from "react-router-dom";
import Rating from "../Button/Rating";
import { rateBook } from "../../services/api";

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

function getUserRating(book) {
  const rating = Number.parseFloat(book?.user_rating ?? book?.userRating);

  if (!Number.isFinite(rating)) return null;
  return Math.min(5, Math.max(1, rating));
}

function getAverageRating(books) {
  const ratings = books.map(getBookRating).filter((rating) => rating !== null);

  if (ratings.length === 0) return null;

  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

function getTopBook(books) {
  return [...books].sort((first, second) => {
    const firstScore = (getBookRating(first) || 0) * 100 + getReviewCount(first);
    const secondScore =
      (getBookRating(second) || 0) * 100 + getReviewCount(second);

    return secondScore - firstScore;
  })[0];
}

function getNewestBook(books) {
  return [...books].sort(
    (first, second) =>
      Number(second.published_year || 0) - Number(first.published_year || 0),
  )[0];
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-dark">{value}</p>
    </div>
  );
}

export default function AuthorDetailCard({ author, onBookRated }) {
  const [ratingBookId, setRatingBookId] = useState(null);
  const [ratingError, setRatingError] = useState("");

  if (!author) return null;

  const books = author.books || [];
  const categories = author.categories || [];
  const averageRating = getAverageRating(books);
  const totalReviews = books.reduce(
    (sum, book) => sum + getReviewCount(book),
    0,
  );
  const availableBooks = books.filter((book) => Number(book.stock || 0) > 0);
  const topBook = getTopBook(books);
  const newestBook = getNewestBook(books);
  const isPopular =
    books.length >= 3 ||
    totalReviews >= 150 ||
    (averageRating !== null && averageRating >= 4.6);

  const handleRate = async (book, value) => {
    setRatingBookId(book.id);
    setRatingError("");

    try {
      const res = await rateBook(book.id, value);
      onBookRated?.(res.data);
    } catch (err) {
      setRatingError(
        err?.response?.status === 401
          ? "Sign in to rate this book."
          : err?.response?.data?.error || "Failed to save rating.",
      );
    } finally {
      setRatingBookId(null);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col justify-between bg-gradient-to-br from-blue-50 via-white to-sky-100 p-8">
          <div>
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-primary font-display text-4xl font-bold text-white shadow-sm">
              {author.image ? (
                <img
                  src={author.image}
                  alt={`${author.name} portrait`}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(author.name) || "A"
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {isPopular && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                  Popular Author
                </span>
              )}
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary shadow-sm">
                Author Profile
              </span>
            </div>
          </div>

          {topBook && (
            <div className="mt-8 rounded-lg border border-blue-100 bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Top book
              </p>
              <Link
                to={`/books/${topBook.id}`}
                className="mt-1 block font-display text-xl font-bold leading-tight text-dark transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {topBook.title}
              </Link>
              <Rating
                rating={getBookRating(topBook)}
                userRating={getUserRating(topBook)}
                reviewCount={getReviewCount(topBook)}
                size="sm"
                isLoading={ratingBookId === topBook.id}
                onRate={(value) => handleRate(topBook, value)}
              />
              {ratingError && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {ratingError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="font-display text-4xl font-bold leading-tight text-dark">
            {author.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Browse books by {author.name}, including available titles,
            categories, ratings, and the newest additions in this bookstore.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Books" value={books.length} />
            <Stat
              label="Rating"
              value={averageRating === null ? "New" : averageRating.toFixed(1)}
            />
            <Stat label="Reviews" value={totalReviews || "-"} />
            <Stat label="Available" value={availableBooks.length} />
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Genres
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-primary"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted">No genres listed</span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Newest book
              </p>
              {newestBook ? (
                <Link
                  to={`/books/${newestBook.id}`}
                  className="block rounded-lg border border-border bg-surface/70 px-4 py-3 transition hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <p className="font-semibold text-dark">{newestBook.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {newestBook.published_year || "Unknown year"}
                  </p>
                </Link>
              ) : (
                <span className="text-sm text-muted">No books listed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
