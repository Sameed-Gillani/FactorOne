import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api, { Investment, formatPKR, formatDate } from '../../lib/api';

export default function MyInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/investments/my').then(res => {
      setInvestments(res.data.investments || []);
      setSummary(res.data.portfolioSummary?.grandTotal);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout title="My Investments">
      <div className="space-y-5">
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Invested', value: formatPKR(summary.totalInvested || 0), color: 'text-blue-400' },
              { label: 'Expected Returns', value: formatPKR(summary.totalExpectedReturn || 0), color: 'text-emerald-400' },
              { label: 'Total Transactions', value: summary.count || 0, color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Investment History</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : investments.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No investments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="text-left px-5 py-3 font-medium">Invoice</th>
                    <th className="text-left px-5 py-3 font-medium">Company</th>
                    <th className="text-right px-5 py-3 font-medium">Invested</th>
                    <th className="text-right px-5 py-3 font-medium">Expected Return</th>
                    <th className="text-left px-5 py-3 font-medium">Maturity</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => {
                    const invoice = typeof inv.invoiceId === 'object' ? inv.invoiceId : null;
                    return (
                      <tr key={inv._id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="px-5 py-3 text-slate-300 font-mono text-xs">{invoice?.invoiceNumber || '—'}</td>
                        <td className="px-5 py-3 text-slate-300">{invoice?.anchorCompany || '—'}</td>
                        <td className="px-5 py-3 text-right text-white font-medium">{formatPKR(inv.amount)}</td>
                        <td className="px-5 py-3 text-right text-emerald-400 font-medium">+{formatPKR(inv.expectedReturn)}</td>
                        <td className="px-5 py-3 text-slate-400">{formatDate(inv.maturityDate)}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
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
