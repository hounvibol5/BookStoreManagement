import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboardNav } from "../../../../services/api";

const dashboardLinks = [
  ["Overview", "/dashboard/overview", "grid"],
  ["Books", "/dashboard/books", "book"],
  ["Orders", "/dashboard/orders", "cart"],
  ["Customers", "/dashboard/customers", "user"],
  ["Inventory", "/dashboard/inventory", "box"],
  ["Reports", "/dashboard/reports", "check"],
];

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
    check: (
      <svg {...common}>
        <path d="m20 6-11 11-5-5" />
      </svg>
    ),
    grid: (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return icons[name] || icons.grid;
}

function SidebarLink({ label, to, icon, active = false, count = null }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
        active
          ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-900/20"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== null && (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
            active ? "bg-white/20 text-white" : "bg-white/10 text-slate-300"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function isDashboardLinkActive(location, label, to) {
  const [path, hash = ""] = to.split("#");

  if (label === "Overview") {
    return location.pathname === "/dashboard" || location.pathname === to;
  }

  if (hash) {
    return location.pathname === path && location.hash === `#${hash}`;
  }

  return location.pathname === to;
}

function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="h-1.5 rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function getLinkCount(label, counts) {
  const map = {
    Books: "books",
    Orders: "orders",
    Customers: "customers",
    Inventory: "inventory",
    Reports: "reports",
  };
  const key = map[label];

  return key ? Number(counts?.[key] ?? 0) : null;
}

export default function NavbarDashboard({ catalogHealth = 0 }) {
  const location = useLocation();
  const [navStats, setNavStats] = useState({
    catalogHealth,
    counts: {},
  });
  const healthValue = navStats.catalogHealth ?? catalogHealth;

  useEffect(() => {
    let active = true;

    getDashboardNav()
      .then((res) => {
        if (active) {
          setNavStats({
            catalogHealth: Number(res.data?.catalogHealth ?? catalogHealth),
            counts: res.data?.counts || {},
          });
        }
      })
      .catch(() => {
        if (active) {
          setNavStats((current) => ({
            ...current,
            catalogHealth,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [catalogHealth]);

  return (
    <aside className="rounded-lg bg-gradient-to-b from-zinc-900 to-slate-900 p-4 text-white shadow-2xl shadow-slate-300 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
      <Link to="/" className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10">
          <Icon name="book" />
        </span>
        <span className="text-sm font-extrabold">BookStore Manager</span>
      </Link>

      <nav className="mt-5 space-y-2">
        {dashboardLinks.map(([label, to, icon]) => (
          <SidebarLink
            key={to}
            label={label}
            to={to}
            icon={icon}
            active={isDashboardLinkActive(location, label, to)}
            count={getLinkCount(label, navStats.counts)}
          />
        ))}
      </nav>

      <div className="mt-8 rounded-lg bg-white/10 p-4">
        <p className="text-xs font-bold uppercase text-slate-400">
          Catalog Health
        </p>
        <p className="mt-2 text-3xl font-extrabold">{healthValue}%</p>
        <ProgressBar value={healthValue} />
      </div>
    </aside>
  );
}
