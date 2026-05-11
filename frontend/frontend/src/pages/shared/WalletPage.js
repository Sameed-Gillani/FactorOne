import React, { useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/ui/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import { walletAPI } from "../../services/api";
import toast from "react-hot-toast";

// Role-based nav
const NAV_BY_ROLE = {
  sme: [
    { to: "/sme/dashboard",  label: "Dashboard",    icon: "▦" },
    { to: "/sme/invoices",   label: "My Invoices",  icon: "🧾" },
    { to: "/wallet",         label: "Wallet",       icon: "💳" },
    { to: "/notifications",  label: "Notifications",icon: "🔔" },
  ],
  investor: [
    { to: "/investor/dashboard", label: "Dashboard",    icon: "▦" },
    { to: "/investor/market",    label: "Marketplace",  icon: "🏪" },
    { to: "/investor/portfolio", label: "Portfolio",    icon: "📈" },
    { to: "/wallet",             label: "Wallet",       icon: "💳" },
    { to: "/notifications",      label: "Notifications",icon: "🔔" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: "▦" },
    { to: "/admin/invoices",  label: "Invoices",  icon: "🧾" },
    { to: "/admin/users",     label: "Users",     icon: "👥" },
    { to: "/wallet",          label: "Wallet",    icon: "💳" },
  ],
};

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

const TYPE_STYLE = {
  topup:        { badge: "badge-green",  label: "Top Up",      icon: "↓" },
  investment:   { badge: "badge-red",    label: "Investment",  icon: "↑" },
  disbursement: { badge: "badge-blue",   label: "Disbursement",icon: "↓" },
  withdrawal:   { badge: "badge-yellow", label: "Withdrawal",  icon: "↑" },
};

export default function WalletPage() {
  const { user } = useAuth();
  const nav = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.sme;

  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txTotal,      setTxTotal]      = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [txPage,       setTxPage]       = useState(1);

  // Top-up form
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  // Withdraw form
  const [withdrawAmount,  setWithdrawAmount]  = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const TX_LIMIT = 10;

  const load = useCallback(async () => {
    try {
      const res = await walletAPI.get({ page: txPage, limit: TX_LIMIT });
      setWallet(res.data.wallet);
      setTransactions(res.data.transactions?.records || []);
      setTxTotal(res.data.transactions?.pagination?.total || 0);
    } catch { toast.error("Failed to load wallet."); }
    finally  { setLoading(false); }
  }, [txPage]);

  useEffect(() => { load(); }, [load]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    const amount = Number(topupAmount);
    if (!amount || amount < 100) return toast.error("Minimum top-up is PKR 100");
    setTopupLoading(true);
    try {
      await walletAPI.topUp({ amount, paymentMethod: "bank_transfer" });
      toast.success(`PKR ${amount.toLocaleString()} added to wallet!`);
      setTopupAmount("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Top-up failed");
    } finally { setTopupLoading(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 500) return toast.error("Minimum withdrawal is PKR 500");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");
    setWithdrawLoading(true);
    try {
      await walletAPI.withdraw({ amount });
      toast.success(`PKR ${amount.toLocaleString()} withdrawal processed!`);
      setWithdrawAmount("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    } finally { setWithdrawLoading(false); }
  };

  if (loading) return (
    <DashboardShell navItems={nav}>
      <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
    </DashboardShell>
  );

  return (
    <DashboardShell navItems={nav}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Wallet</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your funds</p>
        </div>

        {/* Balance card */}
        <div className="card p-8 bg-gradient-to-br from-accent/10 to-navy-800 border-accent/20">
          <p className="text-slate-400 text-sm mb-2">Available Balance</p>
          <p className="font-display text-4xl text-white mb-1">{fmt(wallet?.balance)}</p>
          {wallet?.frozenBalance > 0 && (
            <p className="text-xs text-slate-500">
              {fmt(wallet.frozenBalance)} frozen · {fmt(wallet?.availableBalance)} available
            </p>
          )}
          <p className="text-xs text-slate-600 mt-2">{wallet?.currency || "PKR"}</p>
        </div>

        {/* Top-up + Withdraw forms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Top Up */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm">↓</span>
              Add Funds
            </h2>
            <form onSubmit={handleTopUp} className="space-y-3">
              <div>
                <label className="label">Amount (PKR)</label>
                <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                  placeholder="e.g. 100000" min="100" className="input-field" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[10000,50000,100000,500000].map(v => (
                  <button key={v} type="button" onClick={() => setTopupAmount(String(v))}
                    className="px-3 py-1 text-xs rounded-lg bg-navy-700 text-slate-400 hover:text-white hover:bg-navy-600 transition-colors">
                    {(v/1000).toFixed(0)}k
                  </button>
                ))}
              </div>
              <button type="submit" disabled={topupLoading} className="btn-primary w-full">
                {topupLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Adding…</> : "Add Funds"}
              </button>
            </form>
          </div>

          {/* Withdraw */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center text-sm">↑</span>
              Withdraw Funds
            </h2>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="label">Amount (PKR)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 50000" min="500" max={wallet?.balance || 0} className="input-field" />
                <p className="text-xs text-slate-500 mt-1">Available: {fmt(wallet?.balance)}</p>
              </div>
              <button type="submit" disabled={withdrawLoading} className="btn-secondary w-full">
                {withdrawLoading ? <><span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin"/>Processing…</> : "Withdraw"}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction history */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No transactions yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-700">
                      {["Type","Direction","Amount","Balance After","Date"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const ts = TYPE_STYLE[tx.type] || { badge: "badge-gray", label: tx.type, icon: "•" };
                      return (
                        <tr key={tx._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                          <td className="py-3 px-3">
                            <span className={`badge ${ts.badge}`}>{ts.label}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-semibold ${tx.direction === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                              {tx.direction === "credit" ? "↓ Credit" : "↑ Debit"}
                            </span>
                          </td>
                          <td className={`py-3 px-3 font-semibold ${tx.direction === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                            {tx.direction === "credit" ? "+" : "-"}{fmt(tx.amount)}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{fmt(tx.balanceAfter)}</td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {txTotal > TX_LIMIT && (
                <div className="flex justify-center gap-2 mt-4">
                  <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
                  <span className="text-slate-400 text-sm py-2 px-3">Page {txPage} of {Math.ceil(txTotal / TX_LIMIT)}</span>
                  <button disabled={txPage >= Math.ceil(txTotal / TX_LIMIT)} onClick={() => setTxPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
