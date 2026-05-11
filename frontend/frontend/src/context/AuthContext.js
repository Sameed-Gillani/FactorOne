import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("fo_token"));
  const [loading, setLoading] = useState(true);

  const saveToken = (t) => { localStorage.setItem("fo_token", t); setToken(t); };

  const clearAuth = useCallback(() => {
    localStorage.removeItem("fo_token");
    localStorage.removeItem("fo_user");
    setToken(null);
    setUser(null);
  }, []);

  // Bootstrap — verify stored token on mount
  useEffect(() => {
    const bootstrap = async () => {
      const stored = localStorage.getItem("fo_token");
      if (!stored) { setLoading(false); return; }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [clearAuth]);

  // ── LOGIN — always clear previous session first ───────────
  const login = async (email, password) => {
    // Clear old session so role redirect is always fresh
    clearAuth();
    const res = await authAPI.login({ email, password });
    const { token: t, user: u } = res.data;
    saveToken(t);
    setUser(u);
    return u;
  };

  const register = async (formData) => {
    clearAuth();
    const res = await authAPI.register(formData);
    const { token: t, user: u } = res.data;
    saveToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearAuth();
    toast.success("Logged out successfully.");
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data.user);
    } catch { clearAuth(); }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export default AuthContext;
