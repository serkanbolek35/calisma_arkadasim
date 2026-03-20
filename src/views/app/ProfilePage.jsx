import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, BookOpen, MapPin, Award, ArrowLeft, Info, MessageSquare, Send } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUser } from '../../services/user.service';
import { getUserSessions } from '../../services/session.service';
import { getUserReviews, submitReview, hasReviewedSession } from '../../services/review.service';
import { calcBadges } from '../../utils/badges';
import { createStudyRequest } from '../../services/studyRequest.service';

const Stars = ({ value, max = 5, size = 14, interactive = false, onChange }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} size={size}
        onClick={() => interactive && onChange?.(i + 1)}
        style={{
          color: i < Math.round(value) ? '#E8A020' : 'rgba(245,237,216,0.2)',
          fill: i < Math.round(value) ? '#E8A020' : 'transparent',
          cursor: interactive ? 'pointer' : 'default',
        }} />
    ))}
  </div>
);

const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <Info size={12} style={{ color: 'var(--mist)', cursor: 'help' }} />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs z-50 w-56 text-center"
          style={{ background: 'rgba(20,20,20,0.97)', border: '1px solid rgba(245,237,216,0.12)', color: 'var(--mist)' }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'rgba(20,20,20,0.97)' }} />
        </div>
      )}
    </div>
  );
};

