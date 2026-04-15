import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, CheckCircle2, UserCheck, KeyRound, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserSessions, createSession, updateSessionStatus, addSessionRating, writeLog, enrichSessionsForViewer } from '../../services/session.service';
import { createCoSessionRequest, joinWithCode, listenCoSession, endCoSession } from '../../services/coSession.service';
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
  return { secs, running, start, stop, reset, fmt, setSecs };
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

const CO_MEETING_PLACES = ['Kütüphane', 'Merkez Kütüphane', 'Kafeterya', 'Öğrenci Merkezi', 'Sınıf / Derslik', 'Çevrimiçi (Zoom/Meet)', 'Diğer'];

// ── Eş Zamanlı Oturum Modalı ──────────────────────────────────
const CoSessionModal = ({ partner, subject, currentUser, userDoc, onClose, onSessionStarted }) => {
  const [phase, setPhase] = useState('invite'); // invite | waiting | code_entry | active
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [coSessionId, setCoSessionId] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [bulusmaYeri, setBulusmaYeri] = useState(() => {
    const c = userDoc?.campusName?.trim();
    if (c) return c;
    return 'Kütüphane';
  });
  const unsubRef = useRef(null);

  const handleSendInvite = async () => {
    setSending(true);
    try {
      // Her iki ismi de Firestore'dan çek (cache sorununu önler)
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      const [mySnap, partnerSnap] = await Promise.all([
        getDoc(doc(db, 'users', currentUser.uid)),
        getDoc(doc(db, 'users', partner.uid)),
      ]);
      const myName = mySnap.data()?.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı';
      const partnerRealName = partnerSnap.data()?.displayName || partner.displayName || 'Kullanıcı';
      const result = await createCoSessionRequest({
        initiatorId: currentUser.uid,
        initiatorName: myName,
        partnerId: partner.uid,
        partnerName: partnerRealName,
        subject,
        bulusmaYeri: bulusmaYeri || null,
      });
      setCode(result.code);
      setCoSessionId(result.id);
      setPhase('waiting');

      // Oturumu dinle
      unsubRef.current = listenCoSession(result.id, (session) => {
        if (session.status === 'active') {
          setPhase('active');
          onSessionStarted(result.id, session);
        }
      });
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  // partner kodu ayrı modaldan (CodeEntryModal) girer

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>

        {phase === 'invite' && (
          <>
            <h2 className="font-display text-xl font-bold text-cream mb-2">Eş Zamanlı Oturum</h2>
            <div className="flex items-center gap-3 p-3 rounded-xl mb-6"
              style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.15)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
                {partner.displayName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-cream">{partner.displayName}</p>
                <p className="text-xs" style={{ color: 'var(--mist)' }}>{subject}</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--mist)' }}>
              Davet gönderilir ve her ikinize 6 haneli bir kod verilir. İkisinin de kodu girmesi ile oturum başlar.
            </p>
            <div className="mb-5">
              <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Buluşma yeri</label>
              <select value={bulusmaYeri} onChange={e => setBulusmaYeri(e.target.value)}
                className="input-field w-full" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
                {userDoc?.campusName?.trim() && !CO_MEETING_PLACES.includes(userDoc.campusName.trim()) && (
                  <option value={userDoc.campusName.trim()} style={{ background: '#1A1A1A' }}>Profil: {userDoc.campusName.trim()}</option>
                )}
                {CO_MEETING_PLACES.map(y => (
                  <option key={y} value={y} style={{ background: '#1A1A1A' }}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSendInvite} disabled={sending} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                {sending ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" /> : <><Users size={15} /> Davet Gönder</>}
              </button>
              <button onClick={onClose} className="btn-outline flex-1 py-3">İptal</button>
            </div>
          </>
        )}

        {phase === 'waiting' && (
          <>
            <h2 className="font-display text-xl font-bold text-cream mb-4">Kod ile Bağlan</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--mist)' }}>Senin kodun (partnera iletildi):</p>
            <div className="text-center py-6 rounded-2xl mb-4"
              style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)' }}>
              <p className="font-mono text-5xl font-bold tracking-widest" style={{ color: 'var(--amber)' }}>{code}</p>
            </div>
            <p className="text-xs mb-4 text-center" style={{ color: 'var(--mist)' }}>
              {partner.displayName} kodu girince oturum otomatik başlar
            </p>
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--amber)' }} />
              <span className="text-sm" style={{ color: 'var(--mist)' }}>Bekleniyor...</span>
            </div>
            <button onClick={onClose} className="btn-outline w-full py-2.5 mt-4 text-sm">İptal</button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Kod Giriş Modalı (partner için) ──────────────────────────
const CodeEntryModal = ({ currentUser, userDoc, onClose, onSessionStarted }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setError('');
    if (code.length !== 6) { setError('6 haneli kodu girin'); return; }
    setLoading(true);
    try {
      const result = await joinWithCode(code, currentUser.uid);
      if (result.error) { setError(result.error); setLoading(false); return; }
      // Oturum aktif oldu, direkt başlat
      onSessionStarted(result.id, { ...result.data, status: 'active' });
    } catch (e) { setError('Bir hata oluştu'); console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>
        <h2 className="font-display text-xl font-bold text-cream mb-2">Kodu Gir</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>
          Çalışma arkadaşının sana ilettiği 6 haneli kodu gir.
        </p>
        <input
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000" maxLength={6}
          className="input-field text-center text-3xl font-mono tracking-widest mb-3"
          style={{ background: 'rgba(245,237,216,0.06)', letterSpacing: '0.3em' }} />
        {error && <p className="text-xs mb-3" style={{ color: '#E87070' }}>{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleJoin} disabled={loading || code.length !== 6}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
            {loading ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" /> : <><KeyRound size={15} /> Katıl</>}
          </button>
          <button onClick={onClose} className="btn-outline flex-1 py-3">İptal</button>
        </div>
      </div>
    </div>
  );
};

// ── Plan Modal (yalnız çalışma için) ─────────────────────────
const PlanModal = ({ subjects, onClose, onStart }) => {
  const [form, setForm] = useState({ subject: subjects[0] || 'Genel Çalışma', duration: 25, bulusmaYeri: 'Kütüphane' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>
        <h2 className="font-display text-xl font-bold text-cream mb-5">Yalnız Çalışma Oturumu</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Ders</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
              {subjects.map(s => <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Buluşma Yeri</label>
            <select value={form.bulusmaYeri} onChange={e => setForm(f => ({ ...f, bulusmaYeri: e.target.value }))}
              className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
              {['Kütüphane', 'Merkez Kütüphane', 'Kafeterya', 'Öğrenci Merkezi', 'Sınıf / Derslik', 'Çevrimiçi (Zoom/Meet)', 'Diğer'].map(y => (
                <option key={y} value={y} style={{ background: '#1A1A1A' }}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Süre</label>
            <div className="flex gap-2">
              {[25, 45, 60, 90].map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, duration: d }))}
                  className="flex-1 py-2 rounded-xl text-sm font-mono transition-all"
                  style={{ background: form.duration === d ? 'var(--amber)' : 'rgba(245,237,216,0.06)', color: form.duration === d ? 'var(--ink)' : 'var(--mist)', border: form.duration === d ? 'none' : '1px solid rgba(245,237,216,0.1)' }}>
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
  const { currentUser, userDoc } = useAuth();
  const location = useLocation();
  const timer = useTimer();
  const [sessions, setSessions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showPlan, setShowPlan] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [completedId, setCompletedId] = useState(null);
  const [showCoSession, setShowCoSession] = useState(null); // partner objesi
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const coSessionUnsubRef = useRef(null);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [sessionList, matches, prefs] = await Promise.all([
        getUserSessions(currentUser.uid, 30),
        getMatches(currentUser.uid),
        getUserPreferences(currentUser.uid),
      ]);

      // Ortak oturumda partnerId alanı davet edilen kişiyi tutuyor; katılan tarafta "ben" olduğu için isim çözümü participants üzerinden
      const fixedSessions = await enrichSessionsForViewer(currentUser.uid, sessionList);

      setSessions(fixedSessions);
      setMySubjects(prefs?.subjects?.length > 0 ? prefs.subjects : ['Genel Çalışma']);
      const activeMatches = matches.filter(m => m.status === 'active');
      const partnerList = await Promise.all(
        activeMatches.map(async (match) => {
          const partnerId = match.users?.find(id => id !== currentUser.uid);
          if (!partnerId) return null;
          const partnerDoc = await getUser(partnerId);
          if (!partnerDoc) return null;
          return { ...partnerDoc, matchId: match.id, commonSubjects: match.commonSubjects || [] };
        })
      );
      setPartners(partnerList.filter(Boolean));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    if (currentUser) restoreActiveCoSession();
  }, [currentUser]);

  // Cleanup coSession listener on unmount
  useEffect(() => {
    return () => { if (coSessionUnsubRef.current) coSessionUnsubRef.current(); };
  }, []);

  // Sayfa yenilenince aktif coSession'ı Firestore'dan yükle
  const restoreActiveCoSession = async () => {
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      // Bu kullanıcının aktif coSession'ı var mı?
      const snap = await getDocs(collection(db, 'coSessions'));
      const active = snap.docs.find(d => {
        const cs = d.data();
        return cs.status === 'active' &&
          (cs.initiatorId === currentUser.uid || cs.partnerId === currentUser.uid);
      });
      if (!active) return;
      const cs = active.data();
      const isInitiator = cs.initiatorId === currentUser.uid;
      const partnerId = isInitiator ? cs.partnerId : cs.initiatorId;
      const partnerName = isInitiator ? cs.partnerName : cs.initiatorName;

      // Başlangıç zamanından geçen süreyi hesapla
      const startedAt = cs.startedAt?.toDate?.() ?? new Date();
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);

      setActiveSession({
        id: cs.sessionId || null,
        subject: cs.subject || 'Genel Çalışma',
        duration: 60,
        partner: { uid: partnerId, displayName: partnerName },
        coSessionId: active.id,
        bulusmaYeri: cs.bulusmaYeri || null,
      });

      // Timer'ı geçen süreyle başlat
      timer.reset();
      timer.setSecs(elapsed);
      timer.start();

      // coSession listener kur
      if (coSessionUnsubRef.current) coSessionUnsubRef.current();
      coSessionUnsubRef.current = listenCoSession(active.id, async (csData) => {
        if (csData.status === 'ended') {
          coSessionUnsubRef.current?.();
          coSessionUnsubRef.current = null;
          timer.stop();
          const mins = csData.durationMinutes || Math.floor(elapsed / 60);
          const sid = csData.sessionId;
          if (sid) {
            await updateSessionStatus(sid, 'completed', {
              durationMinutes: mins,
              endedAt: serverTimestamp(),
            });
            setCompletedId(sid);
          }
          setActiveSession(null);
          setShowRating(true);
          await loadData();
        }
      });
    } catch (e) { console.error('restoreActiveCoSession:', e); }
  };

  // URL'den gelen partner bilgisi (çalışma isteği kabulünden)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const partnerId = params.get('partnerId');
    const partnerName = params.get('partnerName');
    const subject = params.get('subject');
    if (partnerId && partnerName) {
      setShowCoSession({ uid: partnerId, displayName: decodeURIComponent(partnerName), commonSubjects: subject ? [decodeURIComponent(subject)] : [] });
    }
  }, [location.search]);

  // Eş zamanlı oturum aktif olunca
  const handleCoSessionStarted = async (coSessionId, session) => {
    setShowCoSession(null);
    setShowCodeEntry(false);
    const subject = session.subject || 'Genel Çalışma';
    const isInitiator = session.initiatorId === currentUser.uid;
    const partnerId = isInitiator ? session.partnerId : session.initiatorId;
    const partnerName = isInitiator ? session.partnerName : session.initiatorName;
    const meetingPlace = (session.bulusmaYeri != null && String(session.bulusmaYeri).trim() !== '')
      ? String(session.bulusmaYeri).trim()
      : (userDoc?.campusName && String(userDoc.campusName).trim()) || 'Belirtilmedi';

    let sessionId;

    if (isInitiator) {
      const realPartnerName = session.partnerName || partnerName;
      sessionId = await createSession(currentUser.uid, {
        subject,
        plannedDuration: 60,
        partnerId,
        partnerName: realPartnerName,
        coSessionId,
        bulusmaYeri: meetingPlace,
        status: 'active',
        startedAt: serverTimestamp(),
      });
      // sessionId'yi coSession'a yaz
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      await updateDoc(doc(db, 'coSessions', coSessionId), { sessionId });
    } else {
      // Partner: sessionId gelene kadar bekle (race condition önlemi)
      sessionId = session.sessionId || null;
      if (!sessionId) {
        // 3 saniye bekle ve tekrar dene
        await new Promise(r => setTimeout(r, 3000));
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');
        const fresh = await getDoc(doc(db, 'coSessions', coSessionId));
        sessionId = fresh.data()?.sessionId || null;
      }
    }

    const activeData = {
      id: sessionId,
      subject,
      duration: 60,
      partner: { uid: partnerId, displayName: partnerName },
      coSessionId,
      startTime: new Date(),
      bulusmaYeri: meetingPlace,
    };

    setActiveSession(activeData);
    timer.reset();
    timer.start();

    // coSession dinle
    if (coSessionUnsubRef.current) coSessionUnsubRef.current();
    coSessionUnsubRef.current = listenCoSession(coSessionId, async (cs) => {
      // sessionId güncellenince state'i de güncelle
      if (cs.sessionId && !activeData.id) {
        activeData.id = cs.sessionId;
        setActiveSession(prev => prev ? { ...prev, id: cs.sessionId } : prev);
      }

      if (cs.status === 'ended') {
        coSessionUnsubRef.current?.();
        coSessionUnsubRef.current = null;
        timer.stop();
        const mins = cs.durationMinutes || Math.floor(timer.secs / 60);
        const sid = cs.sessionId || activeData.id || sessionId;

        if (sid) {
          await updateSessionStatus(sid, 'completed', {
            durationMinutes: mins,
            endedAt: serverTimestamp(),
          });
          // Partner için de log yaz
          await writeLog({
            sessionId: sid,
            kullaniciId: currentUser.uid,
            eslesenKisiId: partnerId,
            islemTipi: 'Eslesme_Oturum_Tamamlandi',
            calismaKonusu: subject,
            toplamSure: mins,
            bitisZamani: new Date().toISOString(),
            bulusmaYeri: cs.bulusmaYeri ?? null,
          });
          setCompletedId(sid);
        }
        setActiveSession(null);
        setShowRating(true);
        await loadData();
      }
    });
  };

  // Yalnız oturum başlat
  const handleStart = async (form) => {
    setShowPlan(false);
    const id = await createSession(currentUser.uid, {
      subject: form.subject,
      plannedDuration: form.duration,
      bulusmaYeri: form.bulusmaYeri || 'Belirtilmedi',
      partnerId: null,
      partnerName: null,
      status: 'active',
      startedAt: serverTimestamp(),
    });
    setActiveSession({ id, subject: form.subject, duration: form.duration, bulusmaYeri: form.bulusmaYeri || 'Belirtilmedi', partner: null, startTime: new Date() });
    timer.reset();
    timer.start();
  };

  const handleStop = async () => {
    timer.stop();
    const mins = Math.floor(timer.secs / 60);

    if (activeSession.id) {
      await updateSessionStatus(activeSession.id, 'completed', {
        durationMinutes: mins,
        endedAt: serverTimestamp(),
      });
      setCompletedId(activeSession.id);
    }

    // Log: tam oturum bilgisi
    await writeLog({
      sessionId: activeSession.id,
      kullaniciId: currentUser.uid,
      eslesenKisiId: activeSession.partner?.uid || null,
      islemTipi: activeSession.partner ? 'Eslesme_Oturum_Tamamlandi' : 'Bireysel_Oturum_Tamamlandi',
      calismaKonusu: activeSession.subject,
      toplamSure: mins,
      bitisZamani: new Date().toISOString(),
      bulusmaYeri: activeSession.bulusmaYeri || null,
    });

    if (activeSession.coSessionId) {
      await endCoSession(activeSession.coSessionId, mins);
    }

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
  const partnerSubjects = showCoSession?.commonSubjects?.length > 0 ? showCoSession.commonSubjects : mySubjects;

  return (
    <AppLayout title="Çalışma Oturumları">
      {/* Modallar */}
      {showPlan && (
        <PlanModal subjects={mySubjects} onClose={() => setShowPlan(false)} onStart={handleStart} />
      )}
      {showRating && (
        <RatingModal onSubmit={handleRating} onSkip={() => { setShowRating(false); setCompletedId(null); }} />
      )}
      {showCoSession && (
        <CoSessionModal
          partner={showCoSession}
          subject={partnerSubjects[0] || 'Genel Çalışma'}
          currentUser={currentUser}
          userDoc={userDoc}
          onClose={() => setShowCoSession(null)}
          onSessionStarted={handleCoSessionStarted}
        />
      )}
      {showCodeEntry && (
        <CodeEntryModal
          currentUser={currentUser}
          userDoc={userDoc}
          onClose={() => setShowCodeEntry(false)}
          onSessionStarted={handleCoSessionStarted}
        />
      )}

      {/* Aktif oturum kronometre */}
      {activeSession && (
        <div className="mb-8 p-8 rounded-2xl text-center"
          style={{ background: 'linear-gradient(135deg,rgba(232,160,32,0.1) 0%,rgba(90,122,90,0.06) 100%)', border: '1px solid rgba(232,160,32,0.25)' }}>
          <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--amber)' }}>
            {activeSession.partner ? '🤝 Eş Zamanlı Oturum' : '👤 Bireysel Oturum'} — {activeSession.subject}
          </p>
          {activeSession.partner && (
            <p className="text-xs mb-4" style={{ color: 'var(--mist)' }}>
              {activeSession.partner.displayName} ile birlikte
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

          {/* Hızlı butonlar */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowPlan(true)}
              className="btn-outline px-5 py-2.5 text-sm flex items-center gap-2">
              <Play size={14} /> Yalnız Çalış
            </button>
            <button onClick={() => setShowCodeEntry(true)}
              className="btn-outline px-5 py-2.5 text-sm flex items-center gap-2">
              <KeyRound size={14} /> Kodu Gir
            </button>
          </div>

          {/* Eşleşmelerim */}
          <div>
            <div className="mb-4">
              <p className="section-label mb-1">Eşleşmelerim</p>
              <h2 className="font-display text-xl font-semibold text-cream">Birlikte çalışabileceğin kişiler</h2>
            </div>

            {partners.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-display text-lg font-semibold text-cream mb-2">Henüz aktif eşleşmen yok</h3>
                <p className="text-sm mb-5" style={{ color: 'var(--mist)' }}>Eşleşmeler sayfasından birini bul.</p>
                <a href="#/eslesmeler" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">Eşleşme Bul</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map((partner, i) => (
                  <div key={i} className="glass-card p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                        style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                        {partner.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-cream">{partner.displayName || 'Kullanıcı'}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--mist)' }}>
                          {partner.faculty || ''}{partner.faculty && partner.campusName ? ' · ' : ''}{partner.campusName || ''}
                        </p>
                      </div>
                    </div>
                    {partner.commonSubjects?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {partner.commonSubjects.slice(0, 4).map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(232,160,32,0.2)' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setShowCoSession(partner)}
                      className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                      <Users size={15} /> Eş Zamanlı Oturum Başlat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Oturum Geçmişi */}
          <div>
            <div className="mb-4">
              <p className="section-label mb-1">Geçmiş</p>
              <h2 className="font-display text-xl font-semibold text-cream">
                Tamamlanan Oturumlar
                {completedSessions.length > 0 && (
                  <span className="ml-2 text-sm font-body font-normal" style={{ color: 'var(--mist)' }}>({completedSessions.length})</span>
                )}
              </h2>
            </div>
            {completedSessions.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="font-display text-lg font-semibold text-cream mb-2">Henüz tamamlanan oturum yok</p>
                <p className="text-sm" style={{ color: 'var(--mist)' }}>Bir oturum başlatınca burada görünecek.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {completedSessions.map((s, i) => {
                  const date = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
                  const isPartner = (s.participants?.filter(Boolean).length ?? 0) >= 2;
                  return (
                    <div key={i} className="glass-card p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isPartner ? 'rgba(58,138,90,0.15)' : 'rgba(232,160,32,0.1)' }}>
                        {isPartner ? <UserCheck size={18} style={{ color: '#5ABF8A' }} /> : <CheckCircle2 size={18} style={{ color: 'var(--amber)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cream">{s.subject || 'Genel Çalışma'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
                          {isPartner ? `🤝 ${s.partnerName} ile · ` : ''}
                          {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {s.durationMinutes > 0 && <p className="text-sm font-mono font-bold text-cream">{s.durationMinutes}dk</p>}
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
