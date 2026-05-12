import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import api, { Invoice, formatPKR, formatDate } from '../../lib/api';

export default function Marketplace() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');

  useEffect(() => {
    api.get('/invoices/marketplace').then(res => {
      const data = res.data.invoices || [];
      setInvoices(data);
      setFiltered(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = invoices;
    if (search) result = result.filter(i => i.anchorCompany.toLowerCase().includes(search.toLowerCase()) || i.invoiceNumber.toLowerCase().includes(search.toLowerCase()));
    if (sector) result = result.filter(i => i.sector === sector);
    setFiltered(result);
  }, [search, sector, invoices]);

  const daysLeft = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const creditColor = (score: string) => ({
    Good: 'text-emerald-400 bg-emerald-500/10', Average: 'text-amber-400 bg-amber-500/10', Poor: 'text-red-400 bg-red-500/10',
  }[score] || 'text-slate-400 bg-slate-700');

  return (
    <PageLayout title="Marketplace">
      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company or invoice number..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
            <option value="">All Sectors</option>
            <option>Textile</option><option>Logistics</option><option>IT Services</option>
            <option>FMCG</option><option>Manufacturing</option><option>Other</option>
          </select>
        </div>

        <p className="text-slate-400 text-sm">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''} available</p>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading marketplace...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p>No invoices found matching your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(inv => {
              const days = daysLeft(inv.dueDate);
              const remaining = inv.amountPkr - (inv.fundedAmount || 0);
              const pct = Math.round(((inv.fundedAmount || 0) / inv.amountPkr) * 100);
              return (
                <div key={inv._id} className="bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 flex flex-col gap-4 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-xs font-mono">{inv.invoiceNumber}</p>
                      <h3 className="text-white font-semibold mt-0.5">{inv.anchorCompany}</h3>
                      {inv.sector && <span className="text-xs text-slate-500">{inv.sector}</span>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${creditColor(inv.creditScore)}`}>{inv.creditScore}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900 rounded-lg p-2">
                      <p className="text-white font-bold text-sm">{formatPKR(inv.amountPkr)}</p>
                      <p className="text-slate-500 text-xs">Amount</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2">
                      <p className="text-emerald-400 font-bold text-sm">{inv.discountRate}%</p>
                      <p className="text-slate-500 text-xs">Yield</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2">
                      <p className="text-amber-400 font-bold text-sm">{days}d</p>
                      <p className="text-slate-500 text-xs">Left</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{pct}% funded</span>
                      <span>{formatPKR(remaining)} remaining</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <Link to={`/investor/invoices/${inv._id}`}
                    className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    View & Invest
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
