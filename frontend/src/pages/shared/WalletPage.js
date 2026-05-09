import React, { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "";

const TYPE_BADGES = {
  topup: {
    label: "Top Up",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    sign: "+",
    signColor: "text-emerald-400",
  },
  investment: {
    label: "Investment",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    sign: "-",
    signColor: "text-rose-400",
  },
  disbursement: {
    label: "Disbursement",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    sign: "+",
    signColor: "text-blue-400",
  },
  withdrawal: {
    label: "Withdrawal",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
    sign: "-",
    signColor: "text-orange-400",
  },
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }) {
  const config = TYPE_BADGES[type] || {
    label: type,
    bg: "bg-slate-700",
    text: "text-slate-300",
    border: "border-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

function Alert({ type, message, onClose }) {
  if (!message) return null;
  const styles =
    type === "error"
      ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${styles}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function WalletPage() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  // Add Funds form
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupAlert, setTopupAlert] = useState({ type: "", message: "" });

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawAlert, setWithdrawAlert] = useState({ type: "", message: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wallet`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      setBalance(data.balance ?? data.data?.balance ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (pageNum = 1) => {
    setLoadingTx(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/wallet/transactions?page=${pageNum}&limit=${PAGE_SIZE}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      const txList = data.transactions ?? data.data ?? data ?? [];
      setTransactions(txList);
      setTotalPages(
        data.totalPages ??
          Math.ceil((data.total ?? txList.length) / PAGE_SIZE) ??
          1
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTransactions(page);
  }, [fetchWallet, fetchTransactions, page]);

  async function handleTopup(e) {
    e.preventDefault();
    setTopupAlert({ type: "", message: "" });
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      setTopupAlert({ type: "error", message: "Please enter a valid amount greater than 0." });
      return;
    }
    setTopupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Top up failed");
      setTopupAlert({ type: "success", message: `Successfully added ${formatCurrency(amount)} to your wallet.` });
      setTopupAmount("");
      await fetchWallet();
      await fetchTransactions(1);
      setPage(1);
    } catch (err) {
      setTopupAlert({ type: "error", message: err.message });
    } finally {
      setTopupLoading(false);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setWithdrawAlert({ type: "", message: "" });
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawAlert({ type: "error", message: "Please enter a valid amount greater than 0." });
      return;
    }
    if (balance !== null && amount > balance) {
      setWithdrawAlert({ type: "error", message: `Insufficient balance. Available: ${formatCurrency(balance)}.` });
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Withdrawal failed");
      setWithdrawAlert({ type: "success", message: `Successfully withdrew ${formatCurrency(amount)} from your wallet.` });
      setWithdrawAmount("");
      await fetchWallet();
      await fetchTransactions(1);
      setPage(1);
    } catch (err) {
      setWithdrawAlert({ type: "error", message: err.message });
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Wallet</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your funds and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e293b] to-[#0f172a] border border-blue-500/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">Available Balance</span>
            </div>
            {loadingWallet ? (
              <div className="h-12 w-48 rounded-lg bg-slate-700/50 animate-pulse mt-2" />
            ) : (
              <div className="text-4xl sm:text-5xl font-bold text-white mt-1 tabular-nums">
                {formatCurrency(balance ?? 0)}
              </div>
            )}
            <p className="text-slate-500 text-xs mt-3">Funds are available for investment or withdrawal</p>
          </div>
        </div>

        {/* Forms Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Add Funds */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Add Funds</h2>
                <p className="text-xs text-slate-400">Top up your wallet balance</p>
              </div>
            </div>
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt.toString())}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-700/60 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 border border-slate-600/50 hover:border-emerald-500/40 transition-all"
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <Alert type={topupAlert.type} message={topupAlert.message} onClose={() => setTopupAlert({ type: "", message: "" })} />
              <button
                type="submit"
                disabled={topupLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                {topupLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Funds</>
                )}
              </button>
            </form>
          </div>

          {/* Withdraw */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Withdraw</h2>
                <p className="text-xs text-slate-400">Transfer funds to your bank account</p>
              </div>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                    required
                  />
                </div>
                {balance !== null && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Available: <span className="text-slate-300 font-medium">{formatCurrency(balance)}</span>
                    {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                      <span className={parseFloat(withdrawAmount) > balance ? " text-rose-400" : " text-slate-500"}>
                        {" "}· After: {formatCurrency(Math.max(0, balance - parseFloat(withdrawAmount)))}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt.toString())}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-700/60 text-slate-300 hover:bg-orange-500/20 hover:text-orange-400 border border-slate-600/50 hover:border-orange-500/40 transition-all"
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
                {balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-700/60 text-slate-300 hover:bg-orange-500/20 hover:text-orange-400 border border-slate-600/50 hover:border-orange-500/40 transition-all"
                  >
                    Max
                  </button>
                )}
              </div>
              <Alert type={withdrawAlert.type} message={withdrawAlert.message} onClose={() => setWithdrawAlert({ type: "", message: "" })} />
              <button
                type="submit"
                disabled={withdrawLoading}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
              >
                {withdrawLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Withdraw Funds</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Transaction History</h2>
                <p className="text-xs text-slate-400">All wallet activity</p>
              </div>
            </div>
            <button
              onClick={() => fetchTransactions(page)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loadingTx ? (
            <Spinner />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">No transactions yet</p>
              <p className="text-slate-500 text-sm mt-1">Add funds to get started</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance After</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {transactions.map((tx, idx) => {
                      const config = TYPE_BADGES[tx.type] || { sign: "", signColor: "text-slate-300" };
                      return (
                        <tr key={tx._id || tx.id || idx} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <TypeBadge type={tx.type} />
                              {tx.description && (
                                <span className="text-xs text-slate-500 mt-0.5">{tx.description}</span>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-right font-semibold tabular-nums ${config.signColor}`}>
                            {config.sign}{formatCurrency(Math.abs(tx.amount))}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-300 tabular-nums font-medium">
                            {tx.balanceAfter !== undefined && tx.balanceAfter !== null
                              ? formatCurrency(tx.balanceAfter)
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(tx.createdAt || tx.date)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-slate-700/40">
                {transactions.map((tx, idx) => {
                  const config = TYPE_BADGES[tx.type] || { sign: "", signColor: "text-slate-300" };
                  return (
                    <div key={tx._id || tx.id || idx} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <TypeBadge type={tx.type} />
                          {tx.description && <p className="text-xs text-slate-500">{tx.description}</p>}
                          <p className="text-xs text-slate-500">{formatDate(tx.createdAt || tx.date)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold tabular-nums ${config.signColor}`}>
                            {config.sign}{formatCurrency(Math.abs(tx.amount))}
                          </p>
                          {tx.balanceAfter !== undefined && tx.balanceAfter !== null && (
                            <p className="text-xs text-slate-400 mt-0.5">Bal: {formatCurrency(tx.balanceAfter)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700/60 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
