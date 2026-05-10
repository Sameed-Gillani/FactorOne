import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("fo_token"));
  const [loading, setLoading] = useState(true); // true on first mount while checking token

  // ── Persist token ───────────────────────────────────────────
  const saveToken = (t) => {
    localStorage.setItem("fo_token", t);
    setToken(t);
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem("fo_token");
    localStorage.removeItem("fo_user");
    setToken(null);
    setUser(null);
  }, []);

  // ── Auto-fetch user on mount if token exists ────────────────
  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem("fo_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch {
        // Token invalid/expired
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [clearAuth]);

  // ── Login ───────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: t, user: u } = res.data;
    saveToken(t);
    setUser(u);
    return u; // caller uses role for redirect
  };

  // ── Register ────────────────────────────────────────────────
  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token: t, user: u } = res.data;
    saveToken(t);
    setUser(u);
    return u;
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = () => {
    clearAuth();
    toast.success("Logged out successfully.");
  };

  // ── Refresh user (call after profile updates) ────────────────
  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data.user);
    } catch {
      clearAuth();
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
