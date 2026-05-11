import React, { useEffect, useState } from "react";
import DashboardShell from "../../components/ui/DashboardShell";
import { investmentAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/investor/dashboard", label: "Dashboard",    icon: "▦" },
  { to: "/investor/market",    label: "Marketplace",  icon: "🏪" },
  { to: "/investor/portfolio", label: "Portfolio",    icon: "📈" },
  { to: "/investor/wallet",    label: "Wallet",       icon: "💳" },
  { to: "/notifications",      label: "Notifications",icon: "🔔" },
];

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

export default function InvestorPortfolio() {
  const [investments, setInvestments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await investmentAPI.getMy({
          page, limit: LIMIT,
          status: statusFilter === "all" ? undefined : statusFilter,
        });
        setInvestments(res.data.investments || []);
        setTotal(res.data.pagination?.total || 0);
      } catch { toast.error("Failed to load portfolio."); }
      finally  { setLoading(false); }
    };
    load();
  }, [page, statusFilter]);

  const summary = investments.reduce(
    (acc, inv) => {
      acc.totalInvested += inv.amount;
      acc.totalExpected += inv.expectedReturn;
      if (inv.status === "active")  acc.active++;
      if (inv.status === "matured") acc.matured++;
      return acc;
    },
    { totalInvested: 0, totalExpected: 0, active: 0, matured: 0 }
  );

  const statusBadge = (s) => {
    if (s === "active")    return "badge-green";
    if (s === "matured")   return "badge-blue";
    if (s === "cancelled") return "badge-red";
    return "badge-gray";
  };

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">My Portfolio</h1>
          <p className="text-slate-500 text-sm mt-1">Track all your investments</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Total Invested",    fmt(summary.totalInvested), "blue"],
            ["Expected Returns",  fmt(summary.totalExpected), "green"],
            ["Active",            summary.active,             "green"],
            ["Matured",           summary.matured,            "blue"],
          ].map(([label, value, color]) => (
            <div key={label} className={`card p-5 border-l-4 ${color === "green" ? "border-emerald-500/30" : "border-accent/30"}`}>
              <p className="text-slate-400 text-xs mb-1">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {["all","active","matured","cancelled"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s ? "bg-accent text-white" : "bg-navy-700 text-slate-400 hover:text-white"
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card p-6">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
          ) : investments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-slate-400">No investments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    {["Invoice #","Anchor Company","Amount","Expected Return","Maturity Date","Status"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => (
                    <tr key={inv._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 px-3 text-slate-300 font-mono text-xs">{inv.invoiceSnapshot?.invoiceNumber || "—"}</td>
                      <td className="py-3 px-3 text-slate-300">{inv.invoiceSnapshot?.anchorCompany || "—"}</td>
                      <td className="py-3 px-3 text-white font-semibold">{fmt(inv.amount)}</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">+{fmt(inv.expectedReturn)}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(inv.maturityDate).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${statusBadge(inv.status)}`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
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
