// src/pages/Books.jsx
import { useEffect, useState } from "react";
import BookCard from "../../components/Cards/BookCard";
import { getBooks, getCategories } from "../../services/api";

function normalizeBooks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.books)) return data.books;
  return [];
}

export default function Books({ onAddToCart }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);

    getBooks({ search, category, page })
      .then((res) => {
        const nextBooks = normalizeBooks(res.data);

        setBooks(nextBooks);
        setTotalPages(res.data.totalPages || 1);
        setTotalBooks(res.data.total ?? nextBooks.length);
      })
      .catch(() => {
        setBooks([]);
        setTotalPages(1);
        setTotalBooks(0);
      })
      .finally(() => setLoading(false));
  }, [search, category, page]);

  const handleBookRated = (updatedBook) => {
    setBooks((current) =>
      current.map((book) =>
        String(book.id) === String(updatedBook.id)
          ? { ...book, ...updatedBook }
          : book,
      ),
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Our Collection
        </span>
        <h1 className="mb-2 font-display text-4xl font-bold text-dark">
          All Books
        </h1>
        <p className="text-muted">
          Browse our complete collection of {totalBooks} titles
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="input pl-12"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <select
            value={category}
            onChange={(event) => {
              setCategory(Number(event.target.value));
              setPage(1);
            }}
            className="input cursor-pointer appearance-none"
          >
            <option value={0}>All Categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="card h-72 animate-pulse" />
            ))}
        </div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p className="font-display text-xl text-dark">No books found</p>
          <p className="mt-2 text-sm">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onAddToCart={onAddToCart}
              onBookRated={handleBookRated}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`h-10 w-10 rounded-xl border-2 text-sm font-semibold transition ${
                  pageNumber === page
                    ? "border-primary bg-primary text-white shadow-md"
                    : "border-border text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {pageNumber}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
