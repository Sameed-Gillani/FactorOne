import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { invoiceAPI } from "../../services/api";
import {
  Search, SlidersHorizontal, TrendingUp, Clock, Shield,
  RefreshCw, Building2, AlertCircle,
} from "lucide-react";

const SECTORS = ["All Sectors", "FMCG", "Energy", "Construction", "Textile", "Technology", "IT & Software", "Other"];
const DURATIONS = ["All Durations", "0-30", "30-60", "60-90", "90+"];

const fmt = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(val || 0);

const getDaysToMaturity = (dueDate) => {
  if (!dueDate) return "—";
  const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
};

const getDurationBucket = (dueDate) => {
  const days = getDaysToMaturity(dueDate);
  if (days === "—") return "90+";
  if (days <= 30) return "0-30";
  if (days <= 60) return "30-60";
  if (days <= 90) return "60-90";
  return "90+";
};

const nav = [
  { to: "/investor/dashboard", label: "Dashboard" },
  { to: "/investor/market", label: "Marketplace" },
  { to: "/investor/portfolio", label: "Portfolio" },
  { to: "/investor/wallet", label: "Wallet" },
];

function InvoiceCard({ invoice, onClick }) {
  const days = getDaysToMaturity(invoice.dueDate);
  const progress = invoice.fundingProgress || 0;
  const urgency = progress >= 80;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col"
      style={{ backgroundColor: "#1e293b" }}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-700/30">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight group-hover:text-blue-400 transition-colors">
                {invoice.title}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {invoice.createdBy?.firstName} {invoice.createdBy?.lastName}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
            <Shield className="w-2.5 h-2.5" /> Verified
          </span>
        </div>
        <span className="inline-block bg-slate-700/50 text-slate-400 text-[11px] font-medium px-2.5 py-0.5 rounded-lg capitalize">
          {invoice.status}
        </span>
      </div>

      {/* Stats */}
      <div className="p-5 grid grid-cols-2 gap-4 flex-1">
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Invoice Amount</p>
          <p className="text-white font-bold text-base">{fmt(invoice.amount)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Currency</p>
          <p className="text-blue-400 font-bold text-base">{invoice.currency || "PKR"}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Days to Maturity</p>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-white font-bold text-base">{days}d</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Due Date</p>
          <p className="text-white font-bold text-sm">
            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-PK") : "—"}
          </p>
        </div>
      </div>

      {/* Funding Progress */}
      <div className="px-5 pb-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-slate-400 text-xs font-medium">Funding Progress</p>
          <div className="flex items-center gap-1.5">
            {urgency && <span className="text-amber-400 text-[10px] font-bold">Almost Full</span>}
            <p className="text-white text-xs font-bold">{progress}%</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${urgency ? "bg-amber-400" : "bg-blue-500"}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#3b82f6" }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          View & Invest <TrendingUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All Sectors");
  const [duration, setDuration] = useState("All Durations");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await invoiceAPI.getAll({ status: "approved" });
        const data = res.data?.invoices || res.data?.data || res.data || [];
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load invoices. Please try again.");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = invoices
    .filter((inv) => {
      const matchSearch = !search ||
        inv.title?.toLowerCase().includes(search.toLowerCase()) ||
        inv.description?.toLowerCase().includes(search.toLowerCase());
      const matchDuration = duration === "All Durations" || getDurationBucket(inv.dueDate) === duration;
      return matchSearch && matchDuration;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "amount_desc") return (b.amount || 0) - (a.amount || 0);
      if (sortBy === "maturity") return getDaysToMaturity(a.dueDate) - getDaysToMaturity(b.dueDate);
      return 0;
    });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f172a" }}>
      {/* Navbar */}
      <nav className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#1e293b" }}>
        <span className="font-bold text-white text-lg">Factor<span className="text-blue-400">One</span></span>
        <div className="flex items-center gap-6">
          {nav.map((n) => (
            <button key={n.to} onClick={() => navigate(n.to)}
              className={`text-sm font-medium transition-colors ${window.location.pathname === n.to ? "text-blue-400" : "text-slate-400 hover:text-white"}`}>
              {n.label}
            </button>
          ))}
        </div>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition-colors">Logout</button>
      </nav>

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1">Investor Portal</p>
          <h1 className="text-3xl font-bold text-white mb-1">Invoice Marketplace</h1>
          <p className="text-slate-400 text-sm">Browse approved invoices available for investment</p>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-700/50 p-4 mb-6 flex flex-col md:flex-row gap-3" style={{ backgroundColor: "#1e293b" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all cursor-pointer">
              {DURATIONS.map((d) => <option key={d} value={d} className="bg-slate-800">{d === "All Durations" ? d : `${d} days`}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all cursor-pointer">
              <option value="newest" className="bg-slate-800">Newest First</option>
              <option value="amount_desc" className="bg-slate-800">Largest Amount</option>
              <option value="maturity" className="bg-slate-800">Soonest Maturity</option>
            </select>
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-400 text-sm">
            <span className="text-white font-semibold">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "opportunity" : "opportunities"} available
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading...
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-white font-semibold mb-1">No invoices available</p>
            <p className="text-slate-400 text-sm">Check back later or adjust your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((inv) => (
              <InvoiceCard
                key={inv._id}
                invoice={inv}
                onClick={() => navigate(`/investor/market/${inv._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}