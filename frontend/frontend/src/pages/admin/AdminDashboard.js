import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "../../components/ui/DashboardShell";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/admin/invoices",  label: "Invoices",  icon: "🧾" },
  { to: "/admin/users",     label: "Users",     icon: "👥" },
  { to: "/notifications",   label: "Notifications", icon: "🔔" },
];

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;
const STATUS_BADGE = { pending:"badge-yellow", verified:"badge-blue", funded:"badge-green", rejected:"badge-red" };

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(()  => toast.error("Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardShell navItems={NAV}>
      <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
    </DashboardShell>
  );

  const s = stats || {};

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Platform overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-accent/40">
            <p className="text-slate-400 text-xs mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{s.users?.total || 0}</p>
            <p className="text-xs text-slate-500 mt-1">{s.users?.sme || 0} SME · {s.users?.investor || 0} Investors</p>
          </div>
          <div className="card p-5 border-l-4 border-yellow-500/40">
            <p className="text-slate-400 text-xs mb-1">Pending Invoices</p>
            <p className="text-2xl font-bold text-white">{s.invoices?.pending?.count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
          </div>
          <div className="card p-5 border-l-4 border-emerald-500/40">
            <p className="text-slate-400 text-xs mb-1">Total Invoices</p>
            <p className="text-2xl font-bold text-white">{s.invoices?.total || 0}</p>
            <p className="text-xs text-slate-500 mt-1">{s.invoices?.funded?.count || 0} funded</p>
          </div>
          <div className="card p-5 border-l-4 border-purple-500/40">
            <p className="text-slate-400 text-xs mb-1">Investment Volume</p>
            <p className="text-xl font-bold text-white">{fmt(s.investments?.totalVolume)}</p>
            <p className="text-xs text-slate-500 mt-1">{s.investments?.count || 0} investments</p>
          </div>
        </div>

        {/* Invoice submissions chart */}
        {s.invoiceChart?.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Submissions (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={s.invoiceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={d => d ? new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" }) : ""} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={d => new Date(d).toLocaleDateString()}
                  formatter={(v) => [v, "Submissions"]}
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently registered users */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Recent Users</h2>
              <Link to="/admin/users" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
            {(s.recentUsers || []).length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No recent users.</p>
            ) : (
              <div className="space-y-2">
                {(s.recentUsers || []).map(u => (
                  <div key={u._id} className="flex items-center justify-between py-2 border-b border-navy-700/50">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-[10px] ${u.role === "sme" ? "badge-blue" : u.role === "investor" ? "badge-green" : "badge-gray"}`}>{u.role}</span>
                      <span className={`badge text-[10px] ${u.status === "active" ? "badge-green" : u.status === "pending" ? "badge-yellow" : "badge-red"}`}>{u.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice status summary */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Invoice Summary</h2>
              <Link to="/admin/invoices" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {["pending","verified","funded","rejected"].map(status => {
                const data = s.invoices?.[status] || { count: 0, totalAmount: 0 };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_BADGE[status]}`}>{status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{data.count} invoices</p>
                      <p className="text-xs text-slate-500">{fmt(data.totalAmount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
