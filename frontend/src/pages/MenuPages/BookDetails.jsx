// src/pages/BookDetails.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteBook, getBook, getBooks } from "../../services/api";
import BookCard from "../../components/Cards/BookCard";
import BookDetailCard from "../../components/Cards/BookDetailCard";
import { getStoredUser } from "../../utils/authStorage";

function extractBooks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.books)) return data.books;
  return [];
}

function getMoreBooks(currentBook, books) {
  if (!currentBook) return [];

  const otherBooks = books.filter(
    (item) => String(item.id) !== String(currentBook.id),
  );
  const sameCategory = otherBooks.filter(
    (item) => String(item.category_id) === String(currentBook.category_id),
  );
  const differentCategory = otherBooks.filter(
    (item) => String(item.category_id) !== String(currentBook.category_id),
  );

  return [...sameCategory, ...differentCategory].slice(0, 4);
}

export default function BookDetails({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [moreBooks, setMoreBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const user = getStoredUser();

  useEffect(() => {
    setLoading(true);

    getBook(id)
      .then((res) => setBook(res.data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!book) {
      setMoreBooks([]);
      return;
    }

    setLoadingMore(true);

    getBooks({ category: book.category_id, page: 1 })
      .then((res) => {
        const apiBooks = getMoreBooks(book, extractBooks(res.data));
        setMoreBooks(apiBooks);
      })
      .catch(() => setMoreBooks([]))
      .finally(() => setLoadingMore(false));
  }, [book]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this book?")) return;

    setDeleteError("");

    try {
      await deleteBook(id);
      navigate("/books");
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Failed to delete book");
    }
  };

  const handleBookRated = (updatedBook) => {
    setBook((current) =>
      current && String(current.id) === String(updatedBook.id)
        ? { ...current, ...updatedBook }
        : current,
    );
    setMoreBooks((current) =>
      current.map((item) =>
        String(item.id) === String(updatedBook.id)
          ? { ...item, ...updatedBook }
          : item,
      ),
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted animate-pulse">
        Loading...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="font-display text-3xl font-bold text-dark">
          Book not found.
        </p>
        <Link
          to="/books"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Back to Books
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/books"
        className="mb-8 inline-block text-sm font-semibold text-muted transition hover:text-primary"
      >
        Back to Books
      </Link>

      <BookDetailCard
        book={book}
        onAddToCart={onAddToCart}
        onBookRated={handleBookRated}
        onDelete={handleDelete}
        user={user}
      />

      {deleteError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {deleteError}
        </div>
      )}

      <section className="mt-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Keep browsing
            </span>
            <h2 className="font-display text-3xl font-bold text-dark">
              More Books
            </h2>
          </div>
          <Link
            to="/books"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all books
          </Link>
        </div>

        {loadingMore ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-lg bg-white"
                />
              ))}
          </div>
        ) : moreBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {moreBooks.map((item) => (
              <BookCard
                key={item.id}
                book={item}
                onAddToCart={onAddToCart}
                onBookRated={handleBookRated}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white p-8 text-center text-muted">
            No more books to show right now.
          </div>
        )}
      </section>
    </div>
  );
}
