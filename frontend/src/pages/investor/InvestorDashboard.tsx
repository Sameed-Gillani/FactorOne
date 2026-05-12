import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, BarChart3, ShoppingBag } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import api, { Investment, formatPKR, formatDate } from '../../lib/api';

export default function InvestorDashboard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/investments/my').then(res => {
      setInvestments(res.data.investments || []);
      setSummary(res.data.portfolioSummary?.grandTotal);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalInvested = summary?.totalInvested || 0;
  const totalReturn = summary?.totalExpectedReturn || 0;
  const activeCount = summary?.count || 0;

  return (
    <PageLayout title="Investor Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-semibold">Portfolio Overview</h2>
          <Link to="/investor/marketplace" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <ShoppingBag className="w-4 h-4" /> Browse Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Invested" value={formatPKR(totalInvested)} icon={DollarSign} color="blue" />
          <StatCard title="Active Investments" value={activeCount} icon={BarChart3} color="emerald" />
          <StatCard title="Total Expected Return" value={formatPKR(totalReturn)} icon={TrendingUp} color="purple" />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Active Investments</h3>
            <Link to="/investor/investments" className="text-blue-400 text-sm hover:text-blue-300">View all</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : investments.length === 0 ? (
            <div className="p-10 text-center">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No investments yet</p>
              <Link to="/investor/marketplace" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="text-left px-5 py-3 font-medium">Invoice</th>
                    <th className="text-right px-5 py-3 font-medium">Invested</th>
                    <th className="text-right px-5 py-3 font-medium">Expected Return</th>
                    <th className="text-left px-5 py-3 font-medium">Maturity</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.slice(0, 8).map(inv => {
                    const invoice = typeof inv.invoiceId === 'object' ? inv.invoiceId : null;
                    return (
                      <tr key={inv._id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="px-5 py-3 text-slate-300 font-mono text-xs">{invoice?.invoiceNumber || '—'}</td>
                        <td className="px-5 py-3 text-right text-white font-medium">{formatPKR(inv.amount)}</td>
                        <td className="px-5 py-3 text-right text-emerald-400 font-medium">+{formatPKR(inv.expectedReturn)}</td>
                        <td className="px-5 py-3 text-slate-400">{formatDate(inv.maturityDate)}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-700/30">
                    <td className="px-5 py-3 text-slate-300 font-semibold text-xs">TOTAL</td>
                    <td className="px-5 py-3 text-right text-white font-bold">{formatPKR(totalInvested)}</td>
                    <td className="px-5 py-3 text-right text-emerald-400 font-bold">+{formatPKR(totalReturn)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
