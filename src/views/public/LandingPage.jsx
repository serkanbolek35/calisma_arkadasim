import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PublicLayout from '../../components/layout/PublicLayout';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { currentUser, isOnboardingComplete, loading } = useAuth();
  const navigate = useNavigate();
  const [realStats, setRealStats] = useState({ users: '...', sessions: '...', matches: '...', surveys: '...' });

  useEffect(() => {
    if (loading) return;
    if (currentUser) {
      navigate(isOnboardingComplete ? '/dashboard' : '/onboarding', { replace: true });
    }
  }, [currentUser, isOnboardingComplete, loading]);

  useEffect(() => {
    // Gerçek istatistikleri çek
    Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'sessions')),
      getDocs(collection(db, 'matches')),
      getDocs(collection(db, 'surveys')),
    ]).then(([u, s, m, sv]) => {
      const completedSessions = s.docs.filter(d => d.data().status === 'completed').length;
      const activeMatches = m.docs.filter(d => d.data().status === 'active').length;
      setRealStats({
        users: u.size,
        sessions: completedSessions,
        matches: activeMatches,
        surveys: sv.size,
      });
    }).catch(() => {});
  }, []);

  if (loading || currentUser) return null;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(232,160,32,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(90,122,90,0.05) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5EDD8' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-8"
            style={{ background: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.25)', color: 'var(--amber)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Sadece .edu.tr e-posta ile üye olunur
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            <span className="text-cream">Çalışma Arkadaşını</span><br />
            <span style={{ color: 'var(--amber)' }}>Bul, Motivasyonunu</span><br />
            <span className="text-cream">Artır.</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--mist)' }}>
            Üniversite öğrencileri için akademik eşleştirme platformu.
            Kampüsündeki öğrencileri haritada gör, birlikte ilerle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link to="/kayit" className="btn-primary px-8 py-4 text-base group inline-flex items-center gap-2">
              Hemen Kayıt Ol
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/giris" className="btn-outline px-8 py-4 text-base">
              Giriş Yap
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[['🗺','Harita ile Eşleşme'],['⏱','Canlı Oturum'],['📊','İlerleme Takibi'],['🔒','KVKK Uyumlu']].map(([e,t]) => (
              <div key={t} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: 'rgba(245,237,216,0.06)', border: '1px solid rgba(245,237,216,0.12)', color: 'var(--cream)' }}>
                <span>{e}</span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y" style={{ borderColor: 'rgba(245,237,216,0.07)' }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            [realStats.users, 'Kayıtlı Öğrenci'],
            [realStats.sessions, 'Tamamlanan Oturum'],
            [realStats.matches, 'Aktif Eşleşme'],
            [realStats.surveys, 'Anket Dolduran'],
          ].map(([v,l]) => (
            <div key={l} className="text-center">
              <p className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--amber)' }}>{v}</p>
              <p className="text-sm" style={{ color: 'var(--mist)' }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Özellikler</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-cream">
            Birlikte çalışmak <span style={{ color: 'var(--amber)' }}>her şeyi değiştirir.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { e:'🗺', t:'Harita ile Eşleşme', d:'Kampüsündeki öğrencileri gerçek zamanlı haritada gör, uyumluluk puanına göre eşleş.' },
            { e:'⏱', t:'Canlı Kronometre', d:'Odak modunda zamanlayıcıyla çalış, her oturumdan sonra değerlendirme yap.' },
            { e:'📊', t:'İlerleme Grafikleri', d:'Haftalık ve aylık çalışma süreni, motivasyonunu ve verimlilik trendini takip et.' },
            { e:'🧠', t:'Motivasyon Anketi', d:'UCLA Yalnızlık Ölçeği ve akademik motivasyon anketleriyle kendini değerlendir.' },
            { e:'📋', t:'Oturum Planlama', d:'Eşleştiğin arkadaşınla birlikte oturum planla, yakınındakileri haritada bul.' },
            { e:'🔒', t:'Güvenli Platform', d:'Sadece .edu.tr e-posta. KVKK uyumlu veri işleme.' },
          ].map(({ e, t, d }) => (
            <div key={t} className="glass-card p-6 hover:border-white/20 transition-all">
              <div className="text-3xl mb-4">{e}</div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">{t}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mist)' }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(232,160,32,0.07) 0%, transparent 65%)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-cream mb-6 leading-tight">
            Bugün başla,<br />
            <span style={{ color: 'var(--amber)' }}>birlikte</span> ilerle.
          </h2>
          <p className="text-lg mb-10" style={{ color: 'var(--mist)' }}>Ücretsiz. Hızlı kayıt. Hemen başla.</p>
          <Link to="/kayit" className="btn-primary px-10 py-4 text-lg inline-flex items-center gap-2 group">
            Ücretsiz Kayıt Ol
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
