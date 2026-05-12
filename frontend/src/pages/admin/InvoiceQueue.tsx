import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api, { Invoice, formatPKR, formatDate } from '../../lib/api';

export default function InvoiceQueue() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = (status = '') => {
    setLoading(true);
    const query = status ? `?status=${status}` : '';
    api.get(`/invoices/admin/all${query}`).then(res => setInvoices(res.data.invoices || []))
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <PageLayout title="Invoice Queue">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'verified', 'funded', 'rejected'].map(s => (
            <button key={s} onClick={() => { setFilter(s); load(s); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="text-left px-5 py-3 font-medium">Invoice #</th>
                    <th className="text-left px-5 py-3 font-medium">SME</th>
                    <th className="text-left px-5 py-3 font-medium">Anchor Company</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="text-left px-5 py-3 font-medium">Submitted</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const sme = typeof inv.smeId === 'object' ? inv.smeId : null;
                    return (
                      <tr key={inv._id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="px-5 py-3 text-white font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3 text-slate-300 text-xs">{sme?.businessName || sme?.name || '—'}</td>
                        <td className="px-5 py-3 text-slate-300">{inv.anchorCompany}</td>
                        <td className="px-5 py-3 text-right text-white font-medium">{formatPKR(inv.amountPkr)}</td>
                        <td className="px-5 py-3 text-slate-400">{formatDate(inv.createdAt)}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-3">
                          <Link to={`/admin/invoices/${inv._id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Review →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
