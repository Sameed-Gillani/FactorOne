import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../../components/ui/DashboardShell";
import { invoiceAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/sme/dashboard", label: "Dashboard",    icon: "▦" },
  { to: "/sme/submit",    label: "Submit Invoice",icon: "➕" },
  { to: "/sme/invoices",  label: "My Invoices",  icon: "🧾" },
  { to: "/wallet",        label: "Wallet",       icon: "💳" },
  { to: "/notifications", label: "Notifications",icon: "🔔" },
];

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;
const STATUS_BADGE = { pending:"badge-yellow", verified:"badge-blue", funded:"badge-green", rejected:"badge-red" };

export default function SMEInvoices() {
  const [invoices,     setInvoices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceAPI.getMy({
        page, limit: LIMIT,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setInvoices(res.data.invoices || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load invoices."); }
    finally  { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-white">My Invoices</h1>
            <p className="text-slate-500 text-sm mt-1">{total} total invoices</p>
          </div>
          <Link to="/sme/submit" className="btn-primary">➕ Submit New</Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {["all","pending","verified","funded","rejected"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                statusFilter === s ? "bg-accent text-white" : "bg-navy-700 text-slate-400 hover:text-white"
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="card p-6">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-slate-400 mb-4">No invoices found.</p>
              <Link to="/sme/submit" className="btn-primary">Submit Your First Invoice</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    {["Invoice #","Anchor Company","Amount","FBR","Credit","Status","Date","Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 px-3 text-accent font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-300 max-w-[140px] truncate">{inv.anchorCompany}</td>
                      <td className="py-3 px-3 text-white font-semibold whitespace-nowrap">{fmt(inv.amountPkr)}</td>
                      <td className="py-3 px-3">
                        <span className={`badge text-[10px] ${inv.fbrStatus === "matched" ? "badge-green" : inv.fbrStatus === "not_found" ? "badge-red" : "badge-gray"}`}>
                          {inv.fbrStatus === "matched" ? "✓" : inv.fbrStatus === "not_found" ? "✗" : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`badge text-[10px] ${inv.creditScore === "Good" ? "badge-green" : inv.creditScore === "Average" ? "badge-yellow" : inv.creditScore === "Poor" ? "badge-red" : "badge-gray"}`}>
                          {inv.creditScore}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`badge ${STATUS_BADGE[inv.status] || "badge-gray"}`}>{inv.status}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <Link to={`/sme/invoice/${inv._id}`} className="text-xs text-accent hover:underline whitespace-nowrap">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Funding progress for verified invoices */}
          {invoices.filter(i => i.status === "verified" && i.amountPkr > 0).map(inv => (
            <div key={`prog-${inv._id}`} className="mt-3 p-3 bg-navy-900 rounded-lg border border-navy-600">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>{inv.invoiceNumber} — Funding Progress</span>
                <span>{Math.round((inv.fundedAmount / inv.amountPkr) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${(inv.fundedAmount / inv.amountPkr) * 100}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{fmt(inv.fundedAmount)} / {fmt(inv.amountPkr)}</p>
            </div>
          ))}
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
