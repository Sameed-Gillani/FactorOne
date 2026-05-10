import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PAGE_TITLES = {
  "/sme/dashboard": "Dashboard",
  "/sme/submit-invoice": "Submit Invoice",
  "/sme/invoices": "My Invoices",
  "/sme/wallet": "Wallet",
};

export default function SMELayout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Resolve page title — handle dynamic routes like /sme/invoices/:id
  const getTitle = () => {
    const exact = PAGE_TITLES[location.pathname];
    if (exact) return exact;
    if (/^\/sme\/invoices\/.+/.test(location.pathname)) return "Invoice Detail";
    return "SME Portal";
  };

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (_) {}
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data || data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0f172a",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Sidebar ── */}
      <Sidebar
        role="sme"
        user={user}
        onLogout={handleLogout}
      />

      {/* ── Main content area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Navbar ── */}
        <Navbar
          title={getTitle()}
          user={user}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onLogout={handleLogout}
          accentColor="#3b82f6"
        />

        {/* ── Page content ── */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#0f172a",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
