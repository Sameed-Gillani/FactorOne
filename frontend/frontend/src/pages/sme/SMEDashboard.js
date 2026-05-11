import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../../components/ui/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import { invoiceAPI, walletAPI } from "../../services/api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/sme/dashboard", label: "Dashboard",    icon: "▦" },
  { to: "/sme/submit",    label: "Submit Invoice",icon: "➕" },
  { to: "/sme/invoices",  label: "My Invoices",  icon: "🧾" },
  { to: "/wallet",        label: "Wallet",       icon: "💳" },
  { to: "/notifications", label: "Notifications",icon: "🔔" },
];

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

const STATUS_BADGE = {
  pending:  "badge-yellow",
  verified: "badge-blue",
  funded:   "badge-green",
  rejected: "badge-red",
};

export default function SMEDashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [wallet,   setWallet]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, walRes] = await Promise.all([
          invoiceAPI.getMy({ limit: 50 }),
          walletAPI.get(),
        ]);
        setInvoices(invRes.data.invoices || []);
        setWallet(walRes.data.wallet);
      } catch { toast.error("Failed to load dashboard."); }
      finally  { setLoading(false); }
    };
    load();
  }, []);

  const counts = invoices.reduce(
    (acc, inv) => { acc[inv.status] = (acc[inv.status] || 0) + 1; return acc; },
    { pending: 0, verified: 0, funded: 0, rejected: 0 }
  );
  const totalFunded = invoices.filter(i => i.status === "funded").reduce((s, i) => s + i.amountPkr, 0);

  if (loading) return (
    <DashboardShell navItems={NAV}>
      <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-navy-600 border-t-accent rounded-full animate-spin"/></div>
    </DashboardShell>
  );

  return (
    <DashboardShell navItems={NAV}>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.businessName || "SME Dashboard"}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-accent/40">
            <p className="text-slate-400 text-xs mb-1">Total Submitted</p>
            <p className="text-2xl font-bold text-white">{invoices.length}</p>
          </div>
          <div className="card p-5 border-l-4 border-yellow-500/40">
            <p className="text-slate-400 text-xs mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-white">{counts.pending}</p>
          </div>
          <div className="card p-5 border-l-4 border-emerald-500/40">
            <p className="text-slate-400 text-xs mb-1">Funded</p>
            <p className="text-2xl font-bold text-white">{counts.funded}</p>
          </div>
          <div className="card p-5 border-l-4 border-emerald-500/40">
            <p className="text-slate-400 text-xs mb-1">Wallet Balance</p>
            <p className="text-xl font-bold text-white">{fmt(wallet?.balance)}</p>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
            <div className="flex gap-2">
              <Link to="/sme/invoices" className="text-sm text-accent hover:underline">View all →</Link>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-slate-400 mb-4">No invoices yet. Submit your first one!</p>
              <Link to="/sme/submit" className="btn-primary">Submit Invoice</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    {["Invoice #","Anchor Company","Amount","Status","Date"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 8).map(inv => (
                    <tr key={inv._id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 px-3 text-accent font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-300">{inv.anchorCompany}</td>
                      <td className="py-3 px-3 text-white font-semibold">{fmt(inv.amountPkr)}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${STATUS_BADGE[inv.status] || "badge-gray"}`}>{inv.status}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/sme/submit" className="btn-primary">➕ Submit New Invoice</Link>
          <Link to="/wallet"     className="btn-secondary">💳 View Wallet ({fmt(wallet?.balance)})</Link>
        </div>
      </div>
    </DashboardShell>
  );
}
