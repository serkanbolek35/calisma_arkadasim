import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Bell, Trash2 } from 'lucide-react';
import { Logo } from './PublicLayout';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth.service';
import { listenNotifications, markAllRead, markAsRead } from '../../services/notification.service';

const NAV = [
  { emoji: '📊', label: 'Dashboard', to: '/dashboard' },
  { emoji: '🔍', label: 'Çalışma İstekleri', to: '/istekler' },
  { emoji: '💬', label: 'Sohbetler', to: '/sohbetler' },
  { emoji: '🤝', label: 'Eşleşmeler', to: '/eslesmeler' },
  { emoji: '⏱', label: 'Oturumlar', to: '/oturumlar' },
  { emoji: '📈', label: 'İlerleme', to: '/ilerleme' },
  { emoji: '🧠', label: 'Anket', to: '/anket' },
  { emoji: '👤', label: 'Profilim', to: '/profil' },
];

const Sidebar = ({ onClose }) => {
  const { currentUser, userDoc } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const initial = (userDoc?.displayName || currentUser?.email || '?').charAt(0).toUpperCase();
  const handleLogout = async () => { setLoggingOut(true); await logoutUser(); navigate('/'); };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
        <Logo />
        {onClose && <button onClick={onClose} className="p-1 text-cream/40 hover:text-cream md:hidden"><X size={18} /></button>}
      </div>
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{initial}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream truncate">{userDoc?.displayName || 'Kullanıcı'}</p>
            <p className="text-xs truncate" style={{ color: 'var(--mist)' }}>{currentUser?.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ emoji, label, to }) => {
          const active = location.pathname === to || (to !== '/profil' && location.pathname.startsWith(to + '/'));
          return (
            <Link key={to} to={to} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: active ? 'rgba(232,160,32,0.12)' : 'transparent', color: active ? 'var(--amber)' : 'var(--mist)', border: active ? '1px solid rgba(232,160,32,0.2)' : '1px solid transparent' }}>
              <span className="text-base">{emoji}</span><span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5 pt-3 border-t" style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
        <button onClick={handleLogout} disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: 'var(--mist)', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,64,64,0.08)'; e.currentTarget.style.color = '#E87070'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--mist)'; }}>
          <LogOut size={15} />{loggingOut ? 'Çıkılıyor...' : 'Çıkış Yap'}
        </button>
      </div>
    </div>
  );
};

// ── Bildirim Dropdown ─────────────────────────────────────────
const NotificationDropdown = ({ notifications, unreadCount, onClose, userId }) => {
  const navigate = useNavigate();

  const handleClick = async (notif) => {
    await markAsRead(notif.id);
    onClose();
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAll = async () => { await markAllRead(userId); };

  const typeIcon = (type) => {
    if (type === 'match_request') return '🤝';
    if (type === 'match_accepted') return '✅';
    if (type === 'match_rejected') return '❌';
    return '🔔';
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() ?? new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{
      position: 'absolute', top: '48px', right: '0', width: '320px', maxHeight: '420px',
      background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)',
      borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 99999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Başlık */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(245,237,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--cream)', fontSize: '15px' }}>Bildirimler</span>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} style={{ fontSize: '12px', color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Tümünü oku
          </button>
        )}
      </div>

      {/* Liste */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--mist)', fontSize: '13px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
            Henüz bildirim yok
          </div>
        ) : (
          notifications.slice(0, 20).map(n => (
            <button key={n.id} onClick={() => handleClick(n)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 16px', textAlign: 'left', background: n.read ? 'transparent' : 'rgba(232,160,32,0.06)',
                borderBottom: '1px solid rgba(245,237,216,0.05)', cursor: 'pointer', border: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,237,216,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(232,160,32,0.06)'}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{typeIcon(n.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: n.read ? '400' : '600', color: 'var(--cream)', marginBottom: '2px' }}>{n.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.4' }}>{n.body}</p>
                <p style={{ fontSize: '11px', color: 'rgba(138,154,170,0.6)', marginTop: '4px' }}>{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: '5px' }} />}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const AppLayout = ({ children, title }) => {
  const { currentUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = NAV.find(n => location.pathname.startsWith(n.to));

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser]);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-ink flex">
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 border-r fixed top-0 bottom-0 left-0"
        style={{ borderColor: 'rgba(245,237,216,0.07)', background: 'var(--ink)' }}>
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 border-r"
            style={{ background: 'var(--ink-50)', borderColor: 'rgba(245,237,216,0.1)', zIndex: 10 }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        <header className="px-4 md:px-6 py-3 border-b flex items-center gap-3"
          style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-1 text-cream/60 flex-shrink-0">
            <Menu size={22} />
          </button>
          <p className="font-display text-lg font-semibold text-cream flex-1 truncate">
            {title || currentPage?.label || 'Çalışma'}
          </p>

          {/* Bildirim zili — dropdown */}
          <div ref={bellRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowNotifs(v => !v)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: showNotifs ? 'rgba(232,160,32,0.15)' : 'rgba(245,237,216,0.06)',
                border: showNotifs ? '1px solid rgba(232,160,32,0.3)' : '1px solid rgba(245,237,216,0.1)',
              }}>
              <Bell size={17} style={{ color: showNotifs ? 'var(--amber)' : 'rgba(245,237,216,0.6)' }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center font-bold"
                  style={{ background: 'var(--amber)', color: 'var(--ink)', fontSize: '10px', minWidth: '18px', height: '18px', padding: '0 3px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                userId={currentUser?.uid}
                onClose={() => setShowNotifs(false)}
              />
            )}
          </div>
        </header>

        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
