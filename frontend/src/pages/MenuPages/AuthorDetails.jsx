import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthorDetailCard from "../../components/Cards/AuthorDetailCard";
import BookCard from "../../components/Cards/BookCard";
import { getBooks } from "../../services/api";

function normalizeBooks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.books)) return data.books;
  return [];
}

function decodeAuthorName(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function getAuthorFromBooks(authorName, books) {
  const targetName = authorName.trim().toLowerCase();
  const authorBooks = books.filter(
    (book) =>
      String(book.author || "")
        .trim()
        .toLowerCase() === targetName,
  );

  if (authorBooks.length === 0) return null;

  return {
    name: authorBooks[0].author || authorName,
    image: authorBooks.find((book) => book.author_image)?.author_image || null,
    books: authorBooks,
    categories: Array.from(
      new Set(authorBooks.map((book) => book.category_name).filter(Boolean)),
    ),
  };
}

function getMoreBooks(authorBooks, allBooks) {
  const authorBookIds = new Set(authorBooks.map((book) => String(book.id)));
  const authorCategoryIds = new Set(
    authorBooks.map((book) => String(book.category_id)).filter(Boolean),
  );

  return allBooks
    .filter((book) => !authorBookIds.has(String(book.id)))
    .sort((first, second) => {
      const firstMatch = authorCategoryIds.has(String(first.category_id));
      const secondMatch = authorCategoryIds.has(String(second.category_id));

      if (firstMatch !== secondMatch) return firstMatch ? -1 : 1;
      return (
        Number(second.published_year || 0) - Number(first.published_year || 0)
      );
    })
    .slice(0, 4);
}

export default function AuthorDetails({ onAddToCart }) {
  const { authorName } = useParams();
  const decodedAuthorName = decodeAuthorName(authorName);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const author = useMemo(
    () => getAuthorFromBooks(decodedAuthorName, books),
    [books, decodedAuthorName],
  );

  const moreBooks = useMemo(
    () => (author ? getMoreBooks(author.books, books) : []),
    [author, books],
  );

  const handleBookRated = (updatedBook) => {
    setBooks((current) =>
      current.map((book) =>
        String(book.id) === String(updatedBook.id)
          ? { ...book, ...updatedBook }
          : book,
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

  if (!author) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="font-display text-3xl font-bold text-dark">
          Author not found.
        </p>
        <Link
          to="/authors"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Back to Authors
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/authors"
        className="mb-8 inline-block text-sm font-semibold text-muted transition hover:text-primary"
      >
        Back to Authors
      </Link>

      <AuthorDetailCard author={author} onBookRated={handleBookRated} />

      <section className="mt-14">
        <div className="mb-8">
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            Author Books
          </span>
          <h2 className="font-display text-3xl font-bold text-dark">
            Books by {author.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {author.books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onAddToCart={onAddToCart}
              onBookRated={handleBookRated}
            />
          ))}
        </div>
      </section>

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

        {moreBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {moreBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
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
