import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addCategory,
  getBook,
  getBooks,
  getCategories,
  updateBook,
} from "../../../services/api";
import { getStoredUser, isAdminUser } from "../../../utils/authStorage";
import NavbarDashboard from "./NavbarDashboard/NavbarDashboard";

const LOW_STOCK_THRESHOLD = 5;

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
    isbn: "",
    cover_image: "",
    published_year: "",
    new_category: "",
  };
}

function bookToForm(book) {
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
    published_year: book.published_year || "",
    new_category: "",
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

function getCatalogHealth(books) {
  if (books.length === 0) {
    return 0;
  }

  const healthyBooks = books.filter(
    (book) => Number(book.stock || 0) > LOW_STOCK_THRESHOLD,
  ).length;

  return Math.round((healthyBooks / books.length) * 100);
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
  };

  return icons[name] || icons.book;
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

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [form, setForm] = useState(() => createEmptyForm());
  const [catalogHealth, setCatalogHealth] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authorOptions = useMemo(
    () => getSortedAuthors([...authors, form.author]),
    [authors, form.author],
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isAdminUser(user)) {
      return;
    }

    let active = true;

    setPageLoading(true);
    setError("");
    setSuccess("");

    Promise.allSettled([
      getCategories(),
      getBook(id),
      getBooks({ page: 1, limit: 100 }),
    ])
      .then(([categoriesResult, bookResult, booksResult]) => {
        if (!active) return;

        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value.data || []);
        } else {
          setCategories([]);
        }

        if (bookResult.status === "fulfilled") {
          setForm(bookToForm(bookResult.value.data));
        } else {
          setError("Book not found");
        }

        if (booksResult.status === "fulfilled") {
          const books = getBooksFromPayload(booksResult.value.data);

          setAuthors(getSortedAuthors(books.map((book) => book.author)));
          setCatalogHealth(getCatalogHealth(books));
        } else {
          setAuthors([]);
          setCatalogHealth(0);
        }
      })
      .finally(() => {
        if (active) {
          setPageLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, navigate, user?.role]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdminUser(user)) {
      setError("Admin access required");
      return;
    }

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
      await updateBook(id, nextBook);
      setSuccess("Book updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update book");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-dark">
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Sign in with an admin account to edit books.
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
                to="/dashboard/books"
                className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-slate-400 transition hover:text-sky-600"
              >
                <Icon name="arrowLeft" className="h-4 w-4" />
                Book Catalog
              </Link>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Book Management
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-slate-800">
                Edit Book
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-400">
                Update catalog details with the same fields used when adding a
                book.
              </p>
            </div>

            <Link
              to={`/books/${id}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              View Book
            </Link>
          </header>

          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Update Book
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Editing catalog item #{id}
                </p>
              </div>
              <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase text-sky-600">
                Update
              </span>
            </div>

            {pageLoading ? (
              <div className="space-y-4">
                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
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
                        {authorOptions.map((author) => (
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
                    <input
                      name="isbn"
                      value={form.isbn}
                      onChange={handleChange}
                      className="input rounded-lg"
                    />
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
                      disabled={saving || error === "Book not found"}
                      className="rounded-lg bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-200 transition hover:from-pink-700 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/books")}
                      className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
