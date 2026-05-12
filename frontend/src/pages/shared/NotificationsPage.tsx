import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import api, { formatDate } from '../../lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data?.notifications || []))
      .catch(() => setNotifications([])).finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout title="Notifications">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">All Notifications</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {notifications.map((n: any) => (
                <div key={n._id} className={`px-5 py-4 ${!n.isRead ? 'bg-blue-500/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-slate-600'}`} />
                    <div>
                      <p className="text-white text-sm font-medium">{n.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{n.message}</p>
                      <p className="text-slate-500 text-xs mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
