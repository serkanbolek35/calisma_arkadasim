import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5 group">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ background: 'var(--amber)' }}>
      <BookOpen size={16} color="var(--ink)" strokeWidth={2.5} />
    </div>
    <span className="font-display font-semibold text-cream text-lg tracking-tight">
      Çalışma<span style={{ color: 'var(--amber)' }}>.</span>
    </span>
  </Link>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const links = [
    { to: '/nasil-calisir', label: 'Nasıl Çalışır?' },
    { to: '/hakkimizda', label: 'Hakkımızda' },
    { to: '/sss', label: 'SSS' },
    { to: '/iletisim', label: 'İletişim' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        padding: scrolled ? '12px 0' : '20px 0',
        background: scrolled ? 'rgba(13,13,13,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(245,237,216,0.08)' : 'none',
      }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-sm font-body font-medium transition-colors"
              style={{ color: location.pathname === l.to ? 'var(--amber)' : 'var(--mist)' }}
              onMouseEnter={e => e.target.style.color = 'var(--cream)'}
              onMouseLeave={e => e.target.style.color = location.pathname === l.to ? 'var(--amber)' : 'var(--mist)'}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {currentUser
            ? <Link to="/dashboard" className="btn-primary text-sm px-5 py-2.5">Dashboard</Link>
            : <>
                <Link to="/giris" className="btn-outline text-sm px-5 py-2.5">Giriş Yap</Link>
                <Link to="/kayit" className="btn-primary text-sm px-5 py-2.5">Kayıt Ol</Link>
              </>
          }
        </div>
        <button className="md:hidden text-cream p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 py-6 px-6 flex flex-col gap-4"
          style={{ background: 'rgba(13,13,13,0.98)', borderBottom: '1px solid rgba(245,237,216,0.08)' }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-base font-body py-1"
              style={{ color: location.pathname === l.to ? 'var(--amber)' : 'var(--cream)' }}>
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: 'rgba(245,237,216,0.1)' }}>
            {currentUser
              ? <Link to="/dashboard" className="btn-primary text-center">Dashboard</Link>
              : <>
                  <Link to="/giris" className="btn-outline text-center">Giriş Yap</Link>
                  <Link to="/kayit" className="btn-primary text-center">Kayıt Ol</Link>
                </>
            }
          </div>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="border-t py-12" style={{ borderColor: 'rgba(245,237,216,0.08)' }}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: 'var(--mist)' }}>
            Üniversite öğrencileri için akademik eşleştirme platformu.
          </p>
        </div>
        <div>
          <h4 className="section-label mb-4">Platform</h4>
          <div className="flex flex-col gap-2">
            {[['Nasıl Çalışır?','/nasil-calisir'],['Hakkımızda','/hakkimizda'],['SSS','/sss'],['İletişim','/iletisim']].map(([l,h]) => (
              <Link key={h} to={h} className="text-sm transition-colors" style={{ color: 'var(--mist)' }}
                onMouseEnter={e=>e.target.style.color='var(--cream)'}
                onMouseLeave={e=>e.target.style.color='var(--mist)'}>{l}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="section-label mb-4">Hukuki</h4>
          <div className="flex flex-col gap-2">
            {[['Gizlilik','/gizlilik'],['KVKK','/kvkk'],['Kullanım Şartları','/kullanim-sartlari']].map(([l,h]) => (
              <Link key={h} to={h} className="text-sm transition-colors" style={{ color: 'var(--mist)' }}
                onMouseEnter={e=>e.target.style.color='var(--cream)'}
                onMouseLeave={e=>e.target.style.color='var(--mist)'}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4 border-t"
        style={{ borderColor: 'rgba(245,237,216,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(138,154,170,0.5)' }}>© 2024 Çalışma Arkadaşını Bul.</p>
        <p className="text-xs" style={{ color: 'rgba(138,154,170,0.4)' }}>Sadece .edu.tr e-posta ile</p>
      </div>
    </div>
  </footer>
);

const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-ink flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default PublicLayout;
