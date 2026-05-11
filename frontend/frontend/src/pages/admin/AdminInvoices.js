import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
const FBR_BADGE    = { unchecked:"badge-gray",  matched:"badge-green",  not_found:"badge-red" };
const CREDIT_BADGE = { Good:"badge-green", Average:"badge-yellow", Poor:"badge-red", "N/A":"badge-gray" };

export default function AdminInvoices() {
  const [invoices,     setInvoices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getInvoices({
        page, limit: LIMIT,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setInvoices(res.data.invoices || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load invoices."); }
    finally  { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.anchorCompany?.toLowerCase().includes(search.toLowerCase()) ||
    inv.smeId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Invoice Queue</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total invoices</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice, company, SME…"
            className="input-field max-w-xs text-sm py-2" />
          <div className="flex gap-2 flex-wrap">
            {["all","pending","verified","funded","rejected"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  statusFilter === s ? "bg-accent text-white" : "bg-navy-700 text-slate-400 hover:text-white"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    {["Invoice #","SME","Anchor Company","Amount","FBR","Credit","Status","Date","Action"].map(h => (
                      <th key={h} className="text-left py-3 px-2 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 px-2 text-accent font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="py-3 px-2 text-slate-300 text-xs max-w-[100px] truncate">{inv.smeId?.name || "—"}</td>
                      <td className="py-3 px-2 text-slate-300 max-w-[120px] truncate">{inv.anchorCompany}</td>
                      <td className="py-3 px-2 text-white font-semibold whitespace-nowrap">{fmt(inv.amountPkr)}</td>
                      <td className="py-3 px-2">
                        <span className={`badge text-[10px] ${FBR_BADGE[inv.fbrStatus] || "badge-gray"}`}>
                          {inv.fbrStatus === "matched" ? "✓ Match" : inv.fbrStatus === "not_found" ? "✗ Not Found" : "Unchecked"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge text-[10px] ${CREDIT_BADGE[inv.creditScore] || "badge-gray"}`}>{inv.creditScore}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge ${STATUS_BADGE[inv.status] || "badge-gray"}`}>{inv.status}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-xs whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        <Link to={`/admin/invoice/${inv._id}`} className="text-xs text-accent hover:underline whitespace-nowrap">Review →</Link>
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
