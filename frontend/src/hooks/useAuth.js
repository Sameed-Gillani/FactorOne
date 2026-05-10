import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * useAuth — centralised authentication hook.
 *
 * Returns:
 *   user         object | null  — decoded user from localStorage
 *   token        string | null  — JWT
 *   loading      bool           — true while verifying token with backend
 *   login(email, password)      — POSTs to /api/auth/login, stores token+user
 *   logout()                    — clears storage, redirects to /login
 *   isRole(role)  bool          — convenience role check
 */
export default function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (_) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email, password) => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        const { token: newToken, user: newUser } = data;
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);

        // Redirect to role portal
        const roleHome = {
          sme: "/sme/dashboard",
          investor: "/investor/dashboard",
          admin: "/admin/dashboard",
        };
        navigate(roleHome[newUser.role] || "/");
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const isRole = (role) => user?.role === role;

  return { user, token, loading, error, login, logout, isRole };
}
