import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, TrendingUp, Wallet, PlusCircle } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import api, { Invoice, formatPKR, formatDate } from '../../lib/api';

export default function SMEDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices/my').then(res => {
      setInvoices(res.data.invoices || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const total = invoices.length;
  const pending = invoices.filter(i => i.status === 'pending').length;
  const funded = invoices.filter(i => i.status === 'funded').length;
  const totalValue = invoices.filter(i => i.status === 'funded').reduce((s, i) => s + i.amountPkr, 0);

  return (
    <PageLayout title="SME Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-semibold">Overview</h2>
          <Link to="/sme/submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <PlusCircle className="w-4 h-4" /> Submit Invoice
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Invoices" value={total} icon={FileText} color="blue" />
          <StatCard title="Pending Verification" value={pending} icon={Clock} color="amber" />
          <StatCard title="Currently Funded" value={funded} icon={TrendingUp} color="emerald" />
          <StatCard title="Total Cash Received" value={formatPKR(totalValue)} icon={Wallet} color="purple" />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">My Invoices</h3>
            <Link to="/sme/invoices" className="text-blue-400 text-sm hover:text-blue-300">View all</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No invoices yet</p>
              <Link to="/sme/submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">Submit your first invoice</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="text-left px-5 py-3 font-medium">Invoice #</th>
                    <th className="text-left px-5 py-3 font-medium">Anchor Company</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="text-left px-5 py-3 font-medium">Due Date</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 8).map(inv => (
                    <tr key={inv._id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-5 py-3 text-white font-mono">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3 text-slate-300">{inv.anchorCompany}</td>
                      <td className="px-5 py-3 text-right text-white font-medium">{formatPKR(inv.amountPkr)}</td>
                      <td className="px-5 py-3 text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3">
                        <Link to={`/sme/invoices/${inv._id}`} className="text-blue-400 hover:text-blue-300 text-xs">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
