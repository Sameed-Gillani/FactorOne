import React, { useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/ui/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import { notificationAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV_BY_ROLE = {
  sme: [
    { to: "/sme/dashboard", label: "Dashboard",    icon: "▦" },
    { to: "/sme/invoices",  label: "My Invoices",  icon: "🧾" },
    { to: "/wallet",        label: "Wallet",       icon: "💳" },
    { to: "/notifications", label: "Notifications",icon: "🔔" },
  ],
  investor: [
    { to: "/investor/dashboard", label: "Dashboard",    icon: "▦" },
    { to: "/investor/market",    label: "Marketplace",  icon: "🏪" },
    { to: "/investor/portfolio", label: "Portfolio",    icon: "📈" },
    { to: "/wallet",             label: "Wallet",       icon: "💳" },
    { to: "/notifications",      label: "Notifications",icon: "🔔" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: "▦" },
    { to: "/admin/invoices",  label: "Invoices",  icon: "🧾" },
    { to: "/admin/users",     label: "Users",     icon: "👥" },
    { to: "/notifications",   label: "Notifications", icon: "🔔" },
  ],
};

const TYPE_BADGE = {
  account_approved: "badge-green",
  account_blocked:  "badge-red",
  invoice_submitted:"badge-blue",
  invoice_approved: "badge-green",
  invoice_rejected: "badge-red",
  payment_received: "badge-green",
  wallet_credited:  "badge-green",
  wallet_debited:   "badge-yellow",
  bid_placed:       "badge-blue",
  system:           "badge-gray",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const nav = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.sme;

  const [notifications, setNotifications] = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ page, limit: LIMIT });
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread || 0);
      setTotal(res.data.total || 0);
    } catch { toast.error("Failed to load notifications."); }
    finally  { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await notificationAPI.markAllRead();
      setUnread(0);
      setNotifications(n => n.map(notif => ({ ...notif, isRead: true })));
      toast.success("All notifications marked as read.");
    } catch { toast.error("Failed to mark notifications."); }
    finally  { setMarking(false); }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(n => n.map(notif => notif._id === id ? { ...notif, isRead: true } : notif));
      setUnread(u => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  return (
    <DashboardShell navItems={nav}>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-white">Notifications</h1>
            <p className="text-slate-500 text-sm mt-1">
              {unread > 0 ? <span className="text-accent font-medium">{unread} unread</span> : "All caught up!"}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={handleMarkAllRead} disabled={marking} className="btn-secondary text-sm py-2">
              {marking ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-slate-400">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div key={notif._id}
                onClick={() => !notif.isRead && handleMarkOne(notif._id)}
                className={`card p-4 flex gap-4 transition-all cursor-pointer
                  ${!notif.isRead ? "border-accent/30 bg-accent/5 hover:bg-accent/10" : "hover:bg-navy-700/30"}`}>
                {/* Unread dot */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full mt-1 ${!notif.isRead ? "bg-accent" : "bg-transparent"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${!notif.isRead ? "text-white" : "text-slate-300"}`}>
                      {notif.title}
                    </p>
                    <span className={`badge flex-shrink-0 ${TYPE_BADGE[notif.type] || "badge-gray"}`}>
                      {notif.type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-slate-600 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > LIMIT && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
            <span className="text-slate-400 text-sm py-2 px-3">Page {page} of {Math.ceil(total / LIMIT)}</span>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
