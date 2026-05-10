import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  FileText,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  Calendar,
  Building2,
} from "lucide-react";

// ── Mock fallback data ──────────────────────────────────────────────────────
const MOCK_INVOICES = [
  { id: "inv-001", number: "NP-2024-4412", smeName: "PakFresh Distributors",  smeId: "U-014", anchor: "Nestlé Pakistan Ltd",  amount: 2500000, status: "Pending",  date: "2024-02-26", sector: "FMCG"         },
  { id: "inv-002", number: "EC-2024-2891", smeName: "AlphaGrid Energy",        smeId: "U-023", anchor: "Engro Corporation",      amount: 5000000, status: "Approved", date: "2024-02-25", sector: "Energy"       },
  { id: "inv-003", number: "LC-2024-1056", smeName: "BuildMart Solutions",     smeId: "U-009", anchor: "Lucky Cement",           amount: 1800000, status: "Pending",  date: "2024-02-25", sector: "Construction" },
  { id: "inv-004", number: "PSO-2024-7723",smeName: "FuelLink Pakistan",       smeId: "U-031", anchor: "PSO",                   amount: 8000000, status: "Rejected", date: "2024-02-24", sector: "Energy"       },
  { id: "inv-005", number: "UL-2024-3344", smeName: "Sunrise Traders",         smeId: "U-007", anchor: "Unilever Pakistan",     amount: 3200000, status: "Approved", date: "2024-02-24", sector: "FMCG"         },
  { id: "inv-006", number: "ML-2024-0891", smeName: "CementPro Suppliers",     smeId: "U-019", anchor: "Maple Leaf Cement",     amount: 1200000, status: "Pending",  date: "2024-02-23", sector: "Construction" },
  { id: "inv-007", number: "KE-2024-0112", smeName: "PowerGrid Associates",    smeId: "U-042", anchor: "K-Electric",            amount: 4500000, status: "Approved", date: "2024-02-22", sector: "Energy"       },
  { id: "inv-008", number: "FFC-2024-333", smeName: "AgriSupply Chain",        smeId: "U-011", anchor: "Fauji Fertilizer",      amount: 900000,  status: "Pending",  date: "2024-02-22", sector: "Agriculture"  },
  { id: "inv-009", number: "HBL-2024-201", smeName: "FinancePro Pvt Ltd",      smeId: "U-056", anchor: "HBL Microfinance",      amount: 650000,  status: "Rejected", date: "2024-02-21", sector: "Finance"      },
  { id: "inv-010", number: "DG-2024-5544", smeName: "PharmaDirect Ltd",        smeId: "U-028", anchor: "DG Group",              amount: 2100000, status: "Pending",  date: "2024-02-20", sector: "Healthcare"   },
  { id: "inv-011", number: "TRG-2024-099", smeName: "TechBridge Consulting",   smeId: "U-033", anchor: "TRG Pakistan",          amount: 780000,  status: "Approved", date: "2024-02-19", sector: "Technology"   },
  { id: "inv-012", number: "AGP-2024-441", smeName: "MedEquip Traders",        smeId: "U-017", anchor: "AGP Limited",           amount: 3400000, status: "Pending",  date: "2024-02-18", sector: "Healthcare"   },
];
// ────────────────────────────────────────────────────────────────────────────

const STATUS_LIST = ["All", "Pending", "Approved", "Rejected"];

