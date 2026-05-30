// src/components/BookCard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Rating from "../Button/Rating";
import { rateBook } from "../../services/api";

const UPLOAD_BASE_URL =
  import.meta.env.VITE_UPLOAD_URL ||
  "http://localhost/BookStore-Management/Backend/uploads";

const coverThemes = [
  {
    cover: "from-blue-100 via-white to-sky-100",
    spine: "bg-blue-500",
    badge: "bg-blue-600",
  },
  {
    cover: "from-emerald-100 via-white to-teal-100",
    spine: "bg-emerald-500",
    badge: "bg-emerald-600",
  },
  {
    cover: "from-amber-100 via-white to-orange-100",
    spine: "bg-amber-500",
    badge: "bg-amber-600",
  },
  {
    cover: "from-rose-100 via-white to-pink-100",
    spine: "bg-rose-500",
    badge: "bg-rose-600",
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
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

function getCoverSrc(coverImage) {
  if (!coverImage) return "";
  if (/^(https?:|data:)/i.test(coverImage)) return coverImage;
  return `${UPLOAD_BASE_URL}/${String(coverImage).replace(/^\/+/, "")}`;
}

function getInitials(title) {
  return String(title || "Book")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function getTheme(book) {
  const source = Number(book?.category_id ?? book?.id ?? 0);
  return coverThemes[Math.abs(source) % coverThemes.length];
}

function getStockLabel(stock) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return `Only ${stock} left`;
  return "In stock";
}

function getRating(book) {
  const raw =
    book?.rating ?? book?.average_rating ?? book?.avg_rating ?? book?.rate;
  const rating = Number.parseFloat(raw);
  return Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : null;
}

function getReviewCount(book) {
  const raw =
    book?.review_count ??
    book?.reviews_count ??
    book?.rating_count ??
    book?.ratings_count;
  const count = Number(raw);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function getUserRating(book) {
  const rating = Number.parseFloat(book?.user_rating ?? book?.userRating);
  return Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : null;
}

function CoverPlaceholder({ title, theme }) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${theme.cover}`}
    >
      <div className={`absolute inset-y-0 left-0 w-3 ${theme.spine}`} />
      <div className="absolute inset-x-8 top-6 h-px bg-slate-200" />
      <div className="absolute inset-x-8 bottom-6 h-px bg-slate-200" />
      <div className="flex aspect-[3/4] h-36 max-h-[78%] flex-col justify-between rounded-md border border-white/80 bg-white/80 p-4 text-center shadow-md backdrop-blur-sm">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-md ${theme.badge} font-display text-xl font-bold text-white`}
        >
          {getInitials(title)}
        </span>
        <span className="line-clamp-3 text-sm font-semibold leading-snug text-dark">
          {title}
        </span>
      </div>
    </div>
  );
}

function getRatingErrorMessage(err) {
  if (err?.response?.status === 401) return "Sign in to rate this book.";
  return err?.response?.data?.error || "Failed to save rating.";
}

export default function BookCard({ book, onAddToCart, onBookRated }) {
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
  const category = currentBook.category_name || "Uncategorized";
  const stock = Number(currentBook.stock || 0);
  const price = Number.parseFloat(currentBook.price || 0);
  const detailsPath = `/books/${currentBook.id}`;
  const coverSrc = getCoverSrc(currentBook.cover_image);
  const theme = getTheme(currentBook);
  const rating = getRating(currentBook);
  const userRating = getUserRating(currentBook);
  const reviewCount = getReviewCount(currentBook);

  const handleAddToCart = (e) => {
    e.preventDefault(); // prevent the stretched link from firing
    if (stock > 0) onAddToCart?.(currentBook);
  };

  const handleRate = async (value) => {
    setIsRating(true);
    setRatingError("");
    try {
      const res = await rateBook(currentBook.id, value);
      setDisplayBook(res.data);
      onBookRated?.(res.data);
    } catch (err) {
      setRatingError(getRatingErrorMessage(err));
    } finally {
      setIsRating(false);
    }
  };

  return (
    // 👇 position:relative so the stretched link is contained
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* ✅ Stretched link — covers the whole card */}
      <Link
        to={detailsPath}
        aria-label={`View details for ${title}`}
        className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      {/* Cover image — sits above the link visually but pointer events pass through */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CoverPlaceholder title={title} theme={theme} />
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
            stock > 0 ? "bg-white text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {getStockLabel(stock)}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
            {category}
          </span>
          {book.published_year && (
            <span className="shrink-0 text-xs font-semibold text-muted">
              {book.published_year}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 font-display text-xl font-bold leading-tight text-dark transition group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted">by {author}</p>

        <div className="mt-auto pt-3">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-primary">
                {currency.format(Number.isFinite(price) ? price : 0)}
              </p>

              {/* 👇 z-10 + relative so rating stays clickable above the stretched link */}
              <div className="relative z-10">
                <Rating
                  rating={rating}
                  userRating={userRating}
                  reviewCount={reviewCount}
                  size="sm"
                  isLoading={isRating}
                  onRate={handleRate}
                />
                {ratingError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {ratingError}
                  </p>
                )}
              </div>
            </div>

            {/* "Details" text link — still works but now redundant; kept for UX clarity */}
            {/* <span className="relative z-10 flex items-center gap-1 text-sm font-semibold text-muted transition group-hover:text-primary">
              Details →
            </span> */}
          </div>

          {/* 👇 z-10 + relative + e.preventDefault() so button doesn't trigger navigation */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={stock <= 0}
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-lg bg-[#243a5f] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b2d49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#243a5f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            <CartIcon />
            {stock > 0 ? "Add to cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}
