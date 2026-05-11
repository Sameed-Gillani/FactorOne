import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { investmentAPI, walletAPI, invoiceAPI } from "../../services/api";

const fmt = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n || 0);

const nav = [
  { to: "/investor/dashboard", label: "Dashboard" },
  { to: "/investor/market", label: "Marketplace" },
  { to: "/investor/portfolio", label: "Portfolio" },
  { to: "/investor/wallet", label: "Wallet" },
];

export default function InvestorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, walRes] = await Promise.allSettled([
          investmentAPI.getMy(),
          walletAPI.get(),
        ]);
        if (invRes.status === "fulfilled") setInvestments(invRes.value.data?.investments || invRes.value.data || []);
        if (walRes.status === "fulfilled") setWallet(walRes.value.data?.wallet || walRes.value.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const active = investments.filter((i) => i.status === "active");
  const totalInvested = active.reduce((s, i) => s + (i.amount || 0), 0);
  const totalReturn = active.reduce((s, i) => s + (i.expectedReturn || 0), 0);
  const walletBalance = wallet?.balance ?? user?.walletBalance ?? 0;

  const stats = [
    { label: "Wallet Balance", value: fmt(walletBalance), color: "text-blue-400" },
    { label: "Total Invested", value: fmt(totalInvested), color: "text-emerald-400" },
    { label: "Expected Returns", value: fmt(totalReturn), color: "text-amber-400" },
    { label: "Active Investments", value: active.length, color: "text-purple-400" },
  ];

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
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {user?.firstName || "Investor"} 👋
          </h1>
          <p className="text-slate-400 text-sm">Here's your investment overview</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-700/50 p-6 animate-pulse" style={{ backgroundColor: "#1e293b" }}>
                <div className="h-3 bg-slate-700 rounded mb-3 w-2/3" />
                <div className="h-7 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: "#1e293b" }}>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Investments */}
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
            <h2 className="text-white font-semibold">Recent Investments</h2>
            <button onClick={() => navigate("/investor/portfolio")} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              View All →
            </button>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-700/40 rounded-xl animate-pulse" />)}
            </div>
          ) : investments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">No investments yet</p>
              <button onClick={() => navigate("/investor/market")}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: "#3b82f6" }}>
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {investments.slice(0, 5).map((inv) => (
                <div key={inv._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {inv.invoiceSnapshot?.anchorCompany || inv.invoiceId?.title || "Invoice"}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString("en-PK")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold">{fmt(inv.amount)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inv.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                      inv.status === "matured" ? "bg-blue-500/10 text-blue-400" :
                      "bg-slate-700 text-slate-400"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}