const STATUS_CFG = {
  Pending:  { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400",  border: "border-amber-500/20"  },
  Approved: { bg: "bg-emerald-500/10",text: "text-emerald-400",dot: "bg-emerald-400",border: "border-emerald-500/20" },
  Rejected: { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400",    border: "border-red-500/20"    },
};

const fmt = (v) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

function SortBtn({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col;
  return (
    <button onClick={() => onSort(col)} className="flex items-center gap-1 hover:text-slate-200 transition-colors group">
      <span>{col}</span>
      <span className="flex flex-col">
        <ChevronUp   className={`w-2.5 h-2.5 ${active && sortDir === "asc"  ? "text-blue-400" : "text-slate-700 group-hover:text-slate-500"}`} />
        <ChevronDown className={`w-2.5 h-2.5 ${active && sortDir === "desc" ? "text-blue-400" : "text-slate-700 group-hover:text-slate-500"} -mt-0.5`} />
      </span>
    </button>
  );
}

export default function InvoiceQueue() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const fetchInvoices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (status !== "All") params.append("status", status);
      const res = await fetch(`/api/admin/invoices?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : data.invoices ?? MOCK_INVOICES);
    } catch {
      setInvoices(MOCK_INVOICES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => { fetchInvoices(); setPage(1); }, [fetchInvoices]);

  const handleSort = (col) => {
    const KEY_MAP = { "Invoice #": "number", SME: "smeName", Anchor: "anchor", Amount: "amount", Status: "status", Date: "date" };
    const key = KEY_MAP[col] ?? col;
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = invoices
    .filter(inv => {
      const matchSearch = !search ||
        inv.smeName.toLowerCase().includes(search.toLowerCase()) ||
        inv.anchor.toLowerCase().includes(search.toLowerCase()) ||
        inv.number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "All" || inv.status === status;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = invoices.filter(i => i.status === "Pending").length;
  const approvedCount = invoices.filter(i => i.status === "Approved").length;
  const rejectedCount = invoices.filter(i => i.status === "Rejected").length;

  const COLS = ["Invoice #", "SME Name", "Anchor Company", "Amount", "Status", "Date", ""];

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "#0f172a" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1">Admin Portal</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Invoice Queue</h1>
          <p className="text-slate-400 text-sm mt-1">Review and manage all submitted invoices</p>
        </div>
        <button
          onClick={() => fetchInvoices(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/40 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending Review", count: pendingCount,  cfg: STATUS_CFG.Pending  },
          { label: "Approved",       count: approvedCount, cfg: STATUS_CFG.Approved },
          { label: "Rejected",       count: rejectedCount, cfg: STATUS_CFG.Rejected },
        ].map(({ label, count, cfg }) => (
          <div key={label} className="rounded-2xl border border-slate-700/50 p-4 flex items-center gap-4" style={{ backgroundColor: "#1e293b" }}>
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
            </div>
            <div>
              <p className="text-slate-500 text-xs">{label}</p>
              <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-700/50 p-4 mb-5 flex flex-col sm:flex-row gap-3" style={{ backgroundColor: "#1e293b" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by invoice #, SME, or anchor..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {STATUS_LIST.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                status === s
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-500 text-sm">
          <span className="text-white font-semibold">{filtered.length}</span> invoice{filtered.length !== 1 ? "s" : ""}
        </p>
        {refreshing && <div className="flex items-center gap-2 text-blue-400 text-sm"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Updating...</div>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-blue-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 p-14 text-center" style={{ backgroundColor: "#1e293b" }}>
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-semibold">No invoices found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    {COLS.map(col => (
                      <th key={col} className="text-left px-5 py-3.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                        {col && col !== "" ? (
                          <SortBtn col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((inv, idx) => {
                    const sc = STATUS_CFG[inv.status] ?? STATUS_CFG.Pending;
                    return (
                      <tr
                        key={inv.id}
                        className={`border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors group ${idx === paginated.length - 1 ? "border-b-0" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <p className="text-blue-400 text-sm font-semibold group-hover:text-blue-300">{inv.number}</p>
                          <p className="text-slate-600 text-xs mt-0.5">{inv.sector}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{inv.smeName}</p>
                              <p className="text-slate-600 text-xs">{inv.smeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300 text-sm">{inv.anchor}</td>
                        <td className="px-5 py-4 text-white text-sm font-bold">{fmt(inv.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-slate-400 text-sm">{inv.date}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/20 hover:border-blue-500/40 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-slate-700/30 flex items-center justify-between">
                <p className="text-slate-500 text-xs">
                  Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page - 2 + i;
                    if (pg > totalPages) return null;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${pg === page ? "bg-blue-500 text-white" : "bg-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700"}`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
