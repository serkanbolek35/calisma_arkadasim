import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { Logo } from './PublicLayout';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth.service';
import { listenNotifications } from '../../services/notification.service';

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

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
        <Logo />
        {onClose && (
          <button onClick={onClose} className="p-1 text-cream/40 hover:text-cream md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Kullanıcı */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream truncate">{userDoc?.displayName || 'Kullanıcı'}</p>
            <p className="text-xs truncate" style={{ color: 'var(--mist)' }}>{currentUser?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ emoji, label, to }) => {
          const active = location.pathname === to || (to !== '/profil' && location.pathname.startsWith(to + '/'));
          return (
            <Link key={to} to={to} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(232,160,32,0.12)' : 'transparent',
                color: active ? 'var(--amber)' : 'var(--mist)',
                border: active ? '1px solid rgba(232,160,32,0.2)' : '1px solid transparent',
              }}>
              <span className="text-base">{emoji}</span>
              <span>{label}</span>
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
          <LogOut size={15} />
          {loggingOut ? 'Çıkılıyor...' : 'Çıkış Yap'}
        </button>
      </div>
    </div>
  );
};

const AppLayout = ({ children, title }) => {
  const { currentUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = NAV.find(n => location.pathname.startsWith(n.to));

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenNotifications(currentUser.uid, (notifs) => {
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 border-r fixed top-0 bottom-0 left-0"
        style={{ borderColor: 'rgba(245,237,216,0.07)', background: 'var(--ink)' }}>
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
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
        {/* Üst bar — hem mobil hem desktop */}
        <header className="px-4 md:px-6 py-3 border-b flex items-center gap-3"
          style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
          {/* Mobil hamburger */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-1 text-cream/60 flex-shrink-0">
            <Menu size={22} />
          </button>

          {/* Sayfa başlığı */}
          <p className="font-display text-lg font-semibold text-cream flex-1 truncate">
            {title || currentPage?.label || 'Çalışma'}
          </p>

          {/* Bildirim zili — sağ üst */}
          <button onClick={() => navigate('/bildirimler')}
            className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: location.pathname === '/bildirimler' ? 'rgba(232,160,32,0.15)' : 'rgba(245,237,216,0.06)',
              border: location.pathname === '/bildirimler' ? '1px solid rgba(232,160,32,0.3)' : '1px solid rgba(245,237,216,0.1)',
            }}>
            <Bell size={17} style={{ color: location.pathname === '/bildirimler' ? 'var(--amber)' : 'rgba(245,237,216,0.6)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'var(--amber)', color: 'var(--ink)', fontSize: '10px', minWidth: '18px', height: '18px', padding: '0 3px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
