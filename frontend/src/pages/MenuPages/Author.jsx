import { useEffect, useMemo, useState } from "react";
import AuthorCard from "../../components/Cards/AuthorCard";
import { getBooks } from "../../services/api";

function normalizeBooks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.books)) return data.books;
  return [];
}

function getBookRating(book) {
  const rating = Number.parseFloat(
    book.rating ?? book.average_rating ?? book.avg_rating ?? book.rate,
  );

  return Number.isFinite(rating) ? rating : 0;
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

function getAuthorScore(author) {
  const books = author.books || [];
  const totalReviews = books.reduce(
    (sum, book) => sum + getReviewCount(book),
    0,
  );
  const ratingTotal = books.reduce(
    (sum, book) => sum + getBookRating(book),
    0,
  );
  const averageRating = books.length > 0 ? ratingTotal / books.length : 0;

  return totalReviews + averageRating * 50 + books.length * 20;
}

export default function Author() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    getBooks({ page: 1, limit: 100 })
      .then((res) => {
        const nextBooks = normalizeBooks(res.data);
        setBooks(nextBooks);
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const authors = useMemo(() => {
    const grouped = books.reduce((acc, book) => {
      const name = book.author || "Unknown Author";

      if (!acc[name]) {
        acc[name] = {
          name,
          image: book.author_image || null,
          books: [],
          categories: new Set(),
        };
      }

      if (!acc[name].image && book.author_image) {
        acc[name].image = book.author_image;
      }

      acc[name].books.push(book);

      if (book.category_name) {
        acc[name].categories.add(book.category_name);
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .map((author) => ({
        ...author,
        categories: Array.from(author.categories),
      }))
      .filter((author) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;

        return (
          author.name.toLowerCase().includes(term) ||
          author.books.some((book) => book.title.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        const scoreDiff = getAuthorScore(b) - getAuthorScore(a);
        return scoreDiff || a.name.localeCompare(b.name);
      });
  }, [books, search]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            Author Directory
          </span>
          <h1 className="mb-2 font-display text-4xl font-bold text-dark">
            Authors
          </h1>
          <p className="text-muted">
            Explore popular writers from the current bookstore collection.
          </p>
        </div>

        <div className="w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search author or book..."
            className="input"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card h-56 animate-pulse" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p className="font-display text-xl text-dark">No authors found</p>
          <p className="mt-2 text-sm">Try a different author or book title.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {authors.map((author) => (
            <AuthorCard key={author.name} author={author} />
          ))}
        </div>
      )}
    </div>
  );
}
