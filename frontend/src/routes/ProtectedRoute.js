import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Full-screen spinner shown while auth bootstraps ──────────────────────────
const AuthLoader = () => (
  <div className="min-h-screen bg-navy-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-navy-600 border-t-accent animate-spin" />
      <span className="text-slate-500 text-sm font-medium tracking-wide">Authenticating…</span>
    </div>
  </div>
);

// ── Base route guard ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Pending / blocked accounts
  if (user.isActive === false) {
    return <Navigate to="/blocked" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role — redirect to correct dashboard
    const dashboards = {
      borrower: "/sme/dashboard",
      investor: "/investor/dashboard",
      admin:    "/admin/dashboard",
    };
    return <Navigate to={dashboards[user.role] || "/"} replace />;
  }

  return children;
};

// ── Role-specific exports ────────────────────────────────────────────────────
export const BorrowerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["borrower"]}>{children}</ProtectedRoute>
);

// Keep SMERoute as alias so existing imports don't break
export const SMERoute = BorrowerRoute;

export const InvestorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["investor"]}>{children}</ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

// Any authenticated user
export const AuthRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["borrower", "investor", "admin"]}>{children}</ProtectedRoute>
);

// Public-only: redirect logged-in users away from /login, /register
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoader />;

  if (user) {
    const dashboards = {
      borrower: "/sme/dashboard",
      investor: "/investor/dashboard",
      admin:    "/admin/dashboard",
    };
    return <Navigate to={dashboards[user.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;