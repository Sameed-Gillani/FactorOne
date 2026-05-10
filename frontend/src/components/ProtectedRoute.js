import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 * Wraps any route that requires authentication and optionally a specific role.
 *
 * Props:
 *   children     ReactNode   — the component to render if allowed
 *   allowedRoles string[]    — if provided, user.role must be in this array
 *   redirectTo   string      — where to redirect if not authenticated (default: /login)
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}) {
  const location = useLocation();

  // Retrieve token and user from localStorage
  const token = localStorage.getItem("token");
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    if (stored) user = JSON.parse(stored);
  } catch (_) {}

  // Not authenticated
  if (!token || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own portal instead of login
    const roleHome = {
      sme: "/sme/dashboard",
      investor: "/investor/dashboard",
      admin: "/admin/dashboard",
    };
    const fallback = roleHome[user.role] || redirectTo;
    return <Navigate to={fallback} replace />;
  }

  return children;
}
