import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getInventory } from "../../../services/api";
import { getStoredUser, isAdminUser } from "../../../utils/authStorage";
import NavbarDashboard from "./NavbarDashboard/NavbarDashboard";

const LOW_STOCK_THRESHOLD = 5;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function createEmptyInventoryReport() {
  return {
    summary: {
      total_books: 0,
      total_stock: 0,
      total_value: 0,
      average_stock: 0,
      out_of_stock_count: 0,
      low_stock_count: 0,
      healthy_stock_count: 0,
      low_stock_threshold: LOW_STOCK_THRESHOLD,
    },
    low_stock_books: [],
    category_stock: [],
    fast_movers: [],
  };
}

function normalizeInventoryReport(payload) {
  const fallback = createEmptyInventoryReport();
  const summary = payload?.summary || {};

  return {
    summary: {
      total_books: Number(summary.total_books || 0),
      total_stock: Number(summary.total_stock || 0),
      total_value: Number(summary.total_value || 0),
      average_stock: Number(summary.average_stock || 0),
      out_of_stock_count: Number(summary.out_of_stock_count || 0),
      low_stock_count: Number(summary.low_stock_count || 0),
      healthy_stock_count: Number(summary.healthy_stock_count || 0),
      low_stock_threshold: Number(
        summary.low_stock_threshold || LOW_STOCK_THRESHOLD,
      ),
    },
    low_stock_books: Array.isArray(payload?.low_stock_books)
      ? payload.low_stock_books
      : fallback.low_stock_books,
    category_stock: Array.isArray(payload?.category_stock)
      ? payload.category_stock
      : fallback.category_stock,
    fast_movers: Array.isArray(payload?.fast_movers)
      ? payload.fast_movers
      : fallback.fast_movers,
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
    box: (
      <svg {...common}>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-7" />
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
    tag: (
      <svg {...common}>
        <path d="M20.5 10.5 13 3H5v8l7.5 7.5a2.1 2.1 0 0 0 3 0l5-5a2.1 2.1 0 0 0 0-3Z" />
        <path d="M7.5 7.5h.01" />
      </svg>
    ),
    warning: (
      <svg {...common}>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </svg>
    ),
  };

  return icons[name] || icons.box;
}

function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="h-1.5 rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
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

function CategoryCard({ category, totalStock }) {
  const categoryStockTotal = Number(category.total_stock || 0);

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-700">
            {category.category_name}
          </p>
          <p className="mt-1 text-xs font-bold uppercase text-slate-400">
            {category.book_count} titles
          </p>
        </div>
        <p className="text-lg font-extrabold text-slate-800">
          {categoryStockTotal}
        </p>
      </div>
      <ProgressBar value={(categoryStockTotal / totalStock) * 100} />
      <p className="mt-3 text-xs font-bold text-slate-400">
        {currency.format(Number(category.stock_value || 0))} value,{" "}
        {category.low_stock_count} low
      </p>
    </div>
  );
}

