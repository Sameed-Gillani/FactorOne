import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../../components/ui/DashboardShell";
import { invoiceAPI, investmentAPI, walletAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/investor/dashboard", label: "Dashboard",    icon: "▦" },
  { to: "/investor/market",    label: "Marketplace",  icon: "🏪" },
  { to: "/investor/portfolio", label: "Portfolio",    icon: "📈" },
  { to: "/investor/wallet",    label: "Wallet",       icon: "💳" },
  { to: "/notifications",      label: "Notifications",icon: "🔔" },
];

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;
const creditColor = { Good: "badge-green", Average: "badge-yellow", Poor: "badge-red", "N/A": "badge-gray" };

// ── Invest Modal ──────────────────────────────────────────────
function InvestModal({ invoice, walletBalance, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [loading, setLoading] = useState(false);
  const remaining = invoice.amountPkr - invoice.fundedAmount;
  const numAmount = Number(amount) || 0;
  const expectedReturn = parseFloat((numAmount * (invoice.discountRate / 100)).toFixed(2));
  const payout = numAmount + expectedReturn;

  const handleInvest = async () => {
    if (numAmount < 1000)         return toast.error("Minimum investment is PKR 1,000");
    if (numAmount > remaining)    return toast.error(`Maximum you can invest is ${fmt(remaining)}`);
    if (numAmount > walletBalance) return toast.error("Insufficient wallet balance");
    setLoading(true);
    try {
      await investmentAPI.place({ invoiceId: invoice._id, amount: numAmount });
      toast.success("Investment placed successfully! 🎉");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Investment failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="card p-7 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Invest in Invoice</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="space-y-3 mb-5 bg-navy-900 rounded-xl p-4 border border-navy-600 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Anchor Company</span><span className="text-slate-200">{invoice.anchorCompany}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Invoice Amount</span><span className="text-slate-200">{fmt(invoice.amountPkr)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Remaining</span><span className="text-accent font-semibold">{fmt(remaining)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Discount Rate</span><span className="text-emerald-400">{invoice.discountRate}%</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Your Balance</span><span className={walletBalance < 1000 ? "text-danger" : "text-white"}>{fmt(walletBalance)}</span></div>
        </div>
        <div className="mb-4">
          <label className="label">Investment Amount (PKR)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 50000" min="1000" max={Math.min(remaining, walletBalance)}
            className="input-field" />
        </div>
        {numAmount > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-5 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Your investment</span><span className="text-white font-semibold">{fmt(numAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Expected return</span><span className="text-emerald-400 font-semibold">+{fmt(expectedReturn)}</span></div>
            <div className="flex justify-between border-t border-emerald-500/20 pt-2"><span className="text-slate-300 font-semibold">Total payout</span><span className="text-emerald-400 font-bold">{fmt(payout)}</span></div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleInvest} disabled={loading || !numAmount} className="btn-primary flex-1">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Investing…</> : "Confirm Investment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Card ──────────────────────────────────────────────
function InvoiceCard({ invoice, onInvest }) {
  const remaining  = invoice.amountPkr - invoice.fundedAmount;
  const pct        = Math.round((invoice.fundedAmount / invoice.amountPkr) * 100);
  const daysLeft   = Math.ceil((new Date(invoice.dueDate) - Date.now()) / 86400000);

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm leading-tight">{invoice.anchorCompany}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">{invoice.invoiceNumber}</p>
        </div>
        <span className={`badge ${creditColor[invoice.creditScore] || "badge-gray"}`}>{invoice.creditScore}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-slate-500 text-xs">Invoice Amount</p><p className="text-white font-semibold">{fmt(invoice.amountPkr)}</p></div>
        <div><p className="text-slate-500 text-xs">Discount Rate</p><p className="text-emerald-400 font-semibold">{invoice.discountRate}%</p></div>
        <div><p className="text-slate-500 text-xs">Remaining</p><p className="text-accent font-semibold">{fmt(remaining)}</p></div>
        <div><p className="text-slate-500 text-xs">Days to Maturity</p><p className="text-white font-semibold">{daysLeft}d</p></div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Funded {pct}%</span>
          <span>{fmt(invoice.fundedAmount)} / {fmt(invoice.amountPkr)}</span>
        </div>
        <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Link to={`/investor/invoice/${invoice._id}`} className="btn-secondary flex-1 text-center text-xs py-2">Details</Link>
        <button onClick={() => onInvest(invoice)} className="btn-primary flex-1 text-xs py-2">Invest Now</button>
      </div>
    </div>
  );
}

export default function InvestorMarket() {
  const [invoices,  setInvoices]  = useState([]);
  const [wallet,    setWallet]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // invoice for modal
  const [search,    setSearch]    = useState("");
  const [creditFilter, setCreditFilter] = useState("all");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const LIMIT = 9;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, walRes] = await Promise.all([
        invoiceAPI.getAllVerified({ page, limit: LIMIT, creditScore: creditFilter === "all" ? undefined : creditFilter }),
        walletAPI.get(),
      ]);
      setInvoices(invRes.data.invoices || []);
      setTotal(invRes.data.pagination?.total || 0);
      setWallet(walRes.data.wallet);
    } catch { toast.error("Failed to load marketplace."); }
    finally  { setLoading(false); }
  }, [page, creditFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter(inv =>
    inv.anchorCompany.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvestSuccess = () => { setSelected(null); load(); };

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Invoice Marketplace</h1>
          <p className="text-slate-500 text-sm mt-1">Verified invoices available for investment</p>
        </div>

        {/* Wallet balance banner */}
        {wallet && (
          <div className="card p-4 flex items-center justify-between border-l-4 border-accent/50">
            <div><p className="text-xs text-slate-500">Available to invest</p><p className="text-xl font-bold text-white">{fmt(wallet.balance)}</p></div>
            <Link to="/investor/wallet" className="btn-secondary text-xs py-2">Top Up</Link>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by company or invoice number…"
            className="input-field max-w-xs text-sm py-2" />
          <select value={creditFilter} onChange={e => { setCreditFilter(e.target.value); setPage(1); }}
            className="input-field w-40 text-sm py-2 appearance-none">
            <option value="all">All Ratings</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-400">No verified invoices available right now.</p>
            <p className="text-slate-600 text-sm mt-1">Check back soon — new invoices are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(inv => (
              <InvoiceCard key={inv._id} invoice={inv} onInvest={setSelected} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
            <span className="text-slate-400 text-sm py-2 px-3">Page {page} of {Math.ceil(total / LIMIT)}</span>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>

      {/* Invest Modal */}
      {selected && (
        <InvestModal invoice={selected} walletBalance={wallet?.balance || 0}
          onClose={() => setSelected(null)} onSuccess={handleInvestSuccess} />
      )}
    </DashboardShell>
  );
}
