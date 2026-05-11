import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { walletAPI } from "../../services/api";
import toast from "react-hot-toast";

const fmt = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n || 0);

const nav = [
  { to: "/investor/dashboard", label: "Dashboard" },
  { to: "/investor/market", label: "Marketplace" },
  { to: "/investor/portfolio", label: "Portfolio" },
  { to: "/investor/wallet", label: "Wallet" },
];

export default function InvestorWallet() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await walletAPI.get();
      setWallet(res.data?.wallet || res.data);
    } catch (e) {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 100) return toast.error("Minimum top-up is PKR 100");
    setSubmitting(true);
    try {
      await walletAPI.topup({ amount });
      toast.success(`PKR ${amount.toLocaleString()} added to wallet`);
      setTopupAmount("");
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || "Top-up failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) return toast.error("Minimum withdrawal is PKR 100");
    setSubmitting(true);
    try {
      await walletAPI.withdraw({ amount });
      toast.success(`PKR ${amount.toLocaleString()} withdrawal requested`);
      setWithdrawAmount("");
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1">Investor Portal</p>
          <h1 className="text-3xl font-bold text-white mb-1">Wallet</h1>
          <p className="text-slate-400 text-sm">Manage your funds</p>
        </div>

        {/* Balance Card */}
        <div className="rounded-2xl border border-blue-500/20 p-8 mb-6 text-center"
          style={{ backgroundColor: "#1e293b", background: "linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)" }}>
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Available Balance</p>
          {loading ? (
            <div className="h-12 bg-slate-700/40 rounded-xl w-48 mx-auto animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-white">{fmt(wallet?.balance)}</p>
          )}
          {wallet && (
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-slate-500 text-xs">Total Deposited</p>
                <p className="text-emerald-400 text-sm font-semibold">{fmt(wallet.totalDeposited)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-xs">Locked</p>
                <p className="text-amber-400 text-sm font-semibold">{fmt(wallet.lockedBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-xs">Total Withdrawn</p>
                <p className="text-red-400 text-sm font-semibold">{fmt(wallet.totalWithdrawn)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Up */}
          <div className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="text-white font-semibold mb-4">Top Up Wallet</h3>
            <form onSubmit={handleTopup}>
              <div className="mb-4">
                <label className="text-slate-400 text-sm mb-2 block">Amount (PKR)</label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  min="100"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
                />
              </div>
              <div className="flex gap-2 mb-4">
                {[10000, 50000, 100000].map((amt) => (
                  <button key={amt} type="button" onClick={() => setTopupAmount(String(amt))}
                    className="flex-1 py-1.5 rounded-lg bg-slate-700/40 text-slate-400 text-xs hover:bg-blue-500/20 hover:text-blue-400 transition-all">
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: "#3b82f6" }}>
                {submitting ? "Processing…" : "Add Funds"}
              </button>
            </form>
          </div>

          {/* Withdraw */}
          <div className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="text-white font-semibold mb-4">Withdraw Funds</h3>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="text-slate-400 text-sm mb-2 block">Amount (PKR)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  min="100"
                  max={wallet?.balance || 0}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
                />
              </div>
              <p className="text-slate-500 text-xs mb-4">
                Available: {fmt(wallet?.balance || 0)}
              </p>
              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: "#ef4444" }}>
                {submitting ? "Processing…" : "Withdraw"}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
          <div className="px-6 py-4 border-b border-slate-700/30">
            <h2 className="text-white font-semibold">Transaction History</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-700/40 rounded-xl animate-pulse" />)}
            </div>
          ) : !wallet?.transactions?.length ? (
            <div className="p-10 text-center text-slate-500 text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {[...wallet.transactions].reverse().map((tx, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{tx.description || "—"}</p>
                    <p className="text-slate-600 text-xs">{new Date(tx.createdAt).toLocaleDateString("en-PK")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${["deposit", "repayment", "refund"].includes(tx.type) ? "text-emerald-400" : "text-red-400"}`}>
                      {["deposit", "repayment", "refund"].includes(tx.type) ? "+" : "-"}{fmt(tx.amount)}
                    </p>
                    <p className="text-slate-500 text-xs">Bal: {fmt(tx.balanceAfter)}</p>
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