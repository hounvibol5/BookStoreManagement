import { Link, NavLink, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import {
  clearStoredAuth,
  getStoredUser,
  setStoredUser,
} from "../../utils/authStorage";
import { updateProfile } from "../../services/api";

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
    camera: (
      <svg {...common}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
    book: (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      </svg>
    ),
    cart: (
      <svg {...common}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L21 8H6" />
      </svg>
    ),
    folder: (
      <svg {...common}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    ),
    logout: (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    ),
    reports: (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    ),
    team: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function ProfileAvatar({
  user,
  className = "h-28 w-28",
  iconClassName = "h-12 w-12",
  borderClassName = "border border-white",
}) {
  const picture = user?.profilePicture;

  return (
    <div
      className={`${className} ${borderClassName} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-primary shadow-md`}
    >
      {picture ? (
        <img
          src={picture}
          alt={`${user.name || "User"} profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon name="user" className={iconClassName} />
      )}
    </div>
  );
}

function AccountNavLink({ to, icon, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-5 px-5 py-4 text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isActive
            ? "bg-blue-50 text-primary"
            : "text-dark hover:bg-blue-50 hover:text-primary"
        }`
      }
    >
      {icon && <Icon name={icon} className="h-6 w-6" />}
      <span className="min-w-0 truncate">{children}</span>
    </NavLink>
  );
}

function AccountNavbar({ user, onLogout }) {
  return (
    <aside className="overflow-hidden rounded-lg bg-white shadow-sm lg:sticky lg:top-24 lg:self-start">
      <Link
        to="/profile"
        className="m-3 flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-3 shadow-sm transition hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ProfileAvatar
          user={user}
          className="h-11 w-11"
          iconClassName="h-5 w-5"
          borderClassName="border border-white"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-dark">
            {user.name || "User"}
          </p>
          <p className="truncate text-sm font-medium text-muted">
            {user.email || user.role || "Account"}
          </p>
        </div>
      </Link>

      <nav className="py-5">
        <AccountNavLink to="/profile" icon="user">
          Profile
        </AccountNavLink>

        <button
          type="button"
          onClick={onLogout}
          className="mt-10 flex w-full items-center gap-5 px-5 py-4 text-left text-base font-bold text-dark transition hover:bg-blue-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Icon name="logout" className="h-6 w-6" />
          Logout
        </button>
      </nav>
    </aside>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPicture, setSavingPicture] = useState(false);
  const fileInputRef = useRef(null);

  const saveUser = async (profile, successMessage) => {
    const res = await updateProfile(profile);
    const nextUser = {
      ...res.data,
      ...(res.data.profilePicture ? { profilePicture: res.data.profilePicture } : {}),
    };

    setStoredUser(nextUser);
    setUser(nextUser);
    setName(nextUser.name || "");
    setMessage(successMessage);
    setError("");
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();

    const nextName = name.trim();

    if (!user || !nextName) {
      return;
    }

    setSavingName(true);
    setMessage("");
    setError("");

    try {
      await saveUser({ name: nextName }, "Profile name updated.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile name");
    } finally {
      setSavingName(false);
    }
  };

  const handlePictureSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    const reader = new FileReader();

    reader.onload = async () => {
      setSavingPicture(true);
      setMessage("");
      setError("");

      try {
        await saveUser(
          { profilePicture: reader.result },
          "Profile picture updated.",
        );
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to update profile picture",
        );
      } finally {
        setSavingPicture(false);
        event.target.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    navigate("/");
  };

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-primary">
            <Icon name="user" className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold text-dark">
            Profile
          </h1>
          <p className="mt-3 text-muted">Sign in to manage your profile.</p>
          <Link to="/login" className="btn-primary mt-6 inline-flex">
            Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AccountNavbar user={user} onLogout={handleLogout} />

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProfileAvatar
            user={user}
            className="h-28 w-28"
            iconClassName="h-12 w-12"
            borderClassName="border-4 border-white"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Account Profile
            </p>
            <h1 className="mt-2 truncate font-display text-4xl font-bold text-dark">
              {user.name || "User"}
            </h1>
            <p className="mt-2 text-sm font-semibold capitalize text-muted">
              {user.role || "customer"}
            </p>
            {user.email && (
              <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_240px]">
          <form
            onSubmit={handleNameSubmit}
            className="rounded-lg border border-border bg-surface/60 p-5"
          >
            <label className="mb-2 block text-sm font-bold text-dark">
              Change Name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input"
                placeholder="Enter profile name"
              />
              <button
                type="submit"
                disabled={savingName}
                className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingName ? "Saving..." : "Save Name"}
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-border bg-surface/60 p-5">
            <p className="mb-2 text-sm font-bold text-dark">Change Picture</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePictureSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingPicture}
              className="btn-outline inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name="camera" />
              {savingPicture ? "Saving..." : "Change Picture"}
            </button>
          </div>
        </div>

            {error && (
              <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p className="mt-5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-primary">
                {message}
              </p>
            )}
        </div>
      </div>
    </section>
  );
}
