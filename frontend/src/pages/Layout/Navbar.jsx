import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  clearStoredAuth,
  getStoredUser,
  isAdminUser,
} from "../../utils/authStorage";

const navLinkClass =
  "px-4 py-2 rounded-xl text-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#243a5f]";

function getNavLinkClass({ isActive }) {
  return `${navLinkClass} ${
    isActive
      ? "bg-white/15 text-white"
      : "text-blue-100 hover:text-white hover:bg-white/10"
  }`;
}

function Icon({ name, className = "h-4 w-4" }) {
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
    admin: (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" />
        <circle cx="12" cy="10" r="3" />
        <path d="M8.5 17a4 4 0 0 1 7 0" />
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
    login: (
      <svg {...common}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="m10 17 5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    ),
    logout: (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    ),
    register: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function Avatar({ user, className = "h-10 w-10" }) {
  const isAdmin = isAdminUser(user);
  const picture = user?.profilePicture;
  const label = user?.name || (isAdmin ? "Admin User" : "User");

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-blue-50 text-primary`}
    >
      {picture ? (
        <img
          src={picture}
          alt={`${label} profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon name={isAdmin ? "admin" : "user"} className="h-5 w-5" />
      )}
    </span>
  );
}

function AuthMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={user ? "Open account menu" : "Open user menu"}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar user={user} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-3 w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-border bg-white py-2 shadow-2xl"
        >
          {user ? (
            <>
              <Link
                to="/profile"
                role="menuitem"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-dark transition hover:bg-blue-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icon name="user" className="h-5 w-5 shrink-0" />
                Profile
              </Link>
              {isAdminUser(user) && (
                <Link
                  to="/dashboard"
                  role="menuitem"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-dark transition hover:bg-blue-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Icon name="grid" className="h-5 w-5 shrink-0" />
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-dark transition hover:bg-blue-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icon name="logout" className="h-5 w-5 shrink-0" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                role="menuitem"
                onClick={closeMenu}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-blue-50 hover:text-primary"
              >
                <Icon name="login" />
                Login
              </Link>
              <Link
                to="/register"
                role="menuitem"
                onClick={closeMenu}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-blue-50 hover:text-primary"
              >
                <Icon name="register" />
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CartLink({ cartCount = 0, onClick, mobile = false }) {
  return (
    <NavLink
      to="/cart"
      onClick={onClick}
      className={({ isActive }) =>
        `${
          mobile
            ? "relative flex items-center justify-between rounded-xl px-4 py-3 text-lg font-semibold"
            : "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-lg font-semibold"
        } transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#243a5f] ${
          isActive
            ? "bg-white/15 text-white"
            : "text-blue-100 hover:text-white hover:bg-white/10"
        }`
      }
    >
      <span>{"\uD83D\uDED2"} Cart</span>
      {cartCount > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[#243a5f]">
          {cartCount}
        </span>
      )}
    </NavLink>
  );
}

export default function Navbar({ cartCount = 0 }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);

  const publicLinks = [
    ["Home", "/"],
    ["Books", "/books"],
    ["Authors", "/authors"],
    ["About", "/about"],
    ...(isAdminUser(user) ? [["Dashboard", "/dashboard"]] : []),
  ];

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const refreshUser = () => setUser(getStoredUser());

    window.addEventListener("stored-user-changed", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("stored-user-changed", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    closeMenu();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#243a5f] shadow-lg backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#243a5f]"
          >
            <img
              src="/image/book store.png"
              alt="BookStore logo"
              className="h-12 w-12 rounded-md object-contain"
            />
            <span className="font-display text-3xl font-bold text-white">
              BookStore
            </span>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            {publicLinks.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={getNavLinkClass}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <CartLink cartCount={cartCount} />
            <AuthMenu user={user} onLogout={logout} />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <AuthMenu user={user} onLogout={logout} />
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#19537b]"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 pb-4 pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              {publicLinks.map(([label, path]) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${getNavLinkClass({ isActive })} block text-left`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <CartLink cartCount={cartCount} onClick={closeMenu} mobile />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
