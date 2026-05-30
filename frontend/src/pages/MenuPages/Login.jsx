// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/api";
import { isAdminUser, setStoredAuth } from "../../utils/authStorage";

function getLoginError(err) {
  const serverError = err.response?.data?.error;

  if (serverError) {
    return serverError;
  }

  if (!err.response || err.response.status >= 500) {
    return "Cannot reach the API server. Start the PHP backend on http://localhost:8000 and try again.";
  }

  return "Login failed";
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(form);
      setStoredAuth(res.data.token, res.data.user);
      navigate(isAdminUser(res.data.user) ? "/dashboard" : "/");
    } catch (err) {
      setError(getLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h2 className="mb-2 font-display text-3xl font-bold text-dark">
          Welcome back
        </h2>
        <p className="mb-8 text-sm text-muted">Sign in to your account</p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
              className="input"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full py-3 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
