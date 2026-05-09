import React, { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "";

const TYPE_CONFIG = {
  transaction: {
    label: "Transaction",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    dotColor: "bg-emerald-400",
  },
  system: {
    label: "System",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
      </svg>
    ),
    dotColor: "bg-blue-400",
  },
  approval: {
    label: "Approval",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    dotColor: "bg-amber-400",
  },
};

function getConfig(type) {
  return (
    TYPE_CONFIG[type] || {
      label: type || "General",
      bg: "bg-slate-700/50",
      text: "text-slate-300",
      border: "border-slate-600/50",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      dotColor: "bg-slate-400",
    }
  );
}

function TypeBadge({ type }) {
  const c = getConfig(type);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const FILTER_OPTIONS = ["all", "transaction", "system", "approval"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const fetchNotifications = useCallback(async (pageNum = 1, type = "all") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: pageNum, limit: PAGE_SIZE });
      if (type !== "all") params.set("type", type);
      const res = await fetch(`${API_BASE}/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      const list = data.notifications ?? data.data ?? data ?? [];
      setNotifications(list);
      setTotalPages(
        data.totalPages ?? Math.ceil((data.total ?? list.length) / PAGE_SIZE) ?? 1
      );
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page, filter);
  }, [fetchNotifications, page, filter]);

  async function markAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(notifId) {
    try {
      await fetch(`${API_BASE}/api/notifications/${notifId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notifId ? { ...n, isRead: true, read: true } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  function handleFilterChange(f) {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchNotifications(page, filter)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={markAllRead}
              disabled={markingAll || unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {markingAll ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Mark all read
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-[#1e293b] p-1 rounded-xl border border-slate-700/60">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
              }`}
            >
              {f === "all" ? "All" : TYPE_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-4 opacity-70 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 overflow-hidden">
          {loading ? (
            <Spinner />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">No notifications</p>
              <p className="text-slate-500 text-sm mt-1">
                {filter !== "all"
                  ? `No ${TYPE_CONFIG[filter]?.label || filter} notifications`
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/40">
              {notifications.map((notif, idx) => {
                const id = notif._id || notif.id;
                const isRead = notif.isRead || notif.read;
                const config = getConfig(notif.type);
                return (
                  <li
                    key={id || idx}
                    className={`group relative flex gap-4 px-5 py-4 transition-colors ${
                      !isRead
                        ? "bg-blue-500/5 hover:bg-blue-500/10"
                        : "hover:bg-slate-700/20"
                    }`}
                  >
                    {/* Unread dot */}
                    {!isRead && (
                      <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${config.dotColor} flex-shrink-0`} />
                    )}

                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.text} mt-0.5`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <TypeBadge type={notif.type} />
                            {!isRead && (
                              <span className="text-xs text-blue-400 font-semibold">New</span>
                            )}
                          </div>
                          {notif.title && (
                            <p className={`text-sm font-semibold leading-snug ${isRead ? "text-slate-300" : "text-white"}`}>
                              {notif.title}
                            </p>
                          )}
                          <p className={`text-sm leading-snug mt-0.5 ${isRead ? "text-slate-500" : "text-slate-300"}`}>
                            {notif.message || notif.body || notif.content || "No message"}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(notif.createdAt || notif.date)}
                          </p>
                          {!isRead && (
                            <button
                              onClick={() => markOneRead(id)}
                              className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-700/60 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
