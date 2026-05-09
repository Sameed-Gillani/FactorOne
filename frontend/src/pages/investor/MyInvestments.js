import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Search,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

const MOCK_INVESTMENTS = [
  {
    id: "INV-001",
    invoiceNumber: "NP-2024-4412",
    anchorCompany: "Nestlé Pakistan Ltd",
    sector: "FMCG",
    amount: 500000,
    expectedReturn: 531500,
    actualReturn: null,
    maturityDate: "2024-03-28",
    investedDate: "2024-02-12",
    daysToMaturity: 18,
    discountRate: 5.5,
    yieldRate: 6.2,
    status: "Active",
  },
  {
    id: "INV-002",
    invoiceNumber: "EC-2024-2891",
    anchorCompany: "Engro Corporation",
    sector: "Energy",
    amount: 750000,
    expectedReturn: 792225,
    actualReturn: null,
    maturityDate: "2024-04-05",
    investedDate: "2024-02-20",
    daysToMaturity: 26,
    discountRate: 4.8,
    yieldRate: 5.5,
    status: "Active",
  },
  {
    id: "INV-003",
    invoiceNumber: "LC-2024-1056",
    anchorCompany: "Lucky Cement",
    sector: "Construction",
    amount: 300000,
    expectedReturn: 318090,
    actualReturn: null,
    maturityDate: "2024-03-18",
    investedDate: "2024-02-05",
    daysToMaturity: 8,
    discountRate: 6.2,
    yieldRate: 7.1,
    status: "Maturing Soon",
  },
  {
    id: "INV-004",
    invoiceNumber: "PSO-2024-7723",
    anchorCompany: "PSO",
    sector: "Energy",
    amount: 1200000,
    expectedReturn: 1261800,
    actualReturn: 1261800,
    maturityDate: "2024-02-28",
    investedDate: "2024-01-14",
    daysToMaturity: 0,
    discountRate: 4.2,
    yieldRate: 4.9,
    status: "Completed",
  },
  {
    id: "INV-005",
    invoiceNumber: "UL-2024-3344",
    anchorCompany: "Unilever Pakistan",
    sector: "FMCG",
    amount: 450000,
    expectedReturn: 473715,
    actualReturn: 473715,
    maturityDate: "2024-02-20",
    investedDate: "2024-01-08",
    daysToMaturity: 0,
    discountRate: 5.1,
    yieldRate: 5.9,
    status: "Completed",
  },
  {
    id: "INV-006",
    invoiceNumber: "ML-2024-0891",
    anchorCompany: "Maple Leaf Cement",
    sector: "Construction",
    amount: 200000,
    expectedReturn: 214600,
    actualReturn: null,
    maturityDate: "2024-04-15",
    investedDate: "2024-02-22",
    daysToMaturity: 36,
    discountRate: 7.0,
    yieldRate: 7.8,
    status: "Active",
  },
  {
    id: "INV-007",
    invoiceNumber: "KE-2024-0112",
    anchorCompany: "K-Electric",
    sector: "Energy",
    amount: 600000,
    expectedReturn: 629700,
    actualReturn: 629700,
    maturityDate: "2024-02-10",
    investedDate: "2023-12-18",
    daysToMaturity: 0,
    discountRate: 4.5,
    yieldRate: 5.2,
    status: "Completed",
  },
];

const statusConfig = {
  Active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
  },
  "Maturing Soon": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-500/20",
  },
  Completed: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    dot: "bg-slate-500",
    border: "border-slate-500/20",
  },
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const STATUSES = ["All", "Active", "Maturing Soon", "Completed"];

