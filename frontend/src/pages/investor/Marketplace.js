import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  RefreshCw,
  Building2,
  AlertCircle,
} from "lucide-react";

const MOCK_INVOICES = [
  {
    id: "inv-001",
    anchorCompany: "Nestlé Pakistan Ltd",
    sector: "FMCG",
    invoiceNumber: "NP-2024-4412",
    amount: 2500000,
    discountRate: 5.5,
    expectedReturn: 6.2,
    daysToMaturity: 45,
    duration: "30-60",
    fundingProgress: 68,
    totalFunding: 2500000,
    raisedSoFar: 1700000,
    rating: "AAA",
    verified: true,
  },
  {
    id: "inv-002",
    anchorCompany: "Engro Corporation",
    sector: "Energy",
    invoiceNumber: "EC-2024-2891",
    amount: 5000000,
    discountRate: 4.8,
    expectedReturn: 5.5,
    daysToMaturity: 30,
    duration: "0-30",
    fundingProgress: 42,
    totalFunding: 5000000,
    raisedSoFar: 2100000,
    rating: "AA+",
    verified: true,
  },
  {
    id: "inv-003",
    anchorCompany: "Lucky Cement",
    sector: "Construction",
    invoiceNumber: "LC-2024-1056",
    amount: 1800000,
    discountRate: 6.2,
    expectedReturn: 7.1,
    daysToMaturity: 60,
    duration: "60-90",
    fundingProgress: 85,
    totalFunding: 1800000,
    raisedSoFar: 1530000,
    rating: "AA",
    verified: true,
  },
  {
    id: "inv-004",
    anchorCompany: "PSO",
    sector: "Energy",
    invoiceNumber: "PSO-2024-7723",
    amount: 8000000,
    discountRate: 4.2,
    expectedReturn: 4.9,
    daysToMaturity: 25,
    duration: "0-30",
    fundingProgress: 30,
    totalFunding: 8000000,
    raisedSoFar: 2400000,
    rating: "AAA",
    verified: true,
  },
  {
    id: "inv-005",
    anchorCompany: "Unilever Pakistan",
    sector: "FMCG",
    invoiceNumber: "UL-2024-3344",
    amount: 3200000,
    discountRate: 5.1,
    expectedReturn: 5.9,
    daysToMaturity: 50,
    duration: "30-60",
    fundingProgress: 55,
    totalFunding: 3200000,
    raisedSoFar: 1760000,
    rating: "AAA",
    verified: true,
  },
  {
    id: "inv-006",
    anchorCompany: "Maple Leaf Cement",
    sector: "Construction",
    invoiceNumber: "ML-2024-0891",
    amount: 1200000,
    discountRate: 7.0,
    expectedReturn: 7.8,
    daysToMaturity: 75,
    duration: "60-90",
    fundingProgress: 20,
    totalFunding: 1200000,
    raisedSoFar: 240000,
    rating: "A+",
    verified: true,
  },
];

const SECTORS = ["All Sectors", "FMCG", "Energy", "Construction", "Textile", "Technology"];
const DURATIONS = ["All Durations", "0-30", "30-60", "60-90", "90+"];

const ratingColor = {
  "AAA": "text-emerald-400 bg-emerald-500/10",
  "AA+": "text-blue-400 bg-blue-500/10",
  "AA": "text-blue-400 bg-blue-500/10",
  "A+": "text-amber-400 bg-amber-500/10",
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

function InvoiceCard({ invoice, onClick }) {
  const remaining = invoice.totalFunding - invoice.raisedSoFar;
  const urgency = invoice.fundingProgress >= 80;

  return (
    <div
      className="rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col"
      style={{ backgroundColor: "#1e293b" }}
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-slate-700/30">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight group-hover:text-blue-400 transition-colors">
                {invoice.anchorCompany}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {invoice.verified && (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Shield className="w-2.5 h-2.5" /> Verified
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ratingColor[invoice.rating] || "text-slate-400 bg-slate-700"}`}>
              {invoice.rating}
            </span>
          </div>
        </div>
        <span className="inline-block bg-slate-700/50 text-slate-400 text-[11px] font-medium px-2.5 py-0.5 rounded-lg">
          {invoice.sector}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="p-5 grid grid-cols-2 gap-4 flex-1">
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Invoice Amount</p>
          <p className="text-white font-bold text-base">{formatCurrency(invoice.amount)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Discount Rate</p>
          <p className="text-blue-400 font-bold text-base">{invoice.discountRate}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Expected Return</p>
          <p className="text-emerald-400 font-bold text-base">{invoice.expectedReturn}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Days to Maturity</p>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-white font-bold text-base">{invoice.daysToMaturity}d</p>
          </div>
        </div>
      </div>

      {/* Funding Progress */}
      <div className="px-5 pb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-slate-400 text-xs font-medium">Funding Progress</p>
          <div className="flex items-center gap-1.5">
            {urgency && <span className="text-amber-400 text-[10px] font-bold">Almost Full</span>}
            <p className="text-white text-xs font-bold">{invoice.fundingProgress}%</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              urgency ? "bg-amber-400" : "bg-blue-500"
            }`}
            style={{ width: `${invoice.fundingProgress}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs">
          {formatCurrency(remaining)} remaining
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 group-hover:shadow-blue-500/20 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#3b82f6" }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Invest Now
          <TrendingUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sector, setSector] = useState("All Sectors");
  const [duration, setDuration] = useState("All Durations");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("return");

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (sector !== "All Sectors") params.append("sector", sector);
        if (duration !== "All Durations") params.append("duration", duration);

        const res = await fetch(`/api/invoices?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load invoices");
        const data = await res.json();
        setInvoices(data);
      } catch {
        // Fallback to mock data
        setInvoices(MOCK_INVOICES);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [sector, duration]);

  const filtered = invoices
    .filter((inv) => {
      const matchSearch =
        !search ||
        inv.anchorCompany.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const matchSector = sector === "All Sectors" || inv.sector === sector;
      const matchDuration = duration === "All Durations" || inv.duration === duration;
      return matchSearch && matchSector && matchDuration;
    })
    .sort((a, b) => {
      if (sortBy === "return") return b.expectedReturn - a.expectedReturn;
      if (sortBy === "amount") return b.amount - a.amount;
      if (sortBy === "maturity") return a.daysToMaturity - b.daysToMaturity;
      return 0;
    });

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "#0f172a" }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1">
          Investor Portal
        </p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
          Invoice Marketplace
        </h1>
        <p className="text-slate-400 text-sm">
          Discover verified invoices from top-rated anchor companies
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-2xl border border-slate-700/50 p-4 mb-6 flex flex-col md:flex-row gap-3"
        style={{ backgroundColor: "#1e293b" }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-slate-700/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />

          {/* Sector Filter */}
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all cursor-pointer"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s} className="bg-slate-800">
                {s}
              </option>
            ))}
          </select>

          {/* Duration Filter */}
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all cursor-pointer"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d} className="bg-slate-800">
                {d === "All Durations" ? d : `${d} days`}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all cursor-pointer"
          >
            <option value="return" className="bg-slate-800">Highest Return</option>
            <option value="amount" className="bg-slate-800">Largest Amount</option>
            <option value="maturity" className="bg-slate-800">Soonest Maturity</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-slate-400 text-sm">
          <span className="text-white font-semibold">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "opportunity" : "opportunities"} available
        </p>
        {loading && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-white font-semibold mb-1">No invoices found</p>
          <p className="text-slate-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onClick={() => navigate(`/investor/invoice/${inv.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
