import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

// ── Mock fallback data ──────────────────────────────────────────────────────
const MOCK_STATS = {
  totalUsers: 1284,
  pendingInvoices: 37,
  totalInvoices: 892,
  totalInvestmentVolume: 487250000,
};

const MOCK_CHART = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    submissions: Math.floor(Math.random() * 28) + 5,
  };
});

const MOCK_RECENT_INVOICES = [
  { id: "INV-001", number: "NP-2024-4412", sme: "PakFresh Distributors", anchor: "Nestlé Pakistan", amount: 2500000, status: "Pending", date: "2024-02-26" },
  { id: "INV-002", number: "EC-2024-2891", sme: "AlphaGrid Energy", anchor: "Engro Corporation", amount: 5000000, status: "Approved", date: "2024-02-25" },
  { id: "INV-003", number: "LC-2024-1056", sme: "BuildMart Solutions", anchor: "Lucky Cement", amount: 1800000, status: "Pending", date: "2024-02-25" },
  { id: "INV-004", number: "PSO-2024-7723", sme: "FuelLink Pakistan", anchor: "PSO", amount: 8000000, status: "Rejected", date: "2024-02-24" },
  { id: "INV-005", number: "UL-2024-3344", sme: "Sunrise Traders", anchor: "Unilever Pakistan", amount: 3200000, status: "Approved", date: "2024-02-24" },
];

const MOCK_RECENT_USERS = [
  { id: "U-001", name: "Ahmed Raza", email: "ahmed.raza@pakfresh.com", role: "SME", status: "Active", joined: "2024-02-26" },
  { id: "U-002", name: "Sara Malik", email: "sara.malik@alphagrid.pk", role: "SME", status: "Active", joined: "2024-02-25" },
  { id: "U-003", name: "Bilal Khan", email: "bilal.k@investor.pk", role: "Investor", status: "Pending", joined: "2024-02-25" },
  { id: "U-004", name: "Farah Noor", email: "farah.noor@buildmart.pk", role: "SME", status: "Active", joined: "2024-02-24" },
  { id: "U-005", name: "Usman Tariq", email: "usman.t@fintech.pk", role: "Investor", status: "Blocked", joined: "2024-02-23" },
];
// ────────────────────────────────────────────────────────────────────────────

const fmt = (v) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v) => {
  if (v >= 1_000_000_000) return `₨${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `₨${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₨${(v / 1_000).toFixed(0)}K`;
  return `₨${v}`;
};

const INVOICE_STATUS = {
  Pending:  { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400"  },
  Approved: { bg: "bg-emerald-500/10",text: "text-emerald-400",dot: "bg-emerald-400" },
  Rejected: { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400"    },
};

const USER_STATUS = {
  Active:  { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  Pending: { bg: "bg-amber-500/10",   text: "text-amber-400"   },
  Blocked: { bg: "bg-red-500/10",     text: "text-red-400"     },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-blue-400 font-bold">{payload[0]?.value} submissions</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStats(data.stats ?? MOCK_STATS);
        setChartData(data.chartData ?? MOCK_CHART);
        setRecentInvoices(data.recentInvoices ?? MOCK_RECENT_INVOICES);
        setRecentUsers(data.recentUsers ?? MOCK_RECENT_USERS);
      } catch {
        setStats(MOCK_STATS);
        setChartData(MOCK_CHART);
        setRecentInvoices(MOCK_RECENT_INVOICES);
        setRecentUsers(MOCK_RECENT_USERS);
      } finally {
        setLoading(false);
        setTimeout(() => setMounted(true), 60);
      }
    };
    load();
  }, []);

  const STAT_CARDS = stats
    ? [
        { label: "Total Users",          value: stats.totalUsers.toLocaleString(),        icon: Users,       accent: "from-blue-600/20 to-transparent",    iconBg: "bg-blue-500/20",    iconCol: "text-blue-400",    change: "+48 this week"     },
        { label: "Pending Invoices",      value: stats.pendingInvoices.toLocaleString(),   icon: Clock,       accent: "from-amber-600/20 to-transparent",   iconBg: "bg-amber-500/20",   iconCol: "text-amber-400",   change: "Needs review"       },
        { label: "Total Invoices",        value: stats.totalInvoices.toLocaleString(),     icon: FileText,    accent: "from-violet-600/20 to-transparent",  iconBg: "bg-violet-500/20",  iconCol: "text-violet-400",  change: "+14 today"          },
        { label: "Investment Volume",     value: fmtCompact(stats.totalInvestmentVolume),  icon: TrendingUp,  accent: "from-emerald-600/20 to-transparent", iconBg: "bg-emerald-500/20", iconCol: "text-emerald-400", change: "+12.4% this month"  },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "#0f172a" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase">Admin Portal</p>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform overview &amp; activity</p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl border border-slate-700/50 p-6 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ backgroundColor: "#1e293b", transitionDelay: `${i * 80}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} pointer-events-none`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-[11px] font-semibold tracking-widest uppercase mb-3">{card.label}</p>
                <p className="text-2xl font-bold text-white tracking-tight mb-2">{card.value}</p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-xs">{card.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconCol}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-700/50 p-6 mb-6" style={{ backgroundColor: "#1e293b" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">Invoice Submissions</h2>
            <p className="text-slate-500 text-xs mt-0.5">Last 30 days</p>
          </div>
          <button
            onClick={() => navigate("/admin/invoices")}
            className="flex items-center gap-1.5 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
          >
            View queue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="submissions"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
            <h2 className="text-white font-semibold text-sm">Recent Invoice Submissions</h2>
            <button
              onClick={() => navigate("/admin/invoices")}
              className="flex items-center gap-1 text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  {["Invoice", "SME", "Amount", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv, idx) => {
                  const sc = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.Pending;
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-700/20 last:border-0 hover:bg-slate-700/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-white text-xs font-semibold">{inv.number}</p>
                        <p className="text-slate-500 text-[11px]">{inv.date}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-300 text-xs">{inv.sme}</p>
                        <p className="text-slate-600 text-[11px]">{inv.anchor}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-200 text-xs font-medium">{fmt(inv.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
            <h2 className="text-white font-semibold text-sm">Recently Registered Users</h2>
            <button
              onClick={() => navigate("/admin/users")}
              className="flex items-center gap-1 text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  {["User", "Role", "Status", "Joined"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => {
                  const sc = USER_STATUS[u.status] ?? USER_STATUS.Pending;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-700/20 last:border-0 hover:bg-slate-700/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/users`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-white text-xs font-semibold">{u.name}</p>
                        <p className="text-slate-500 text-[11px]">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${u.role === "Investor" ? "bg-violet-500/10 text-violet-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{u.joined}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