const AVATAR_COLORS = [
  ['rgba(232,160,32,0.2)', '#E8A020'],
  ['rgba(90,191,138,0.2)', '#5ABF8A'],
  ['rgba(100,149,237,0.2)', '#6495ED'],
  ['rgba(218,112,214,0.2)', '#DA70D6'],
  ['rgba(255,127,80,0.2)', '#FF7F50'],
];
const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const formatTime = (mins) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}s ${m > 0 ? m + 'dk' : ''}`.trim() : `${m}dk`;
};

export default function ProfilePage() {
  const { uid } = useParams();
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, partner: 0, totalMins: 0, avgFocus: 0, avgProd: 0 });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [reviewableSessions, setReviewableSessions] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const targetUid = uid || currentUser?.uid;
  const isOwnProfile = targetUid === currentUser?.uid;

  useEffect(() => {
    if (!targetUid) return;
    Promise.all([
      getUser(targetUid),
      getUserSessions(targetUid, 100),
      getUserReviews(targetUid),
    ]).then(async ([user, sessionList, reviewList]) => {
      setProfile(user);
      setReviews(reviewList);
      const completed = sessionList.filter(s => s.status === 'completed');
      const partnerSessions = completed.filter(s => s.partnerId);
      const totalMins = completed.reduce((s, x) => s + (x.durationMinutes || 0), 0);
      const rated = completed.filter(s => s.rating);
      const avgFocus = rated.length ? rated.reduce((s, x) => s + (x.rating?.focusLevel || 0), 0) / rated.length : 0;
      const avgProd = rated.length ? rated.reduce((s, x) => s + (x.rating?.productivity || 0), 0) / rated.length : 0;
      setStats({ total: completed.length, partner: partnerSessions.length, totalMins, avgFocus, avgProd });

      // Kendi profilim değilse: daha önce bu kullanıcıyı yorumlamış mıyım kontrol et
      if (!isOwnProfile && currentUser) {
        // Ortak oturum olmasa bile değerlendirme yapılabilsin
        // Daha önce bu kullanıcı için yorum yapıldı mı?
        const alreadyReviewed = reviewList.some(r => r.fromUserId === currentUser.uid);
        if (!alreadyReviewed) {
          // Dummy session id olarak match id kullan (ortak oturum olmasa da)
          setReviewableSessions([{ id: `manual_${currentUser.uid}_${targetUid}` }]);
        }
      }
    }).finally(() => setLoading(false));
  }, [targetUid]);

  const handleSubmitReview = async () => {
    if (!reviewableSessions.length) return;
    setSubmittingReview(true);
    try {
      await submitReview({
        fromUserId: currentUser.uid,
        fromName: userDoc?.displayName || 'Kullanıcı',
        toUserId: targetUid,
        sessionId: reviewableSessions[0].id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewDone(true);
      const updated = await getUserReviews(targetUid);
      setReviews(updated);
      setReviewableSessions([]);
    } catch (e) { console.error(e); }
    finally { setSubmittingReview(false); }
  };

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

  const [bgColor, textColor] = getAvatarColor(profile.displayName);
  const initial = profile.displayName?.charAt(0)?.toUpperCase() || '?';
  const subjects = profile.subjects || profile.preferences?.subjects || [];
  const reviewStats = {
    count: reviews.length,
    avg: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
  };
  const badges = calcBadges(stats, reviewStats);
  const avgRating = profile.avgRating ?? reviewStats.avg;
  const reviewCount = profile.reviewCount ?? reviewStats.count;

  return (
    <AppLayout title="Profil">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm w-fit" style={{ color: 'var(--mist)' }}>
            <ArrowLeft size={16} /> Geri
          </button>
        )}

        {/* ── Profil başlık ── */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
                style={{ background: bgColor, color: textColor }}>
                {initial}
              </div>
              {profile.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                  style={{ background: '#5ABF8A', borderColor: 'var(--ink)' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-cream">{profile.displayName || 'Kullanıcı'}</h1>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {profile.faculty && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}><Award size={11} /> {profile.faculty}</span>}
                {profile.campusName && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}><MapPin size={11} /> {profile.campusName}</span>}
                {profile.grade && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}><BookOpen size={11} /> {profile.grade}. Sınıf</span>}
              </div>
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-2.5">
                  <Stars value={avgRating} />
                  <span className="text-xs" style={{ color: 'var(--mist)' }}>
                    {avgRating.toFixed(1)} / 5 · {reviewCount} değerlendirme
                  </span>
                </div>
              )}
            </div>
          </div>

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
                  {requesting ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" /> : '📚 Çalışma İsteği Gönder'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── İstatistikler ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Oturum', value: stats.total || '—', icon: '📋', tooltip: 'Tamamlanan toplam çalışma oturumu sayısı.' },
            { label: 'Toplam Süre', value: formatTime(stats.totalMins), icon: '🕐', tooltip: 'Tüm oturumlarda geçirilen toplam çalışma süresi. Her oturum tamamlandığında güncellenir.' },
            { label: 'Odak Puanı', value: stats.avgFocus ? stats.avgFocus.toFixed(1) : '—', icon: '🎯', tooltip: 'Oturum sonrası "Odaklanma" değerlendirmelerinin ortalaması (1–5). Kullanıcı her oturum bitiminde kendini değerlendirir.' },
            { label: 'Verimlilik', value: stats.avgProd ? stats.avgProd.toFixed(1) : '—', icon: '⚡', tooltip: 'Oturum sonrası "Verimlilik" değerlendirmelerinin ortalaması (1–5). Tüm tamamlanan oturumların ortalamasıdır.' },
          ].map(({ label, value, icon, tooltip }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className="font-display text-xl font-bold text-cream">{value}</p>
              <Tooltip text={tooltip}>
                <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{label}</p>
              </Tooltip>
            </div>
          ))}
        </div>

        {/* ── Rozetler ── */}
        {badges.length > 0 && (
          <div className="glass-card p-5">
            <p className="section-label mb-3">Rozetler</p>
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <Tooltip key={b.id} text={b.desc}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.2)', color: 'var(--amber)' }}>
                    <span>{b.icon}</span>
                    <span className="text-xs font-medium">{b.label}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* ── Dersler ── */}
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

        {/* ── Değerlendirme yap ── */}
        {!isOwnProfile && reviewableSessions.length > 0 && !reviewDone && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} style={{ color: 'var(--amber)' }} />
              <p className="font-medium text-cream">Bu kullanıcıyı değerlendir</p>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--mist)' }}>
              Birlikte tamamladığınız oturum için değerlendirme yapabilirsin.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: 'var(--mist)' }}>Puan:</span>
                <Stars value={reviewRating} size={22} interactive onChange={setReviewRating} />
                <span className="text-sm font-mono" style={{ color: 'var(--amber)' }}>{reviewRating}/5</span>
              </div>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                placeholder="Çalışma deneyimini yaz... (isteğe bağlı)"
                rows={3} className="input-field resize-none text-sm"
                style={{ background: 'rgba(245,237,216,0.05)' }} />
              <button onClick={handleSubmitReview} disabled={submittingReview}
                className="btn-primary py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                {submittingReview
                  ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  : <><Send size={14} /> Değerlendirmeyi Gönder</>}
              </button>
            </div>
          </div>
        )}

        {reviewDone && !isOwnProfile && (
          <div className="glass-card p-4 flex items-center gap-3"
            style={{ border: '1px solid rgba(58,138,90,0.2)', background: 'rgba(58,138,90,0.05)' }}>
            <span style={{ color: '#5ABF8A' }}>✓</span>
            <p className="text-sm" style={{ color: '#5ABF8A' }}>Değerlendirmen kaydedildi, teşekkürler!</p>
          </div>
        )}

        {/* ── Yorumlar ── */}
        {reviews.length > 0 && (
          <div className="glass-card p-5">
            <p className="section-label mb-4">Değerlendirmeler ({reviews.length})</p>
            <div className="flex flex-col gap-3">
              {reviews.map(r => {
                const date = r.createdAt?.toDate?.() ?? new Date();
                return (
                  <div key={r.id} className="p-4 rounded-xl"
                    style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                          {r.fromName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-cream">{r.fromName || 'Kullanıcı'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} size={12} />
                        <span className="text-xs" style={{ color: 'var(--mist)' }}>
                          {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>{r.comment}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Profil bilgileri (kendi profili) ── */}
        {isOwnProfile && (
          <div className="glass-card p-5">
            <p className="section-label mb-3">Profil Bilgileri</p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--mist)' }}>
              <div className="flex justify-between"><span>Üniversite</span><span className="text-cream">Marmara Üniversitesi</span></div>
              {profile.faculty && <div className="flex justify-between"><span>Fakülte</span><span className="text-cream">{profile.faculty}</span></div>}
              {profile.department && <div className="flex justify-between"><span>Bölüm</span><span className="text-cream">{profile.department}</span></div>}
              {profile.grade && <div className="flex justify-between"><span>Sınıf</span><span className="text-cream">{profile.grade}. Sınıf</span></div>}
              {profile.campusName && <div className="flex justify-between"><span>Kampüs</span><span className="text-cream">{profile.campusName}</span></div>}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
