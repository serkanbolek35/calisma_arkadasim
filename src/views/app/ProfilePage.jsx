import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, BookOpen, MapPin, Award, Clock, ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUser } from '../../services/user.service';
import { getUserSessions } from '../../services/session.service';
import { createStudyRequest } from '../../services/studyRequest.service';

const StarRating = ({ value, max = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} size={14}
        style={{ color: i < Math.round(value) ? '#E8A020' : 'rgba(245,237,216,0.2)',
          fill: i < Math.round(value) ? '#E8A020' : 'transparent' }} />
    ))}
  </div>
);

export default function ProfilePage() {
  const { uid } = useParams();
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ sessions: 0, totalMins: 0, avgFocus: 0, avgProductivity: 0 });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const targetUid = uid || currentUser?.uid;
  const isOwnProfile = targetUid === currentUser?.uid;

  useEffect(() => {
    if (!targetUid) return;
    Promise.all([
      getUser(targetUid),
      getUserSessions(targetUid, 50),
    ]).then(([user, sessions]) => {
      setProfile(user);
      const completed = sessions.filter(s => s.status === 'completed');
      const rated = completed.filter(s => s.rating);
      const totalMins = completed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const avgFocus = rated.length ? rated.reduce((s, x) => s + (x.rating?.focusLevel || 0), 0) / rated.length : 0;
      const avgProd = rated.length ? rated.reduce((s, x) => s + (x.rating?.productivity || 0), 0) / rated.length : 0;
      setStats({ sessions: completed.length, totalMins, avgFocus, avgProductivity: avgProd });
    }).finally(() => setLoading(false));
  }, [targetUid]);

  const handleSendRequest = async () => {
    if (!profile) return;
    setRequesting(true);
    try {
      await createStudyRequest(currentUser.uid, {
        displayName: userDoc?.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
        subject: (profile.subjects || [])[0] || 'Genel Çalışma',
        location: profile.campusName || 'Göztepe Kampüsü',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: '14:00–16:00',
        note: `${profile.displayName} ile çalışmak istiyorum`,
        toUserId: targetUid,
      });
      setRequested(true);
    } catch (e) { console.error(e); }
    finally { setRequesting(false); }
  };

  if (loading) return (
    <AppLayout title="Profil">
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout title="Profil">
      <div className="glass-card p-16 text-center">
        <p className="text-4xl mb-4">👤</p>
        <p className="font-display text-xl font-semibold text-cream">Kullanıcı bulunamadı</p>
      </div>
    </AppLayout>
  );

  const initial = profile.displayName?.charAt(0)?.toUpperCase() || '?';
  const subjects = profile.subjects || profile.preferences?.subjects || [];

  return (
    <AppLayout title="Profil">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Geri butonu (başka profil ise) */}
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm w-fit"
            style={{ color: 'var(--mist)' }}>
            <ArrowLeft size={16} /> Geri
          </button>
        )}

        {/* Profil başlık */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
              style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-cream">{profile.displayName || 'Kullanıcı'}</h1>
              <div className="flex flex-wrap gap-3 mt-2">
                {profile.faculty && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                    <Award size={12} /> {profile.faculty}
                  </span>
                )}
                {profile.campusName && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                    <MapPin size={12} /> {profile.campusName}
                  </span>
                )}
                {profile.grade && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                    <BookOpen size={12} /> {profile.grade}. Sınıf
                  </span>
                )}
              </div>
              {/* Puan */}
              {stats.avgFocus > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating value={stats.avgFocus} />
                  <span className="text-xs" style={{ color: 'var(--mist)' }}>
                    {stats.avgFocus.toFixed(1)} / 5 odak puanı
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* İstek gönder butonu */}
          {!isOwnProfile && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: 'rgba(245,237,216,0.08)' }}>
              {requested ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(58,138,90,0.1)', color: '#5ABF8A', border: '1px solid rgba(58,138,90,0.2)' }}>
                  ✓ Çalışma isteği gönderildi
                </div>
              ) : (
                <button onClick={handleSendRequest} disabled={requesting}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {requesting
                    ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    : '📚 Çalışma İsteği Gönder'
                  }
                </button>
              )}
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Oturum', value: stats.sessions || '—', icon: '⏱' },
            { label: 'Toplam Süre', value: stats.totalMins ? `${Math.floor(stats.totalMins/60)}s ${stats.totalMins%60}dk` : '—', icon: '🕐' },
            { label: 'Odak Puanı', value: stats.avgFocus ? stats.avgFocus.toFixed(1) : '—', icon: '🎯' },
            { label: 'Verimlilik', value: stats.avgProductivity ? stats.avgProductivity.toFixed(1) : '—', icon: '⚡' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className="font-display text-xl font-bold text-cream">{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Dersler */}
        {subjects.length > 0 && (
          <div className="glass-card p-5">
            <p className="section-label mb-3">Çalıştığı Dersler</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <span key={s} className="text-sm px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(232,160,32,0.2)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Profil düzenleme linki (kendi profili) */}
        {isOwnProfile && (
          <div className="glass-card p-5">
            <p className="section-label mb-3">Profil Bilgileri</p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--mist)' }}>
              <div className="flex justify-between">
                <span>Üniversite</span>
                <span className="text-cream">Marmara Üniversitesi</span>
              </div>
              {profile.faculty && (
                <div className="flex justify-between">
                  <span>Fakülte</span>
                  <span className="text-cream">{profile.faculty}</span>
                </div>
              )}
              {profile.department && (
                <div className="flex justify-between">
                  <span>Bölüm</span>
                  <span className="text-cream">{profile.department}</span>
                </div>
              )}
              {profile.grade && (
                <div className="flex justify-between">
                  <span>Sınıf</span>
                  <span className="text-cream">{profile.grade}. Sınıf</span>
                </div>
              )}
              {profile.campusName && (
                <div className="flex justify-between">
                  <span>Kampüs</span>
                  <span className="text-cream">{profile.campusName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
