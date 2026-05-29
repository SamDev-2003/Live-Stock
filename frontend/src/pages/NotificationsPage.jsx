import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Bell, BellOff, CheckCheck, Beef, Pill, AlertTriangle, Stethoscope, Users, Info } from 'lucide-react';

const TYPE_ICON = {
  animal_issue: { icon: Beef, color: 'text-orange-500 bg-orange-50' },
  feeding_reminder: { icon: Pill, color: 'text-blue-500 bg-blue-50' },
  medicine_expiry: { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-50' },
  withdrawal_active: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  withdrawal_lifted: { icon: CheckCheck, color: 'text-green-500 bg-green-50' },
  treatment_record: { icon: Stethoscope, color: 'text-teal-500 bg-teal-50' },
  new_stakeholder: { icon: Users, color: 'text-purple-500 bg-purple-50' },
  inspection_alert: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  general: { icon: Info, color: 'text-gray-500 bg-gray-100' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () =>
    api.get('/notifications').then(r => setNotifications(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <BellOff size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_ICON[n.type] || TYPE_ICON.general;
            const Icon = cfg.icon;
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card p-4 flex gap-3 transition-all ${!n.isRead ? 'border-primary-200 bg-primary-50/30 cursor-pointer hover:shadow-sm' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-medium ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <div className={`text-sm mt-0.5 ${n.isRead ? 'text-gray-400' : 'text-gray-600'}`}>{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1.5">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
