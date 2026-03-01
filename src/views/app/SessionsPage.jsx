import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, CheckCircle2, BookOpen, Clock, UserCheck } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserSessions, createSession, updateSessionStatus, addSessionRating } from '../../services/session.service';
import { getMatches } from '../../services/matching.service';
import { getUser, getUserPreferences } from '../../services/user.service';
import { serverTimestamp } from 'firebase/firestore';

// ── Timer ─────────────────────────────────────────────────────
const useTimer = () => {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const start = () => { setRunning(true); ref.current = setInterval(() => setSecs(s => s + 1), 1000); };
  const stop = () => { setRunning(false); clearInterval(ref.current); };
  const reset = () => { stop(); setSecs(0); };
  const fmt = () => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  return { secs, running, start, stop, reset, fmt };
};

// ── Rating Modal ──────────────────────────────────────────────
const RatingModal = ({ onSubmit, onSkip }) => {
  const [r, setR] = useState({ focusLevel: 3, stressLevel: 3, productivity: 3 });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>
        <h2 className="font-display text-2xl font-bold text-cream mb-2">Oturum Tamamlandı! 🎉</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>Bu oturumu değerlendir</p>
        {[['focusLevel', 'Odaklanma'], ['stressLevel', 'Stres Seviyesi'], ['productivity', 'Verimlilik']].map(([k, label]) => (
          <div key={k} className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-cream">{label}</span>
              <span className="text-sm font-mono" style={{ color: 'var(--amber)' }}>{r[k]}/5</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => setR(x => ({ ...x, [k]: v }))}
                  className="flex-1 h-8 rounded-lg text-sm font-mono font-bold transition-all"
                  style={{ background: r[k] >= v ? 'var(--amber)' : 'rgba(245,237,216,0.08)', color: r[k] >= v ? 'var(--ink)' : 'var(--mist)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSubmit(r)} className="btn-primary flex-1 py-3">Kaydet</button>
          <button onClick={onSkip} className="btn-outline flex-1 py-3">Atla</button>
        </div>
      </div>
    </div>
  );
};

// ── Oturum Planla Modal ───────────────────────────────────────
const PlanModal = ({ partner, subjects, onClose, onStart }) => {
  const [form, setForm] = useState({ subject: subjects[0] || 'Genel Çalışma', duration: 25 });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>

        {partner && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl"
            style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.15)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
              {partner.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-cream">{partner.displayName}</p>
              <p className="text-xs" style={{ color: 'var(--mist)' }}>ile birlikte oturum</p>
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-cream mb-5">
          {partner ? 'Birlikte Oturum Başlat' : 'Yalnız Çalışma Oturumu'}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Ders</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
              {subjects.map(s => <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Süre</label>
            <div className="flex gap-2">
              {[25, 45, 60, 90].map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, duration: d }))}
                  className="flex-1 py-2 rounded-xl text-sm font-mono transition-all"
                  style={{
                    background: form.duration === d ? 'var(--amber)' : 'rgba(245,237,216,0.06)',
                    color: form.duration === d ? 'var(--ink)' : 'var(--mist)',
                    border: form.duration === d ? 'none' : '1px solid rgba(245,237,216,0.1)',
                  }}>
                  {d}dk
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => onStart(form)} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
            <Play size={15} /> Başlat
          </button>
          <button onClick={onClose} className="btn-outline flex-1 py-3">İptal</button>
        </div>
      </div>
    </div>
  );
};

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function SessionsPage() {
  const { currentUser } = useAuth();
  const timer = useTimer();
  const [sessions, setSessions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showPlan, setShowPlan] = useState(false);
  const [planPartner, setPlanPartner] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [completedId, setCompletedId] = useState(null);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [sessionList, matches, prefs] = await Promise.all([
        getUserSessions(currentUser.uid, 30),
        getMatches(currentUser.uid),
        getUserPreferences(currentUser.uid),
      ]);
      setSessions(sessionList);
      setMySubjects(prefs?.subjects || []);

      // Aktif eşleşmelerin karşı taraf bilgilerini çek
      const activeMatches = matches.filter(m => m.status === 'active');
      const partnerList = await Promise.all(
        activeMatches.map(async (match) => {
          const partnerId = match.users?.find(id => id !== currentUser.uid);
          if (!partnerId) return null;
          const partnerDoc = await getUser(partnerId);
          if (!partnerDoc) return null;
          return {
            ...partnerDoc,
            matchId: match.id,
            commonSubjects: match.commonSubjects || [],
          };
        })
      );
      setPartners(partnerList.filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentUser]);

  const handleOpenPlan = (partner = null) => {
    setPlanPartner(partner);
    setShowPlan(true);
  };

  const handleStart = async (form) => {
    setShowPlan(false);
    const id = await createSession(currentUser.uid, {
      subject: form.subject,
      plannedDuration: form.duration,
      partnerId: planPartner?.uid || null,
      partnerName: planPartner?.displayName || null,
      status: 'active',
      startedAt: serverTimestamp(),
    });
    setActiveSession({ id, subject: form.subject, duration: form.duration, partner: planPartner });
    timer.reset();
    timer.start();
  };

  const handleStop = async () => {
    timer.stop();
    const mins = Math.floor(timer.secs / 60);
    await updateSessionStatus(activeSession.id, 'completed', {
      durationMinutes: mins,
      endedAt: serverTimestamp(),
    });
    setCompletedId(activeSession.id);
    setActiveSession(null);
    setShowRating(true);
    await loadData();
  };

  const handleRating = async (rating) => {
    if (completedId) await addSessionRating(completedId, currentUser.uid, rating);
    setShowRating(false);
    setCompletedId(null);
  };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const planSubjects = planPartner?.commonSubjects?.length > 0
    ? planPartner.commonSubjects
    : mySubjects.length > 0 ? mySubjects : ['Genel Çalışma'];

  return (
    <AppLayout title="Çalışma Oturumları">
      {showPlan && (
        <PlanModal
          partner={planPartner}
          subjects={planSubjects}
          onClose={() => { setShowPlan(false); setPlanPartner(null); }}
          onStart={handleStart}
        />
      )}
      {showRating && (
        <RatingModal
          onSubmit={handleRating}
          onSkip={() => { setShowRating(false); setCompletedId(null); }}
        />
      )}

      {/* ── Aktif oturum kronometre ── */}
      {activeSession && (
        <div className="mb-8 p-8 rounded-2xl text-center"
          style={{ background: 'linear-gradient(135deg,rgba(232,160,32,0.1) 0%,rgba(90,122,90,0.06) 100%)', border: '1px solid rgba(232,160,32,0.25)' }}>
          <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--amber)' }}>
            Aktif Oturum — {activeSession.subject}
          </p>
          {activeSession.partner && (
            <p className="text-xs mb-4" style={{ color: 'var(--mist)' }}>
              🤝 {activeSession.partner.displayName} ile birlikte
            </p>
          )}
          <div className="font-mono text-6xl font-bold text-cream my-6 tracking-tight">{timer.fmt()}</div>
          <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>Hedef: {activeSession.duration} dakika</p>
          <button onClick={handleStop}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all"
            style={{ background: 'rgba(200,64,64,0.15)', color: '#E87070', border: '1px solid rgba(200,64,64,0.3)' }}>
            <Square size={16} /> Oturumu Tamamla
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* ── Eşleşmelerim ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label mb-1">Eşleşmelerim</p>
                <h2 className="font-display text-xl font-semibold text-cream">
                  Birlikte çalışabileceğin kişiler
                </h2>
              </div>
              <button onClick={() => handleOpenPlan(null)}
                className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
                Yalnız Çalış
              </button>
            </div>

            {partners.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-display text-lg font-semibold text-cream mb-2">
                  Henüz aktif eşleşmen yok
                </h3>
                <p className="text-sm mb-5" style={{ color: 'var(--mist)' }}>
                  Eşleşmeler sayfasından birini bul ve oturum başlatabilirsin.
                </p>
                <a href="#/eslesmeler" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
                  Eşleşme Bul
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map((partner, i) => (
                  <div key={i} className="glass-card p-5 flex flex-col gap-4 hover:border-white/15 transition-all">
                    {/* Partner başlık */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                        style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                        {partner.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display font-semibold text-cream">{partner.displayName || 'Kullanıcı'}</p>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#5ABF8A' }} />
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--mist)' }}>
                          {partner.faculty || ''}{partner.faculty && partner.campusName ? ' · ' : ''}{partner.campusName || ''}
                        </p>
                      </div>
                    </div>

                    {/* Ortak dersler */}
                    {partner.commonSubjects?.length > 0 && (
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: 'var(--mist)' }}>Ortak dersler:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {partner.commonSubjects.slice(0, 4).map(s => (
                            <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(232,160,32,0.2)' }}>
                              {s}
                            </span>
                          ))}
                          {partner.commonSubjects.length > 4 && (
                            <span className="text-xs px-2 py-1" style={{ color: 'var(--mist)' }}>
                              +{partner.commonSubjects.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Birlikte oturum başlat */}
                    <button onClick={() => handleOpenPlan(partner)}
                      className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                      <Play size={15} /> Birlikte Oturum Başlat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Oturum Geçmişi ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label mb-1">Geçmiş</p>
                <h2 className="font-display text-xl font-semibold text-cream">
                  Tamamlanan Oturumlar
                  {completedSessions.length > 0 && (
                    <span className="ml-2 text-sm font-body font-normal" style={{ color: 'var(--mist)' }}>
                      ({completedSessions.length})
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {completedSessions.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="font-display text-lg font-semibold text-cream mb-2">Henüz tamamlanan oturum yok</p>
                <p className="text-sm" style={{ color: 'var(--mist)' }}>
                  Bir eşleşmenle oturum başlatınca burada görünecek.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {completedSessions.map((s, i) => {
                  const date = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
                  const isPartner = !!s.partnerName;
                  return (
                    <div key={i} className="glass-card p-4 flex items-center gap-4 hover:border-white/15 transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isPartner ? 'rgba(58,138,90,0.15)' : 'rgba(232,160,32,0.1)' }}>
                        {isPartner
                          ? <UserCheck size={18} style={{ color: '#5ABF8A' }} />
                          : <CheckCircle2 size={18} style={{ color: 'var(--amber)' }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cream">{s.subject || 'Genel Çalışma'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
                          {isPartner ? `🤝 ${s.partnerName} ile · ` : ''}
                          {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {s.durationMinutes > 0 && (
                          <p className="text-sm font-mono font-bold text-cream">{s.durationMinutes}dk</p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: isPartner ? '#5ABF8A' : 'var(--amber)' }}>
                          {isPartner ? 'Ortak' : 'Bireysel'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </AppLayout>
  );
}
