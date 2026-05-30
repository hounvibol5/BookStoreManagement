import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addBook,
  addCategory,
  deleteBook,
  getBooks,
  getCategories,
  updateBook,
} from "../../../services/api";
import { getStoredUser, isAdminUser } from "../../../utils/authStorage";
import NavbarDashboard from "./NavbarDashboard/NavbarDashboard";

const LOW_STOCK_THRESHOLD = 5;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function generateIsbn13() {
  const prefix = "978";
  const group = "1";
  const publisher = String(Math.floor(1000 + Math.random() * 9000));
  const title = String(Date.now()).slice(-5);
  const firstTwelve = `${prefix}${group}${publisher}${title}`.slice(0, 12);
  const sum = firstTwelve
    .split("")
    .reduce(
      (total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0,
    );
  const checkDigit = (10 - (sum % 10)) % 10;

  return `${firstTwelve}${checkDigit}`;
}

function createEmptyForm() {
  return {
    title: "",
    author: "",
    author_image: "",
    new_author: "",
    category_id: "",
    price: "",
    stock: "",
    description: "",
    isbn: generateIsbn13(),
    cover_image: "",
    new_category: "",
    published_year: "",
  };
}

function createFormFromBook(book) {
  return {
    title: book.title || "",
    author: book.author || "",
    author_image: book.author_image || "",
    new_author: "",
    category_id: book.category_id || "",
    price: book.price ?? "",
    stock: book.stock ?? "",
    description: book.description || "",
    isbn: book.isbn || "",
    cover_image: book.cover_image || "",
    new_category: "",
    published_year: book.published_year || "",
  };
}

function getBooksFromPayload(payload) {
  return Array.isArray(payload) ? payload : payload?.books || [];
}

function getSortedAuthors(authorNames) {
  return Array.from(
    new Set(
      authorNames
        .map((author) => String(author || "").trim())
        .filter(Boolean),
    ),
  ).sort((first, second) => first.localeCompare(second));
}

function bookMatchesSearch(book, search) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    book.id,
    book.title,
    book.author,
    book.author_image,
    book.category_name,
    book.isbn,
    book.published_year,
  ]
    .filter((value) => value !== null && value !== undefined)
    .some((value) => String(value).toLowerCase().includes(query));
}

