import React, { useEffect, useState, useCallback } from "react";
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

export default function AdminUsers() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState(null);
  const [roleFilter,  setRoleFilter]  = useState("all");
  const [statusFilter,setStatusFilter]= useState("all");
  const [search,      setSearch]      = useState("");
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        page, limit: LIMIT,
        role:   roleFilter   === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setUsers(res.data.users || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load users."); }
    finally  { setLoading(false); }
  }, [page, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (id) => {
    setActionId(id);
    try {
      await adminAPI.activateUser(id);
      toast.success("User activated.");
      load();
    } catch { toast.error("Action failed."); }
    finally  { setActionId(null); }
  };

  const handleBlock = async (id) => {
    if (!window.confirm("Block this user?")) return;
    setActionId(id);
    try {
      await adminAPI.blockUser(id);
      toast.success("User blocked.");
      load();
    } catch { toast.error("Action failed."); }
    finally  { setActionId(null); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge   = { sme:"badge-blue", investor:"badge-green", admin:"badge-gray" };
  const statusBadge = { active:"badge-green", pending:"badge-yellow", blocked:"badge-red" };

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="input-field max-w-xs text-sm py-2" />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field w-32 text-sm py-2 appearance-none">
            <option value="all">All Roles</option>
            <option value="sme">SME</option>
            <option value="investor">Investor</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-36 text-sm py-2 appearance-none">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="card p-6">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    {["Name","Email","Role","Status","Wallet Balance","Joined","Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 px-3">
                        <p className="text-slate-200 font-medium text-sm">{u.name}</p>
                        {u.businessName && <p className="text-xs text-slate-500">{u.businessName}</p>}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${roleBadge[u.role] || "badge-gray"}`}>{u.role}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`badge ${statusBadge[u.status] || "badge-gray"}`}>{u.status}</span>
                      </td>
                      <td className="py-3 px-3 text-white font-semibold text-sm">{fmt(u.wallet?.balance)}</td>
                      <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        {u.role !== "admin" && (
                          <div className="flex gap-2">
                            {u.status !== "active" && (
                              <button
                                onClick={() => handleActivate(u._id)}
                                disabled={actionId === u._id}
                                className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
                                {actionId === u._id ? "…" : "Activate"}
                              </button>
                            )}
                            {u.status !== "blocked" && (
                              <button
                                onClick={() => handleBlock(u._id)}
                                disabled={actionId === u._id}
                                className="px-2.5 py-1 text-xs rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50">
                                {actionId === u._id ? "…" : "Block"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
