import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { Logo } from './PublicLayout';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth.service';

const NAV = [
  { emoji: '📊', label: 'Dashboard', to: '/dashboard' },
  { emoji: '🔍', label: 'Çalışma İstekleri', to: '/istekler' },
  { emoji: '💬', label: 'Sohbetler', to: '/sohbetler' },
  { emoji: '🤝', label: 'Eşleşmeler', to: '/eslesmeler' },
  { emoji: '⏱', label: 'Oturumlar', to: '/oturumlar' },
  { emoji: '📈', label: 'İlerleme', to: '/ilerleme' },
  { emoji: '🧠', label: 'Anket', to: '/anket' },
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

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ emoji, label, to }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentPage = NAV.find(n => location.pathname.startsWith(n.to));

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
        <header className="md:hidden px-4 py-4 border-b flex items-center gap-3"
          style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-1 text-cream/60">
            <Menu size={22} />
          </button>
          <p className="font-display text-lg font-semibold text-cream">
            {title || currentPage?.label || 'Çalışma'}
          </p>
        </header>
        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
