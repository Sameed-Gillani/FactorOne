import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import api from '../../lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirm('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Settings">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Profile Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Profile</h3>
          <div className="space-y-3 text-sm">
            {[
              ['Name', user?.name],
              ['Email', user?.email],
              ['Role', user?.role],
              ['Status', user?.status],
              ...(user?.role === 'sme' ? [['Business', user?.businessName], ['NTN', user?.ntn]] : []),
              ...(user?.role === 'investor' ? [['City', user?.city]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-medium capitalize">{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Change Password</h3>
          {message && <div className="mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 text-sm">{message}</div>}
          {error && <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleChangePassword} className="space-y-3">
            {[
              { label: 'Current Password', value: currentPassword, set: setCurrentPassword },
              { label: 'New Password', value: newPassword, set: setNewPassword },
              { label: 'Confirm New Password', value: confirm, set: setConfirm },
            ].map(f => (
              <div key={f.label}>
                <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                <input type="password" value={f.value} onChange={e => f.set(e.target.value)} required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