function LowStockRows({ books, loading }) {
  if (loading) {
    return (
      <tbody>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <tr key={index} className="border-b border-slate-100">
              <td colSpan="6" className="py-4">
                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
              </td>
            </tr>
          ))}
      </tbody>
    );
  }

  if (books.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan="6"
            className="py-10 text-center text-sm font-semibold text-slate-400"
          >
            No low-stock books right now.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {books.map((book) => {
        const stock = Number(book.stock || 0);
        const isOut = stock === 0;

        return (
          <tr key={book.id} className="border-b border-slate-100">
            <td className="py-4 pr-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 font-extrabold text-rose-600">
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
            <td className="py-4 pr-4 text-sm font-bold text-slate-500">
              {book.category_name || "Uncategorized"}
            </td>
            <td className="py-4 pr-4">
              <span
                className={`rounded-lg px-3 py-1 text-xs font-extrabold uppercase ${
                  isOut
                    ? "bg-slate-100 text-slate-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {isOut ? "Out" : `${stock} left`}
              </span>
            </td>
            <td className="py-4 pr-4 text-sm font-bold text-slate-500">
              {currency.format(Number(book.stock_value || 0))}
            </td>
            <td className="py-4 pr-4 text-sm font-bold text-slate-500">
              {book.sold_last_30_days || 0}
            </td>
            <td className="py-4 text-right">
              <Link
                to={`/edit-book/${book.id}`}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-extrabold text-emerald-600 transition hover:bg-emerald-50"
              >
                Restock
              </Link>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

export default function Inventory() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [report, setReport] = useState(() => createEmptyInventoryReport());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const summary = report.summary;
  const totalStockForCategories = Math.max(Number(summary.total_stock || 0), 1);
  const catalogHealth = useMemo(() => {
    if (summary.total_books === 0) return 0;

    return Math.round(
      (Number(summary.healthy_stock_count || 0) / summary.total_books) * 100,
    );
  }, [summary.healthy_stock_count, summary.total_books]);

  const loadInventory = () => {
    setLoading(true);
    setError("");

    getInventory({ threshold: LOW_STOCK_THRESHOLD, limit: 10 })
      .then((res) => setReport(normalizeInventoryReport(res.data)))
      .catch((err) => {
        setReport(createEmptyInventoryReport());
        setError(err.response?.data?.error || "Failed to load inventory");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isAdminUser(user)) {
      return;
    }

    loadInventory();
  }, [navigate, user?.role]);

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-dark">
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Sign in with an admin account to view inventory records.
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
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                Inventory Management
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-slate-800">
                Inventory
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-400">
                Monitor stock levels, category value, and books that need
                restocking.
              </p>
            </div>

            <button
              type="button"
              onClick={loadInventory}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                name="refresh"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </header>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="box"
              label="Total Stock"
              value={loading ? "..." : summary.total_stock}
              detail={`${summary.total_books} titles in catalog`}
            />
            <MetricCard
              icon="chart"
              label="Stock Value"
              value={loading ? "..." : currency.format(summary.total_value)}
              detail={`${Math.round(summary.average_stock)} average units per title`}
              tone="green"
            />
            <MetricCard
              icon="warning"
              label="Low Stock"
              value={loading ? "..." : summary.low_stock_count}
              detail={`Reorder at ${summary.low_stock_threshold} units`}
              tone="rose"
            />
            <MetricCard
              icon="tag"
              label="Out Of Stock"
              value={loading ? "..." : summary.out_of_stock_count}
              detail={`${summary.healthy_stock_count} healthy titles`}
              tone="slate"
            />
          </section>

          <section className="mt-6 rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Category Stock
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  {currency.format(summary.total_value)} in current stock value
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-extrabold uppercase text-emerald-600">
                {catalogHealth}% healthy
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="h-28 animate-pulse rounded-lg bg-slate-100"
                    />
                  ))
              ) : report.category_stock.length > 0 ? (
                report.category_stock.map((category) => (
                  <CategoryCard
                    key={category.category_id ?? category.category_name}
                    category={category}
                    totalStock={totalStockForCategories}
                  />
                ))
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-400 md:col-span-3">
                  No inventory categories found.
                </p>
              )}
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
            <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-800">
                  Low-Stock Books
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Books at or below the reorder threshold
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-extrabold uppercase text-slate-400">
                      <th className="py-3 pr-4">Book</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Stock</th>
                      <th className="py-3 pr-4">Value</th>
                      <th className="py-3 pr-4">Sold 30d</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <LowStockRows
                    books={report.low_stock_books}
                    loading={loading}
                  />
                </table>
              </div>
            </div>

            <aside className="space-y-5">
              <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
                <h2 className="text-sm font-extrabold uppercase text-slate-400">
                  Fast Movers
                </h2>
                <div className="mt-3 space-y-3">
                  {loading ? (
                    Array(4)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="h-14 animate-pulse rounded-lg bg-slate-100"
                        />
                      ))
                  ) : report.fast_movers.length > 0 ? (
                    report.fast_movers.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Icon name="box" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-700">
                            {book.title}
                          </p>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            {book.stock} in stock
                          </p>
                        </div>
                        <p className="ml-auto shrink-0 text-sm font-extrabold text-slate-600">
                          {book.sold_last_30_days} sold
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-400">
                      No recent sales movement.
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
