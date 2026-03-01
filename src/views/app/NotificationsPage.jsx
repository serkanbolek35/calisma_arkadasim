import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { listenNotifications, markAsRead, markAllAsRead } from '../../services/notification.service';

const TYPE_ICON = {
  match_request: '🤝',
  match_accepted: '✅',
  match_rejected: '❌',
  study_request: '📚',
  session_reminder: '⏰',
  chat_message: '💬',
};

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleClick = async (notif) => {
    if (!notif.read) await markAsRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() ?? new Date(ts);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout title="Bildirimler">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold text-cream flex items-center gap-2">
            <Bell size={20} style={{ color: 'var(--amber)' }} />
            Bildirimler
            {unreadCount > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full font-normal"
                style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{unreadCount}</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllAsRead(currentUser.uid)}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-all"
            style={{ color: 'var(--mist)', border: '1px solid rgba(245,237,216,0.1)' }}>
            <CheckCheck size={15} /> Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Bell size={40} className="mx-auto mb-4 opacity-30 text-cream" />
          <h3 className="font-display text-xl font-semibold text-cream mb-2">Bildirim yok</h3>
          <p className="text-sm" style={{ color: 'var(--mist)' }}>
            Eşleşme istekleri ve diğer aktiviteler burada görünecek.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(notif => (
            <button key={notif.id} onClick={() => handleClick(notif)}
              className="glass-card p-4 flex items-start gap-4 text-left w-full hover:border-white/15 transition-all relative overflow-hidden">
              {!notif.read && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                  style={{ background: 'var(--amber)' }} />
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: notif.read ? 'rgba(245,237,216,0.04)' : 'rgba(232,160,32,0.1)' }}>
                {TYPE_ICON[notif.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-cream">{notif.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{notif.body}</p>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(138,154,170,0.6)' }}>
                  {formatTime(notif.createdAt)}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{ background: 'var(--amber)' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
