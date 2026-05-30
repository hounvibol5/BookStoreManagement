import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getReports } from "../../../services/api";
import { getStoredUser, isAdminUser } from "../../../utils/authStorage";
import NavbarDashboard from "./NavbarDashboard/NavbarDashboard";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const activityValues = [48, 20, 10, 22, 50, 10, 40];
const fallbackSalesValues = [55, 45, 300, 320, 500, 340, 200, 230, 500];
const operationsValues = [40, 35, 300, 210, 500, 230, 400, 220, 500];

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
    cart: (
      <svg {...common}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L21 8H6" />
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
    refresh: (
      <svg {...common}>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M16 8h5V3" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return icons[name] || icons.book;
}

function MetricCard({
  icon,
  label,
  value,
  change,
  tone,
  context = "from current reports",
}) {
  const tones = {
    dark: "from-slate-900 to-zinc-700 shadow-slate-300",
    pink: "from-pink-600 to-rose-500 shadow-pink-200",
    green: "from-emerald-600 to-green-500 shadow-emerald-200",
    blue: "from-sky-600 to-blue-500 shadow-sky-200",
  };

  return (
    <section className="relative rounded-lg border border-slate-100 bg-white p-5 pt-7 shadow-lg shadow-slate-200/70">
      <div
        className={`absolute -top-4 left-5 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-lg ${
          tones[tone] || tones.blue
        }`}
      >
        <Icon name={icon} />
      </div>
      <div className="pl-16 text-right">
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-700">{value}</p>
      </div>
      <p className="mt-7 text-sm font-semibold text-slate-400">
        <span
          className={String(change).startsWith("-") ? "text-rose-500" : "text-emerald-500"}
        >
          {change}
        </span>{" "}
        {context}
      </p>
    </section>
  );
}

function BarChart({ values }) {
  return (
    <div className="flex h-44 items-end gap-5 rounded-lg bg-gradient-to-br from-pink-600 to-rose-500 px-6 py-7 shadow-lg shadow-pink-200">
      {values.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-3">
          <div
            className="w-full max-w-3 rounded-full bg-white/80"
            style={{ height: `${value * 2}px` }}
          />
          <span className="text-xs font-semibold text-white/75">
            {"MTWTFSS"[index]}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ values, tone = "green" }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = 18 + index * (264 / (values.length - 1));
      const y = 126 - (value / max) * 100;

      return `${x},${y}`;
    })
    .join(" ");
  const isDark = tone === "dark";

  return (
    <div
      className={`rounded-lg p-4 shadow-lg ${
        isDark
          ? "bg-gradient-to-br from-zinc-900 to-slate-800 shadow-slate-300"
          : "bg-gradient-to-br from-emerald-600 to-green-500 shadow-emerald-200"
      }`}
    >
      <svg viewBox="0 0 320 160" className="h-44 w-full">
        {[30, 60, 90, 120].map((line) => (
          <line
            key={line}
            x1="12"
            x2="308"
            y1={line}
            y2={line}
            stroke="currentColor"
            strokeDasharray="4 5"
            className={isDark ? "text-white/10" : "text-white/20"}
          />
        ))}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.split(" ").map((point) => {
          const [cx, cy] = point.split(",");

          return (
            <circle
              key={point}
              cx={cx}
              cy={cy}
              r="4"
              fill="white"
              opacity="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}

function ChartPanel({ children, title, subtitle, footer }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/70">
      {children}
      <div className="px-2 pb-2 pt-5">
        <h2 className="text-base font-extrabold text-slate-700">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
        <p className="mt-6 text-sm font-semibold text-slate-400">{footer}</p>
      </div>
    </section>
  );
}

function TopCustomerList({ customers, loading }) {
  if (loading) {
    return Array(4)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />
      ));
  }

  if (customers.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-400">
        No customer data found.
      </p>
    );
  }

  return customers.slice(0, 5).map((customer) => (
    <div key={customer.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50 font-extrabold text-pink-600">
        {String(customer.name || "C").charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-700">
          {customer.name}
        </p>
        <p className="text-xs font-bold uppercase text-slate-400">
          {customer.order_count || 0} orders
        </p>
      </div>
      <p className="ml-auto shrink-0 text-sm font-extrabold text-slate-600">
        {currency.format(Number(customer.total_spent || 0))}
      </p>
    </div>
  ));
}

export default function Reports() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    books: 0,
    customers: 0,
    activeCustomers: 0,
    inventory: 0,
    inventoryValue: 0,
    lowStock: 0,
    orders: 0,
    revenue: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [salesValues, setSalesValues] = useState(fallbackSalesValues);

  const catalogHealth = useMemo(() => {
    if (summary.books === 0) return 0;

    return Math.round(
      ((summary.books - summary.lowStock) / summary.books) * 100,
    );
  }, [summary.books, summary.lowStock]);

  const loadReports = () => {
    setLoading(true);
    setError("");

    getReports({ limit: 5 })
      .then((res) => {
        const payload = res.data || {};
        const nextSummary = {
          books: 0,
          customers: 0,
          activeCustomers: 0,
          inventory: 0,
          inventoryValue: 0,
          lowStock: 0,
          orders: 0,
          revenue: 0,
          ...(payload.summary || {}),
        };

        setCustomers(payload.customers || []);
        setSummary(nextSummary);

        const nextSalesValues = (payload.dailySales || [])
          .slice()
          .reverse()
          .map((day) => Number(day.revenue || day.items_sold || 0));

        setSalesValues(
          nextSalesValues.length > 0 ? nextSalesValues : fallbackSalesValues,
        );
      })
      .catch((err) => {
        setCustomers([]);
        setSalesValues(fallbackSalesValues);
        setError(err.response?.data?.error || "Failed to load reports");
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

    loadReports();
  }, [navigate, user?.role]);

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-dark">
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Sign in with an admin account to view reports.
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
                Store Reports
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-slate-800">
                Reports
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-400">
                Review store revenue, customer activity, catalog health, and
                operating trends.
              </p>
            </div>

            <button
              type="button"
              onClick={loadReports}
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

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="coin"
              label="Recent Revenue"
              value={loading ? "..." : currency.format(summary.revenue)}
              change="+12%"
              tone="dark"
              context="from recent orders"
            />
            <MetricCard
              icon="user"
              label="Customers"
              value={loading ? "..." : summary.customers}
              change={`${summary.activeCustomers} active`}
              tone="pink"
              context="registered customers"
            />
            <MetricCard
              icon="box"
              label="Inventory"
              value={loading ? "..." : summary.inventory}
              change={summary.lowStock > 0 ? `-${summary.lowStock}` : "+0"}
              tone="green"
              context="low-stock titles"
            />
            <MetricCard
              icon="cart"
              label="Orders"
              value={loading ? "..." : summary.orders}
              change="+5%"
              tone="blue"
              context="from order history"
            />
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-3">
            <ChartPanel
              title="Catalog Views"
              subtitle="Weekly store activity"
              footer="campaign synced 2 days ago"
            >
              <BarChart values={activityValues} />
            </ChartPanel>
            <ChartPanel
              title="Daily Sales"
              subtitle="Inventory movement"
              footer="updated from latest report load"
            >
              <LineChart values={salesValues} />
            </ChartPanel>
            <ChartPanel
              title="Completed Tasks"
              subtitle="Admin operations"
              footer="dashboard actions monitored"
            >
              <LineChart values={operationsValues} tone="dark" />
            </ChartPanel>
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">
                    Report Summary
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    High-level store operating snapshot
                  </p>
                </div>
                <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase text-sky-600">
                  {catalogHealth}% catalog health
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Catalog
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">
                    {summary.books} titles
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    {currency.format(summary.inventoryValue)} in stock value
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase text-emerald-500">
                    Revenue
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                    {currency.format(summary.revenue)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600/70">
                    From loaded recent orders
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50 p-4">
                  <p className="text-xs font-bold uppercase text-pink-500">
                    Customers
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-pink-700">
                    {summary.activeCustomers} active
                  </p>
                  <p className="mt-2 text-sm font-semibold text-pink-600/70">
                    {summary.customers} total accounts
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase text-rose-500">
                    Attention
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-rose-700">
                    {summary.lowStock} low
                  </p>
                  <p className="mt-2 text-sm font-semibold text-rose-600/70">
                    Titles at reorder threshold
                  </p>
                </div>
              </div>
            </section>

            <aside className="rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70">
              <h2 className="text-sm font-extrabold uppercase text-slate-400">
                Top Customers
              </h2>
              <div className="mt-3 space-y-3">
                <TopCustomerList customers={customers} loading={loading} />
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
