import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";

const mockInvestments = [
  {
    id: "INV-001",
    invoice: "INV-2024-0041",
    anchor: "Nestlé Pakistan",
    amount: 500000,
    expectedReturn: 527500,
    maturityDate: "2024-03-15",
    status: "Active",
    daysLeft: 18,
  },
  {
    id: "INV-002",
    invoice: "INV-2024-0038",
    anchor: "Engro Corporation",
    amount: 750000,
    expectedReturn: 796875,
    maturityDate: "2024-03-22",
    status: "Active",
    daysLeft: 25,
  },
  {
    id: "INV-003",
    invoice: "INV-2024-0029",
    anchor: "Lucky Cement",
    amount: 300000,
    expectedReturn: 315600,
    maturityDate: "2024-03-08",
    status: "Maturing Soon",
    daysLeft: 11,
  },
  {
    id: "INV-004",
    invoice: "INV-2024-0021",
    anchor: "PSO",
    amount: 1200000,
    expectedReturn: 1269600,
    maturityDate: "2024-02-28",
    status: "Completed",
    daysLeft: 0,
  },
  {
    id: "INV-005",
    invoice: "INV-2024-0015",
    anchor: "Unilever Pakistan",
    amount: 450000,
    expectedReturn: 472950,
    maturityDate: "2024-02-20",
    status: "Completed",
    daysLeft: 0,
  },
];

const monthlyData = [
  { month: "Oct", invested: 820000, returns: 856300 },
  { month: "Nov", invested: 1100000, returns: 1162000 },
  { month: "Dec", invested: 950000, returns: 1002500 },
  { month: "Jan", invested: 1450000, returns: 1537000 },
  { month: "Feb", invested: 1650000, returns: 1749000 },
  { month: "Mar", invested: 1550000, returns: 1643300 },
];

const statusConfig = {
  Active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  "Maturing Soon": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  Completed: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    dot: "bg-slate-400",
  },
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl">
        <p className="text-slate-300 text-sm font-semibold mb-2">{label}</p>
        <p className="text-blue-400 text-sm">
          Invested:{" "}
          <span className="font-bold">{formatCurrency(payload[0]?.value)}</span>
        </p>
        <p className="text-emerald-400 text-sm">
          Returns:{" "}
          <span className="font-bold">{formatCurrency(payload[1]?.value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalInvested = mockInvestments
    .filter((i) => i.status !== "Completed")
    .reduce((s, i) => s + i.amount, 0);
  const activeCount = mockInvestments.filter(
    (i) => i.status === "Active" || i.status === "Maturing Soon"
  ).length;
  const expectedReturns = mockInvestments
    .filter((i) => i.status !== "Completed")
    .reduce((s, i) => s + i.expectedReturn, 0);

  const stats = [
    {
      label: "Total Invested",
      value: formatCurrency(totalInvested),
      icon: DollarSign,
      change: "+12.4%",
      positive: true,
      accent: "from-blue-600/20 to-blue-500/5",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Active Investments",
      value: activeCount,
      icon: Activity,
      change: "+2 this month",
      positive: true,
      accent: "from-violet-600/20 to-violet-500/5",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-400",
    },
    {
      label: "Expected Returns",
      value: formatCurrency(expectedReturns),
      icon: TrendingUp,
      change: "+5.5% avg yield",
      positive: true,
      accent: "from-emerald-600/20 to-emerald-500/5",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
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
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back — here's your portfolio overview
          </p>
        </div>
        <button
          onClick={() => navigate("/investor/marketplace")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
          style={{ backgroundColor: "#3b82f6" }}
        >
          Browse Marketplace
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-6 border border-slate-700/50 transition-all duration-500 ${
              animateCards
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              backgroundColor: "#1e293b",
              transitionDelay: `${i * 80}ms`,
            }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.accent} pointer-events-none`}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-3">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white tracking-tight mb-2">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Investments Table */}
        <div
          className="xl:col-span-2 rounded-2xl border border-slate-700/50 overflow-hidden"
          style={{ backgroundColor: "#1e293b" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-white font-semibold text-base">
              Active Investments
            </h2>
            <button
              onClick={() => navigate("/investor/my-investments")}
              className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  {[
                    "Invoice",
                    "Amount",
                    "Expected Return",
                    "Maturity Date",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-slate-400 text-xs font-semibold tracking-wider uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockInvestments.map((inv, idx) => {
                  const sc = statusConfig[inv.status];
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors cursor-pointer group"
                      onClick={() =>
                        navigate(`/investor/investments/${inv.id}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm font-semibold group-hover:text-blue-400 transition-colors">
                            {inv.invoice}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {inv.anchor}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-200 text-sm font-medium">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 text-sm font-semibold">
                        {formatCurrency(inv.expectedReturn)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300 text-sm">
                            {inv.maturityDate}
                          </span>
                        </div>
                        {inv.daysLeft > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500 text-xs">
                              {inv.daysLeft}d left
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
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

        {/* Bar Chart */}
        <div
          className="rounded-2xl border border-slate-700/50 p-6"
          style={{ backgroundColor: "#1e293b" }}
        >
          <h2 className="text-white font-semibold text-base mb-1">
            Monthly Activity
          </h2>
          <p className="text-slate-400 text-xs mb-5">
            Investments vs Returns (PKR)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={monthlyData}
              barSize={10}
              barGap={3}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="invested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returns" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-slate-400 text-xs">Invested</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-400 text-xs">Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
