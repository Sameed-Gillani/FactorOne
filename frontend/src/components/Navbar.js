import React, { useState, useEffect, useRef } from "react";
import { Bell, LogOut, User, CheckCheck, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

/**
 * Navbar — top bar with page title, notification bell, and logout.
 *
 * Props:
 *   title            string   — current page heading
 *   user             object   — { fullName, email, role }
 *   notifications    array    — [{ _id, title, message, type, isRead, createdAt }]
 *   onMarkAllRead    fn       — callback to mark all notifications read
 *   onMarkRead       fn(id)   — callback to mark single notification read
 *   onLogout         fn       — override default logout
 *   accentColor      string   — brand accent (default #3b82f6)
 */
export default function Navbar({
  title = "Dashboard",
  user = {},
  notifications = [],
  onMarkAllRead,
  onMarkRead,
  onLogout,
  accentColor = "#3b82f6",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const handleMarkRead = (id) => {
    if (onMarkRead) onMarkRead(id);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeToStatus = (type) => {
    if (!type) return null;
    if (type.includes("activat")) return "active";
    if (type.includes("block")) return "blocked";
    if (type.includes("fund")) return "funded";
    if (type.includes("reject")) return "rejected";
    if (type.includes("approv")) return "approved";
    if (type.includes("repaid") || type.includes("repayment")) return "repaid";
    return null;
  };

  return (
    <header
      style={{
        height: "64px",
        background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* ── Page Title ── */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "700",
            color: "#f1f5f9",
            letterSpacing: "-0.3px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Right Controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* ─ Notification Bell ─ */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              position: "relative",
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: open ? "#1e293b" : "transparent",
              border: `1px solid ${open ? "#334155" : "transparent"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#94a3b8",
              transition: "all 0.15s ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1e293b";
              e.currentTarget.style.border = "1px solid #334155";
            }}
            onMouseLeave={(e) => {
              if (!open) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
              }
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: unreadCount > 9 ? "18px" : "16px",
                  height: "16px",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0f172a",
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* ─ Notification Dropdown ─ */}
          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "340px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "14px",
                boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "14px 16px 10px",
                  borderBottom: "1px solid #334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#f1f5f9",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: accentColor,
                        background: `${accentColor}18`,
                        padding: "1px 7px",
                        borderRadius: "10px",
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => { if (onMarkAllRead) onMarkAllRead(); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: accentColor,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: "#475569",
                      fontSize: "13px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <Bell
                      size={28}
                      style={{ marginBottom: "8px", color: "#334155" }}
                    />
                    <p style={{ margin: 0 }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const statusKey = typeToStatus(n.type);
                    return (
                      <div
                        key={n._id}
                        onClick={() => handleMarkRead(n._id)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #0f172a40",
                          cursor: "pointer",
                          background: n.isRead ? "transparent" : `${accentColor}08`,
                          display: "flex",
                          gap: "10px",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#334155";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = n.isRead
                            ? "transparent"
                            : `${accentColor}08`;
                        }}
                      >
                        {!n.isRead && (
                          <div
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: accentColor,
                              marginTop: "5px",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "8px",
                              marginBottom: "3px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: n.isRead ? "500" : "700",
                                color: n.isRead ? "#94a3b8" : "#e2e8f0",
                                fontFamily: "'DM Sans', sans-serif",
                                lineHeight: 1.3,
                              }}
                            >
                              {n.title}
                            </span>
                            {statusKey && (
                              <StatusBadge status={statusKey} size="sm" dot />
                            )}
                          </div>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: "12px",
                              color: "#64748b",
                              fontFamily: "'DM Sans', sans-serif",
                              lineHeight: 1.4,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {n.message}
                          </p>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#475569",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div
                  style={{
                    padding: "10px 16px",
                    borderTop: "1px solid #334155",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      fontSize: "12px",
                      color: accentColor,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    View all <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─ Divider ─ */}
        <div
          style={{
            width: "1px",
            height: "24px",
            background: "#1e293b",
            margin: "0 4px",
          }}
        />

        {/* ─ User Chip ─ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 10px 5px 5px",
            borderRadius: "10px",
            border: "1px solid transparent",
            cursor: "default",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}55)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : <User size={14} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e2e8f0",
                lineHeight: 1.2,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {user?.fullName || "User"}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {user?.role || "SME"}
            </span>
          </div>
        </div>

        {/* ─ Logout Button ─ */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748b",
            transition: "all 0.15s ease",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e215";
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.border = "1px solid #f8717130";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.border = "1px solid transparent";
          }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
