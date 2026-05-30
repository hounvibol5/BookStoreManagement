import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cancelOrder, getOrders, payOrder } from "../../../services/api";
import {
  getStoredToken,
  getStoredUser,
  isAdminUser,
} from "../../../utils/authStorage";
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

function getOrderStatus(order) {
  return String(order?.status || "pending").toLowerCase();
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "cancelled") {
    return "bg-red-50 text-red-600";
  }

  return "bg-blue-50 text-primary";
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
    x: (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
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

  return icons[name] || icons.cart;
}

function MetricCard({ icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    pink: "bg-pink-50 text-pink-600",
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

export function OrderManagement({
  orders = [],
  loading = false,
  totalOrders = 0,
}) {
  return (
    <section
      id="orders"
      className="mt-7 rounded-lg border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">
            Order Management
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Recent store orders and revenue
          </p>
        </div>
        <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase text-sky-600">
          {totalOrders} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-extrabold uppercase text-slate-400">
              <th className="py-3 pr-4">Order</th>
              <th className="py-3 pr-4">Customer</th>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Items</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td colSpan="6" className="py-4">
                      <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-extrabold text-slate-700">
                      #{order.id}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-700">
                        {order.customer_name || "Customer"}
                      </p>
                      <p className="truncate text-xs font-bold text-slate-400">
                        {order.customer_email || "No email"}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm font-bold text-slate-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-4 pr-4 text-sm font-bold text-slate-500">
                    {(order.items || []).length}
                  </td>
                  <td className="py-4 pr-4">
                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase text-primary">
                      {order.status || "Pending"}
                    </span>
                  </td>
                  <td className="py-4 text-right text-sm font-extrabold text-slate-700">
                    {currency.format(Number(order.total_amount || 0))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="py-10 text-center text-sm font-semibold text-slate-400"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Order({
  initialMessage = "",
  backPath = "/cart",
  backLabel = "Back",
  onBack,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [orderMessage, setOrderMessage] = useState(initialMessage);
  const [error, setError] = useState("");
  const user = getStoredUser();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate(backPath);
  };

  const loadOrders = () => {
    setLoading(true);
    setError("");

    getOrders(isDashboardRoute ? { page: 1, limit: 20 } : {})
      .then((res) => {
        const payload = res.data || {};
        const nextOrders = payload.orders || [];
        const nextRevenue = nextOrders.reduce(
          (sum, order) => sum + Number(order.total_amount || 0),
          0,
        );

        setOrders(nextOrders);
        setTotalOrders(payload.total || nextOrders.length);
        setRevenue(nextRevenue);
      })
      .catch((err) => {
        setOrders([]);
        setTotalOrders(0);
        setRevenue(0);
        setError(err.response?.data?.error || "Failed to load orders");
      })
      .finally(() => setLoading(false));
  };

  const handlePayment = async (orderId) => {
    setPaymentLoadingId(orderId);
    setOrderMessage("");
    setError("");

    try {
      const res = await payOrder(orderId);
      const paidOrder = res.data;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order.id) === String(orderId) ? paidOrder : order,
        ),
      );
      setOrderMessage(`Payment completed for order #${paidOrder.id}.`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process payment");
    } finally {
      setPaymentLoadingId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Cancel order #${orderId}?`)) {
      return;
    }

    setCancelLoadingId(orderId);
    setOrderMessage("");
    setError("");

    try {
      const res = await cancelOrder(orderId);
      const cancelledOrder = res.data;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order.id) === String(orderId) ? cancelledOrder : order,
        ),
      );
      setOrderMessage(`Order #${cancelledOrder.id} was cancelled.`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelLoadingId(null);
    }
  };

  useEffect(() => {
    if (!getStoredToken()) {
      navigate("/login");
      return;
    }

    if (isDashboardRoute && !isAdminUser(user)) {
      setLoading(false);
      return;
    }

    loadOrders();
  }, [navigate, isDashboardRoute, user?.role]);

  if (isDashboardRoute && !isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-dark">
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Sign in with an admin account to view order records.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-block">
          Go to login
        </Link>
      </div>
    );
  }

  if (isDashboardRoute) {
    const pendingOrders = orders.filter(
      (order) => String(order.status || "").toLowerCase() === "pending",
    ).length;

    return (
      <div className="min-h-screen bg-slate-100 px-3 py-4 text-slate-700 sm:px-5">
        <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[245px_minmax(0,1fr)]">
          <NavbarDashboard />

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
                  Order Management
                </p>
                <h1 className="mt-2 text-4xl font-extrabold text-slate-800">
                  Orders
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-400">
                  Review store orders, customer activity, and recent revenue.
                </p>
              </div>

              <button
                type="button"
                onClick={loadOrders}
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

            {location.state?.message && (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                {location.state.message}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                icon="cart"
                label="Total Orders"
                value={loading ? "..." : totalOrders}
                detail={`${orders.length} orders loaded on this page`}
              />
              <MetricCard
                icon="coin"
                label="Recent Revenue"
                value={loading ? "..." : currency.format(revenue)}
                detail="From currently loaded orders"
                tone="green"
              />
              <MetricCard
                icon="user"
                label="Pending Orders"
                value={loading ? "..." : pendingOrders}
                detail="Orders waiting for processing"
                tone="pink"
              />
            </section>

            <OrderManagement
              orders={orders}
              loading={loading}
              totalOrders={totalOrders}
            />
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse py-20 text-center text-muted">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            {user?.role === "admin" ? "Store orders" : "Your purchases"}
          </span>
          <h1 className="font-display text-4xl font-bold text-dark">
            Orders
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            {backLabel}
          </button>
          <Link to="/books" className="btn-outline">
            Browse books
          </Link>
        </div>
      </div>

      {location.state?.message && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {location.state.message}
        </div>
      )}

      {orderMessage && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {orderMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-10 text-center text-muted">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-lg border border-border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-dark">
                    Order #{order.id}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(order.created_at)}
                  </p>
                  {user?.role === "admin" && (
                    <p className="mt-1 text-sm text-muted">
                      {order.customer_name} - {order.customer_email}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClass(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                  <p className="mt-2 font-display text-2xl font-bold text-primary">
                    {currency.format(Number(order.total_amount || 0))}
                  </p>
                  {getOrderStatus(order) === "pending" ? (
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handlePayment(order.id)}
                        disabled={
                          paymentLoadingId === order.id ||
                          cancelLoadingId === order.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Icon name="coin" className="h-4 w-4" />
                        {paymentLoadingId === order.id
                          ? "Processing..."
                          : "Payment"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={
                          cancelLoadingId === order.id ||
                          paymentLoadingId === order.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Icon name="x" className="h-4 w-4" />
                        {cancelLoadingId === order.id
                          ? "Cancelling..."
                          : "Cancel"}
                      </button>
                    </div>
                  ) : (
                    <span className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-500">
                      {getOrderStatus(order) === "paid" ? "Paid" : "Closed"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-dark">{item.title}</p>
                      <p className="text-muted">by {item.author}</p>
                    </div>
                    <p className="font-semibold text-dark">
                      {item.quantity} x{" "}
                      {currency.format(Number(item.unit_price || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
