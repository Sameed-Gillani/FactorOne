import { useState, useEffect } from 'react';
import { CheckCircle, Ban } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api, { User, formatDate } from '../../lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    api.get('/admin/users').then(res => setUsers(res.data.data || []))
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const activate = async (id: string) => {
    try { await api.patch(`/admin/users/${id}/activate`); load(); } catch (e) {}
  };
  const block = async (id: string) => {
    try { await api.patch(`/admin/users/${id}/block`); load(); } catch (e) {}
  };

  const filtered = filter ? users.filter(u => u.role === filter || u.status === filter) : users;
  const nonAdmins = filtered.filter(u => u.role !== 'admin');

  return (
    <PageLayout title="User Management">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'active', 'blocked', 'sme', 'investor'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : nonAdmins.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Role</th>
                    <th className="text-left px-5 py-3 font-medium">Business / City</th>
                    <th className="text-left px-5 py-3 font-medium">Joined</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nonAdmins.map(u => (
                    <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-5 py-3 text-white font-medium">{u.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'sme' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{u.businessName || u.city || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {u.status !== 'active' && (
                            <button onClick={() => activate((u as any)._id || u.id)}
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Activate
                            </button>
                          )}
                          {u.status !== 'blocked' && (
                            <button onClick={() => block((u as any)._id || u.id)}
                              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium">
                              <Ban className="w-3.5 h-3.5" /> Block
                            </button>
                          )}
                        </div>
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