export default function MyInvestments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("investedDate");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const res = await fetch("/api/investments");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setInvestments(data);
      } catch {
        setInvestments(MOCK_INVESTMENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestments();
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-slate-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-400" />
    );
  };

  const filtered = investments
    .filter((inv) => {
      const matchSearch =
        !search ||
        inv.anchorCompany.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  // Summary Stats
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalExpected = investments.reduce((s, i) => s + i.expectedReturn, 0);
  const totalReturned = investments
    .filter((i) => i.actualReturn)
    .reduce((s, i) => s + (i.actualReturn || 0), 0);
  const activeCount = investments.filter(
    (i) => i.status === "Active" || i.status === "Maturing Soon"
  ).length;

  const summaryStats = [
    {
      label: "Total Invested",
      value: formatCurrency(totalInvested),
      icon: DollarSign,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Expected Returns",
      value: formatCurrency(totalExpected),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Returns Received",
      value: formatCurrency(totalReturned),
      icon: CheckCircle,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Active Positions",
      value: activeCount,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  const COLUMNS = [
    { key: "id", label: "Investment ID", sortable: true },
    { key: "anchorCompany", label: "Anchor / Invoice", sortable: true },
    { key: "amount", label: "Invested", sortable: true },
    { key: "expectedReturn", label: "Expected Return", sortable: true },
    { key: "yieldRate", label: "Yield", sortable: true },
    { key: "investedDate", label: "Invested On", sortable: true },
    { key: "maturityDate", label: "Maturity", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "actions", label: "", sortable: false },
  ];

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ backgroundColor: "#0f172a" }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1">
            Investor Portal
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Investments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track and manage your full investment portfolio
          </p>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/40 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-700/50 p-4"
            style={{ backgroundColor: "#1e293b" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-2xl border border-slate-700/50 p-4 mb-5 flex flex-col sm:flex-row gap-3"
        style={{ backgroundColor: "#1e293b" }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company, invoice, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === s
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">
          Showing{" "}
          <span className="text-white font-semibold">{filtered.length}</span> of{" "}
          <span className="text-white font-semibold">{investments.length}</span>{" "}
          investments
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-slate-700/50 p-12 text-center"
          style={{ backgroundColor: "#1e293b" }}
        >
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No investments found</p>
          <p className="text-slate-500 text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border border-slate-700/50 overflow-hidden"
          style={{ backgroundColor: "#1e293b" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/40">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-5 py-3.5 text-slate-500 text-xs font-semibold tracking-wider uppercase"
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
                        >
                          {col.label}
                          <SortIcon col={col.key} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => {
                  const sc = statusConfig[inv.status];
                  const returnDiff = inv.expectedReturn - inv.amount;
                  const returnPct = ((returnDiff / inv.amount) * 100).toFixed(2);

                  return (
                    <tr
                      key={inv.id}
                      className={`border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors group ${
                        idx === filtered.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="text-blue-400 text-sm font-semibold">
                          {inv.id}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-semibold">
                          {inv.anchorCompany}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {inv.invoiceNumber}
                        </p>
                        <span className="inline-block text-[10px] text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded mt-1">
                          {inv.sector}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-bold">
                          {formatCurrency(inv.amount)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-emerald-400 text-sm font-bold">
                          {formatCurrency(inv.expectedReturn)}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 text-xs">
                            +{formatCurrency(returnDiff)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-blue-400 text-sm font-bold">
                            {inv.yieldRate}%
                          </span>
                          <span className="text-slate-500 text-xs">
                            Discount: {inv.discountRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-sm">
                        {inv.investedDate}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-300 text-sm">
                          {inv.maturityDate}
                        </p>
                        {inv.daysToMaturity > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500 text-xs">
                              {inv.daysToMaturity}d left
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            navigate(`/investor/invoice/${inv.id}`)
                          }
                          className="p-2 rounded-lg bg-slate-700/30 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3.5 border-t border-slate-700/30 flex items-center justify-between">
            <p className="text-slate-500 text-xs">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Total invested:{" "}
                <span className="text-white font-semibold">
                  {formatCurrency(
                    filtered.reduce((s, i) => s + i.amount, 0)
                  )}
                </span>
              </span>
              <span>·</span>
              <span>
                Expected:{" "}
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(
                    filtered.reduce((s, i) => s + i.expectedReturn, 0)
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
