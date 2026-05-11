import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "../../components/ui/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import { investmentAPI, walletAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/investor/dashboard",  label: "Dashboard",    icon: "▦" },
  { to: "/investor/market",     label: "Marketplace",  icon: "🏪" },
  { to: "/investor/portfolio",  label: "Portfolio",    icon: "📈" },
  { to: "/investor/wallet",     label: "Wallet",       icon: "💳" },
  { to: "/notifications",       label: "Notifications",icon: "🔔" },
];

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

const StatCard = ({ label, value, sub, color = "blue" }) => {
  const colors = { blue: "border-blue-500/30 bg-blue-500/5", green: "border-emerald-500/30 bg-emerald-500/5", purple: "border-purple-500/30 bg-purple-500/5" };
  return (
    <div className={`card p-6 border-l-4 ${colors[color]}`}>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
};

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [wallet,      setWallet]      = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, walRes] = await Promise.all([
          investmentAPI.getMy({ limit: 50 }),
          walletAPI.get(),
        ]);
        setInvestments(invRes.data.investments || []);
        setWallet(walRes.data.wallet);
      } catch { toast.error("Failed to load dashboard data."); }
      finally  { setLoading(false); }
    };
    load();
  }, []);

  // Chart data: group investments by month
  const chartData = React.useMemo(() => {
    const map = {};
    investments.forEach(inv => {
      const month = new Date(inv.createdAt).toLocaleString("default", { month: "short" });
      map[month] = (map[month] || 0) + inv.amount;
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount }));
  }, [investments]);

  const totalInvested    = investments.reduce((s, i) => s + i.amount, 0);
  const totalExpected    = investments.reduce((s, i) => s + i.expectedReturn, 0);
  const activeCount      = investments.filter(i => i.status === "active").length;

  if (loading) return <DashboardShell navItems={NAV}><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div></DashboardShell>;

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Your investment overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Wallet Balance"     value={fmt(wallet?.balance)}    sub="Available to invest" color="blue" />
          <StatCard label="Total Invested"     value={fmt(totalInvested)}      sub={`${investments.length} investments`} color="purple" />
          <StatCard label="Active Investments" value={activeCount}             sub="Currently active" color="green" />
          <StatCard label="Expected Returns"   value={fmt(totalExpected)}      sub="At maturity" color="blue" />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Investment Volume by Month</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`PKR ${Number(v).toLocaleString()}`, "Amount"]} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active investments table */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Investments</h2>
            <Link to="/investor/portfolio" className="text-sm text-accent hover:underline">View all →</Link>
          </div>
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-slate-400 mb-4">No investments yet</p>
              <Link to="/investor/market" className="btn-primary">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    {["Invoice","Anchor Company","Amount","Expected Return","Maturity","Status"].map(h => (
                      <th key={h} className="text-left py-3 px-2 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investments.slice(0,8).map(inv => (
                    <tr key={inv._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 px-2 text-slate-300 font-mono text-xs">{inv.invoiceSnapshot?.invoiceNumber || "—"}</td>
                      <td className="py-3 px-2 text-slate-300">{inv.invoiceSnapshot?.anchorCompany || "—"}</td>
                      <td className="py-3 px-2 text-white font-semibold">{fmt(inv.amount)}</td>
                      <td className="py-3 px-2 text-emerald-400 font-semibold">+{fmt(inv.expectedReturn)}</td>
                      <td className="py-3 px-2 text-slate-400">{new Date(inv.maturityDate).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${inv.status === "active" ? "badge-green" : inv.status === "matured" ? "badge-blue" : "badge-gray"}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link to="/investor/market" className="btn-primary px-8">🏪 Browse Marketplace</Link>
        </div>
      </div>
    </DashboardShell>
  );
}
