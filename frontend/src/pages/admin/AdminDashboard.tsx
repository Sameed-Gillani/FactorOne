import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import api, { formatPKR, formatDate } from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLayout title="Admin Dashboard"><div className="p-8 text-center text-slate-400">Loading...</div></PageLayout>;

  return (
    <PageLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.users?.total || 0} icon={Users} color="blue" />
          <StatCard title="Pending Approval" value={stats?.invoices?.pending || 0} icon={Clock} color="amber" />
          <StatCard title="Total Invoices" value={stats?.invoices?.total || 0} icon={FileText} color="purple" />
          <StatCard title="Investment Volume" value={formatPKR(stats?.investments?.totalVolume || 0)} icon={TrendingUp} color="emerald" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Recent Invoices</h3>
              <Link to="/admin/invoices" className="text-blue-400 text-sm hover:text-blue-300">View all</Link>
            </div>
            <div className="divide-y divide-slate-700/50">
              {(stats?.recentInvoices || []).map((inv: any) => (
                <div key={inv._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-slate-400 text-xs">{inv.anchorCompany} · {formatPKR(inv.amountPkr)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.status} />
                    <Link to={`/admin/invoices/${inv._id}`} className="text-blue-400 text-xs hover:text-blue-300">Review →</Link>
                  </div>
                </div>
              ))}
              {(!stats?.recentInvoices?.length) && <p className="text-slate-400 text-sm text-center py-6">No invoices yet</p>}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Recent Users</h3>
              <Link to="/admin/users" className="text-blue-400 text-sm hover:text-blue-300">View all</Link>
            </div>
            <div className="divide-y divide-slate-700/50">
              {(stats?.recentUsers || []).map((u: any) => (
                <div key={u._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-slate-400 text-xs">{u.email} · {u.role}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
              {(!stats?.recentUsers?.length) && <p className="text-slate-400 text-sm text-center py-6">No users yet</p>}
            </div>
          </div>
        </div>

        {/* Invoice Status Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Invoice Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', count: stats?.invoices?.pending || 0, color: 'text-amber-400' },
              { label: 'Verified', count: stats?.invoices?.verified || 0, color: 'text-blue-400' },
              { label: 'Funded', count: stats?.invoices?.funded || 0, color: 'text-emerald-400' },
              { label: 'Rejected', count: stats?.invoices?.rejected || 0, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