function getCatalogSummary(books, total) {
  const inventory = books.reduce(
    (sum, book) => sum + Number(book.stock || 0),
    0,
  );
  const inventoryValue = books.reduce(
    (sum, book) => sum + Number(book.stock || 0) * Number(book.price || 0),
    0,
  );
  const lowStock = books.filter(
    (book) =>
      Number(book.stock || 0) > 0 &&
      Number(book.stock || 0) <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStock = books.filter(
    (book) => Number(book.stock || 0) === 0,
  ).length;
  const bookCount = total || books.length;

  return {
    books: bookCount,
    inventory,
    inventoryValue,
    lowStock,
    outOfStock,
    healthyStock: Math.max(0, bookCount - lowStock - outOfStock),
  };
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
  };

  const icons = {
    arrowLeft: (
      <svg {...common}>
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
    ),
    book: (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </svg>
    ),
    box: (
      <svg {...common}>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),
    coin: (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v10" />
        <path d="M9 10.5c0-1.3 1.1-2.2 3-2.2 1 0 1.8.2 2.4.7" />
        <path d="M15 13.7c0 1.3-1.1 2.2-3 2.2-1.2 0-2.2-.3-2.8-.9" />
      </svg>
    ),
    plus: (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    refresh: (
      <svg {...common}>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M16 8h5V3" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  };

  return icons[name] || icons.book;
}

function MetricCard({ icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-400">{detail}</p>
    </section>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusMessage({ error, success }) {
  if (!error && !success) return null;

  return (
    <div
      className={`rounded-lg border p-4 text-sm font-bold ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {error || success}
    </div>
  );
}

function TextCell({ children, className = "" }) {
  return (
    <td className={`py-4 pr-4 text-sm font-bold text-slate-500 ${className}`}>
      {children === null || children === undefined || children === ""
        ? "-"
        : children}
    </td>
  );
}

function UrlCell({ value }) {
  return (
    <TextCell className="max-w-44">
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sky-600 hover:underline"
          title={value}
        >
          {value}
        </a>
      ) : (
        "-"
      )}
    </TextCell>
  );
}

export default function AddBook() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [form, setForm] = useState(() => createEmptyForm());
  const [editingBookId, setEditingBookId] = useState(null);
  const [deletingBookId, setDeletingBookId] = useState(null);
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = editingBookId !== null;
  const summary = useMemo(
    () => getCatalogSummary(books, totalBooks),
    [books, totalBooks],
  );
  const filteredBooks = useMemo(
    () => books.filter((book) => bookMatchesSearch(book, search)),
    [books, search],
  );
  const catalogHealth = useMemo(() => {
    if (summary.books === 0) return 0;

    return Math.round((summary.healthyStock / summary.books) * 100);
  }, [summary.books, summary.healthyStock]);

  const loadBooks = () => {
    setPageLoading(true);

    Promise.allSettled([
      getCategories(),
      getBooks({ page: 1, limit: 100 }),
    ])
      .then(([categoriesResult, booksResult]) => {
        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value.data || []);
        }

        if (booksResult.status === "fulfilled") {
          const payload = booksResult.value.data;
          const nextBooks = getBooksFromPayload(payload);

          setBooks(nextBooks);
          setAuthors(getSortedAuthors(nextBooks.map((book) => book.author)));
          setTotalBooks(payload.total || nextBooks.length);
        }
      })
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isAdminUser(user)) {
      return;
    }

    loadBooks();
  }, [navigate, user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "author" && value !== "other" ? { new_author: "" } : {}),
      ...(name === "category_id" && value !== "other"
        ? { new_category: "" }
        : {}),
    }));
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingBookId(null);
    setError("");
    setSuccess("");
  };

  const regenerateIsbn = () =>
    setForm((current) => ({ ...current, isbn: generateIsbn13() }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let nextBook = { ...form };

      if (form.author === "other") {
        const authorName = form.new_author.trim();

        if (!authorName) {
          setError("Enter an author name or select an existing author.");
          return;
        }

        nextBook = { ...nextBook, author: authorName };
      } else {
        nextBook.author = nextBook.author.trim();
      }

      if (form.category_id === "other") {
        const categoryName = form.new_category.trim();

        if (!categoryName) {
          setError("Enter a category name or select an existing category.");
          return;
        }

        const categoryRes = await addCategory({ name: categoryName });
        const nextCategory = categoryRes.data;

        setCategories((current) => {
          const exists = current.some(
            (category) => Number(category.id) === Number(nextCategory.id),
          );

          return exists ? current : [...current, nextCategory];
        });

        nextBook = { ...nextBook, category_id: nextCategory.id };
      }

      nextBook.author_image = nextBook.author_image.trim();
      nextBook.cover_image = nextBook.cover_image.trim();
      delete nextBook.new_author;
      delete nextBook.new_category;

      if (isEditing) {
        await updateBook(editingBookId, nextBook);
      } else {
        await addBook(nextBook);
      }

      setForm(createEmptyForm());
      setEditingBookId(null);
      setSuccess(
        isEditing ? "Book updated successfully." : "Book added successfully.",
      );
      loadBooks();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (isEditing ? "Failed to update book" : "Failed to add book"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBookId(book.id);
    setForm(createFormFromBook(book));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}" from the catalog?`)) {
      return;
    }

    setDeletingBookId(book.id);
    setError("");
    setSuccess("");

    try {
      await deleteBook(book.id);
      const nextBooks = books.filter(
        (currentBook) => Number(currentBook.id) !== Number(book.id),
      );

      setBooks(nextBooks);
      setAuthors(getSortedAuthors(nextBooks.map((item) => item.author)));
      setTotalBooks((current) => Math.max(0, current - 1));

      if (Number(editingBookId) === Number(book.id)) {
        setEditingBookId(null);
        setForm(createEmptyForm());
      }

      setSuccess("Book deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete book");
    } finally {
      setDeletingBookId(null);
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-dark">
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Sign in with an admin account to manage books.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-block">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 text-slate-700 sm:px-5">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[245px_minmax(0,1fr)]">
        <NavbarDashboard catalogHealth={catalogHealth} />

        <main className="min-w-0">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/dashboard"
                className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-slate-400 transition hover:text-sky-600"
              >
                <Icon name="arrowLeft" className="h-4 w-4" />
                Dashboard
              </Link>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Book Management
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-slate-800">
                Books
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-400">
                Add catalog books, update inventory details, and remove titles.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Icon name="plus" className="h-4 w-4" />
                New Book
              </button>
              <button
                type="button"
                onClick={loadBooks}
                disabled={pageLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon
                  name="refresh"
                  className={`h-4 w-4 ${pageLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="book"
              label="Total Books"
              value={pageLoading ? "..." : summary.books}
              detail={`${books.length} loaded catalog records`}
            />
            <MetricCard
              icon="box"
              label="Inventory"
              value={pageLoading ? "..." : summary.inventory}
              detail={`${summary.lowStock} low-stock titles`}
              tone="green"
            />
            <MetricCard
              icon="coin"
              label="Stock Value"
              value={pageLoading ? "..." : currency.format(summary.inventoryValue)}
              detail={`${summary.healthyStock} healthy titles`}
              tone="blue"
            />
            <MetricCard
              icon="box"
              label="Out Of Stock"
              value={pageLoading ? "..." : summary.outOfStock}
              detail={`Reorder below ${LOW_STOCK_THRESHOLD} units`}
              tone="rose"
            />
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">
                    {isEditing ? "Update Book" : "Add Book"}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {isEditing
                      ? `Editing catalog item #${editingBookId}`
                      : "Create a new catalog item"}
                  </p>
                </div>
                <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase text-sky-600">
                  {isEditing ? "Update" : "Create"}
                </span>
              </div>

              <StatusMessage error={error} success={success} />

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Title">
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="input rounded-lg"
                    />
                  </FormField>

                  <FormField label="Author">
                    <select
                      name="author"
                      value={form.author}
                      onChange={handleChange}
                      required
                      className="input rounded-lg"
                    >
                      <option value="">Select author</option>
                      {authors.map((author) => (
                        <option key={author} value={author}>
                          {author}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </FormField>

                  {form.author === "other" && (
                    <FormField label="New Author">
                      <input
                        name="new_author"
                        value={form.new_author}
                        onChange={handleChange}
                        required
                        className="input rounded-lg"
                      />
                    </FormField>
                  )}

                  <FormField label="Author Image URL">
                    <input
                      name="author_image"
                      type="url"
                      value={form.author_image}
                      onChange={handleChange}
                      className="input rounded-lg"
                      placeholder="https://example.com/author.jpg"
                    />
                  </FormField>

                  <FormField label="Category">
                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      className="input rounded-lg"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </FormField>

                  {form.category_id === "other" && (
                    <FormField label="New Category">
                      <input
                        name="new_category"
                        value={form.new_category}
                        onChange={handleChange}
                        required
                        className="input rounded-lg"
                      />
                    </FormField>
                  )}

                  <FormField label="Price">
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={handleChange}
                      required
                      className="input rounded-lg"
                    />
                  </FormField>

                  <FormField label="Stock">
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={handleChange}
                      className="input rounded-lg"
                    />
                  </FormField>

                  <FormField label="Published Year">
                    <input
                      name="published_year"
                      type="number"
                      min="0"
                      value={form.published_year}
                      onChange={handleChange}
                      className="input rounded-lg"
                    />
                  </FormField>
                </div>

                <FormField label="ISBN">
                  <div className="flex gap-2">
                    <input
                      name="isbn"
                      value={form.isbn}
                      onChange={handleChange}
                      className="input rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={regenerateIsbn}
                      className="rounded-lg border border-sky-200 px-3 text-sm font-extrabold text-sky-600 transition hover:bg-sky-50"
                      aria-label="Regenerate ISBN"
                    >
                      <Icon name="refresh" className="h-4 w-4" />
                    </button>
                  </div>
                </FormField>

                <FormField label="Cover Image URL">
                  <input
                    name="cover_image"
                    type="url"
                    value={form.cover_image}
                    onChange={handleChange}
                    className="input rounded-lg"
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="input resize-none rounded-lg"
                  />
                </FormField>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-200 transition hover:from-pink-700 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? isEditing
                        ? "Saving..."
                        : "Adding..."
                      : isEditing
                        ? "Update Book"
                        : "Add Book"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
                  >
                    {isEditing ? "Cancel Update" : "Clear"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">
                    Book Catalog
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    Add, update, and delete store books
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
                  <label className="relative w-full sm:min-w-80">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Icon name="search" className="h-4 w-4" />
                    </span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search books to update or delete..."
                      className="input rounded-lg pl-10"
                    />
                  </label>
                  <span className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-3 py-2 text-xs font-extrabold uppercase text-emerald-600">
                    {filteredBooks.length} of {totalBooks}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1680px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-extrabold uppercase text-slate-400">
                      <th className="py-3 pr-4">ID</th>
                      <th className="py-3 pr-4">Book</th>
                      <th className="py-3 pr-4">Author Image</th>
                      <th className="py-3 pr-4">Category ID</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Price</th>
                      <th className="py-3 pr-4">Stock</th>
                      <th className="py-3 pr-4">Description</th>
                      <th className="py-3 pr-4">ISBN</th>
                      <th className="py-3 pr-4">Year</th>
                      <th className="py-3 pr-4">Cover Image</th>
                      <th className="py-3 pr-4">Rating</th>
                      <th className="py-3 pr-4">Reviews</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <tr key={index} className="border-b border-slate-100">
                            <td colSpan="14" className="py-4">
                              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                            </td>
                          </tr>
                        ))
                    ) : filteredBooks.length > 0 ? (
                      filteredBooks.map((book) => (
                        <tr key={book.id} className="border-b border-slate-100">
                          <TextCell>#{book.id}</TextCell>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 font-extrabold text-sky-600">
                                {String(book.title || "B").charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-slate-700">
                                  {book.title}
                                </p>
                                <p className="truncate text-xs font-bold text-slate-400">
                                  {book.author}
                                </p>
                              </div>
                            </div>
                          </td>
                          <UrlCell value={book.author_image} />
                          <TextCell>{book.category_id}</TextCell>
                          <TextCell>{book.category_name || "Uncategorized"}</TextCell>
                          <TextCell>
                            {currency.format(Number(book.price || 0))}
                          </TextCell>
                          <TextCell>{Number(book.stock || 0)}</TextCell>
                          <TextCell className="max-w-64">
                            <span className="block truncate" title={book.description || ""}>
                              {book.description || "-"}
                            </span>
                          </TextCell>
                          <TextCell>{book.isbn}</TextCell>
                          <TextCell>{book.published_year}</TextCell>
                          <UrlCell value={book.cover_image} />
                          <TextCell>
                            {book.rating === null || book.rating === undefined
                              ? "New"
                              : Number(book.rating).toFixed(1)}
                          </TextCell>
                          <TextCell>{Number(book.review_count || 0)}</TextCell>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(book)}
                                className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-extrabold text-sky-600 transition hover:bg-sky-50"
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(book)}
                                disabled={Number(deletingBookId) === Number(book.id)}
                                className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {Number(deletingBookId) === Number(book.id)
                                  ? "Deleting"
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="14"
                          className="py-10 text-center text-sm font-semibold text-slate-400"
                        >
                          {search.trim()
                            ? "No books match your search."
                            : "No books found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
