import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCustomers } from "../../../services/api";
import { getStoredUser, isAdminUser } from "../../../utils/authStorage";
import NavbarDashboard from "./NavbarDashboard/NavbarDashboard";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(value) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(String(value).replace(" ", "T")));
}

function normalizeCustomers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.customers)) return payload.customers;
  return [];
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
    user: (
      <svg {...common}>
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    users: (
      <svg {...common}>
        <path d="M16 21a6 6 0 0 0-12 0" />
        <circle cx="10" cy="8" r="4" />
        <path d="M22 21a5 5 0 0 0-5-5" />
        <path d="M17 4a4 4 0 0 1 0 8" />
      </svg>
    ),
    wallet: (
      <svg {...common}>
        <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6" />
        <path d="M18 13h.01" />
      </svg>
    ),
    cart: (
      <svg {...common}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L21 8H6" />
      </svg>
    ),
  };

  return icons[name] || icons.user;
}

function MetricCard({ icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-primary",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-dark">{value}</p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">{detail}</p>
    </section>
  );
}

function CustomerInitial({ name }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-extrabold text-primary">
      {String(name || "C").charAt(0).toUpperCase()}
    </span>
  );
}

function CustomerTable({ customers, loading }) {
  if (loading) {
    return (
      <tbody>
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <tr key={index} className="border-b border-border">
              <td colSpan="5" className="py-4">
                <div className="h-12 animate-pulse rounded-lg bg-blue-50" />
              </td>
            </tr>
          ))}
      </tbody>
    );
  }

  if (customers.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan="5"
            className="py-12 text-center text-sm font-semibold text-muted"
          >
            No customers found.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {customers.map((customer) => (
        <tr key={customer.id} className="border-b border-border">
          <td className="py-4 pr-4">
            <div className="flex items-center gap-3">
              <CustomerInitial name={customer.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-dark">
                  {customer.name}
                </p>
                <p className="truncate text-xs font-bold text-muted">
                  {customer.email}
                </p>
              </div>
            </div>
          </td>
          <td className="py-4 pr-4 text-sm font-bold text-dark">
            {customer.order_count}
          </td>
          <td className="py-4 pr-4 text-sm font-bold text-dark">
            {currency.format(Number(customer.total_spent || 0))}
          </td>
          <td className="py-4 pr-4 text-sm font-semibold text-muted">
            {formatDate(customer.last_order_at)}
          </td>
          <td className="py-4 text-right text-sm font-semibold text-muted">
            {formatDate(customer.created_at)}
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function Customer() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total_customers: 0,
    active_customers: 0,
    total_spent: 0,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const averageValue = useMemo(() => {
    if (Number(summary.active_customers) === 0) return 0;

    return Number(summary.total_spent || 0) / Number(summary.active_customers);
  }, [summary.active_customers, summary.total_spent]);

  const loadCustomers = () => {
    setLoading(true);
    setError("");

    getCustomers({ page, limit: 10, search: search.trim() })
      .then((res) => {
        const payload = res.data || {};
        const nextCustomers = normalizeCustomers(payload);
        const nextSummary = payload.summary || {};

        setCustomers(nextCustomers);
        setSummary({
          total_customers:
            nextSummary.total_customers ?? payload.total ?? nextCustomers.length,
          active_customers: nextSummary.active_customers ?? 0,
          total_spent: Number(nextSummary.total_spent || 0),
        });
        setTotal(payload.total ?? nextCustomers.length);
        setTotalPages(payload.totalPages || 1);
      })
      .catch((err) => {
        setCustomers([]);
        setTotal(0);
        setTotalPages(1);
        setError(err.response?.data?.error || "Failed to load customers");
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

    loadCustomers();
  }, [navigate, page, search, user?.role]);

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-dark">
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Sign in with an admin account to view customer records.
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
        <NavbarDashboard />

        <main className="min-w-0">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-muted transition hover:text-primary"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
              Dashboard
            </Link>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Customer Management
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-dark">
              Customers
            </h1>
            <p className="mt-2 max-w-2xl text-muted">
              Track registered customers, order activity, and lifetime value.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon="users"
            label="Total Customers"
            value={loading ? "..." : summary.total_customers}
            detail={`${total} customers match current filters`}
          />
          <MetricCard
            icon="cart"
            label="Active Customers"
            value={loading ? "..." : summary.active_customers}
            detail="Customers with at least one order"
            tone="green"
          />
          <MetricCard
            icon="wallet"
            label="Customer Value"
            value={loading ? "..." : currency.format(summary.total_spent)}
            detail={`${currency.format(averageValue)} average active value`}
            tone="rose"
          />
          </section>

          <section className="mt-6 rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-dark">
                Customer Directory
              </h2>
              <p className="mt-1 text-sm font-semibold text-muted">
                Showing page {page} of {totalPages}
              </p>
            </div>

            <label className="relative w-full lg:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <Icon name="search" className="h-4 w-4" />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email..."
                className="input rounded-lg pl-10"
              />
            </label>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border text-xs font-extrabold uppercase tracking-widest text-muted">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Orders</th>
                  <th className="py-3 pr-4">Lifetime Value</th>
                  <th className="py-3 pr-4">Last Order</th>
                  <th className="py-3 text-right">Joined</th>
                </tr>
              </thead>
              <CustomerTable customers={customers} loading={loading} />
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-muted">
              {total === 0 ? "No customers" : `${customers.length} of ${total} customers`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || loading}
                className="rounded-lg border-2 border-border px-4 py-2 text-sm font-extrabold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || loading}
                className="rounded-lg border-2 border-border px-4 py-2 text-sm font-extrabold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          </section>
        </main>
      </div>
    </div>
  );
}
