import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../Button/Button";
import Rating from "../Button/Rating";
import { rateBook } from "../../services/api";
import { getBookCoverSrc } from "../../utils/bookCovers";
import { isAdminUser } from "../../utils/authStorage";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  );
}

function getRating(book) {
  const rawRating =
    book?.rating ?? book?.average_rating ?? book?.avg_rating ?? book?.rate;
  const rating = Number.parseFloat(rawRating);

  if (!Number.isFinite(rating)) return null;
  return Math.min(5, Math.max(0, rating));
}

function getReviewCount(book) {
  const rawCount =
    book?.review_count ??
    book?.reviews_count ??
    book?.rating_count ??
    book?.ratings_count;
  const count = Number(rawCount);

  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function getUserRating(book) {
  const rating = Number.parseFloat(book?.user_rating ?? book?.userRating);

  if (!Number.isFinite(rating)) return null;
  return Math.min(5, Math.max(1, rating));
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 font-semibold text-dark">{value || "N/A"}</p>
    </div>
  );
}

export default function BookDetailCard({
  book,
  onAddToCart,
  onBookRated,
  onDelete,
  user,
}) {
  const navigate = useNavigate();
  const [displayBook, setDisplayBook] = useState(book);
  const [isRating, setIsRating] = useState(false);
  const [ratingError, setRatingError] = useState("");

  useEffect(() => {
    setDisplayBook(book);
    setRatingError("");
  }, [book]);

  if (!book) return null;

  const currentBook = displayBook || book;
  const title = currentBook.title || "Untitled Book";
  const author = currentBook.author || "Unknown author";
  const stock = Number(currentBook.stock || 0);
  const price = Number.parseFloat(currentBook.price || 0);
  const rating = getRating(currentBook);
  const userRating = getUserRating(currentBook);
  const reviewCount = getReviewCount(currentBook);
  const coverSrc = getBookCoverSrc(currentBook);
  const isAvailable = stock > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;

    onAddToCart?.(currentBook);
    navigate("/cart");
  };

  const handleRate = async (value) => {
    setIsRating(true);
    setRatingError("");

    try {
      const res = await rateBook(currentBook.id, value);
      setDisplayBook(res.data);
      onBookRated?.(res.data);
    } catch (err) {
      setRatingError(
        err?.response?.status === 401
          ? "Sign in to rate this book."
          : err?.response?.data?.error || "Failed to save rating.",
      );
    } finally {
      setIsRating(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div className="h-full min-h-[420px] bg-surface">
          <div className="flex h-full min-h-[420px] w-full items-center justify-center overflow-hidden bg-surface">
            <img
              src={coverSrc}
              alt={title}
              className="h-full min-h-[420px] w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {currentBook.category_name || "Uncategorized"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isAvailable ? `${stock} in stock` : "Out of stock"}
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-dark">
            {title}
          </h1>
          <p className="mt-2 text-lg text-muted">by {author}</p>

          <div className="my-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DetailRow label="ISBN" value={currentBook.isbn} />
            <DetailRow label="Year" value={currentBook.published_year} />
            <DetailRow label="Stock" value={stock} />
          </div>

          {currentBook.description && (
            <div className="mb-8">
              <h2 className="mb-2 font-display text-2xl font-bold text-dark">
                About this book
              </h2>
              <p className="leading-relaxed text-muted">
                {currentBook.description}
              </p>
            </div>
          )}

          <div className="mt-auto border-t border-border pt-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Price
                </p>
                <p className="font-display text-4xl font-bold text-primary">
                  {currency.format(Number.isFinite(price) ? price : 0)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
              <Rating
                rating={rating}
                userRating={userRating}
                reviewCount={reviewCount}
                className="min-h-[3.25rem] w-full"
                isLoading={isRating}
                onRate={handleRate}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                disabled={!isAvailable}
                onClick={handleAddToCart}
                className="min-h-[3.25rem] shadow-sm"
              >
                <CartIcon />
                {isAvailable ? "Add to Cart" : "Unavailable"}
              </Button>
            </div>
            {ratingError && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {ratingError}
              </p>
            )}

            {isAdminUser(user) && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  to={`/edit-book/${currentBook.id}`}
                  className="btn-outline text-center"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-xl border-2 border-red-200 px-5 py-2.5 font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
