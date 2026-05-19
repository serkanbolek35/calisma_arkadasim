import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getUser } from './user.service';

/** Ortak oturumda oturumu görüntüleyen kullanıcı için karşı tarafın uid + displayName (DB'deki partnerId her zaman davet edilen olabiliyor) */
export const enrichSessionPartnerForViewer = async (viewerUid, session) => {
  const parts = (session.participants || []).filter(Boolean);
  let otherId = parts.length >= 2 ? parts.find((id) => id !== viewerUid) : null;
  if (!otherId && session.partnerId && session.partnerId !== viewerUid) {
    otherId = session.partnerId;
  }
  if (!otherId) return session;
  try {
    const other = await getUser(otherId);
    if (other?.displayName) {
      return { ...session, partnerId: otherId, partnerName: other.displayName };
    }
  } catch (_) { /* ignore */ }
  return session;
};

export const enrichSessionsForViewer = async (viewerUid, sessions) =>
  Promise.all(sessions.map((s) => enrichSessionPartnerForViewer(viewerUid, s)));

// ── Uygulama Log Kaydı ────────────────────────────────────────
// Her önemli eylem için logs koleksiyonuna kayıt yazar
export const writeLog = async ({ sessionId, kullaniciId, eslesenKisiId, islemTipi, calismaKonusu, bitisZamani, toplamSure, bulusmaYeri }) => {
  try {
    await addDoc(collection(db, 'logs'), {
      sessionId: sessionId || null,
      kullaniciId,
      eslesenKisiId: eslesenKisiId || null,
      islemTipi,
      calismaKonusu: calismaKonusu || null,
      bitisZamani: bitisZamani || null,   // ISO string
      toplamSure: toplamSure ?? null,     // dakika (sayı)
      bulusmaYeri: bulusmaYeri || null,
      zaman: serverTimestamp(),           // log yazıldığı an
    });
  } catch (e) { console.error('writeLog error:', e); }
};

export const createSession = async (userId, data) => {
  const participants = data.partnerId
    ? [userId, data.partnerId]
    : [userId];
  const ref = await addDoc(collection(db, 'sessions'), {
    ...data,
    participants,
    createdAt: serverTimestamp(),
    startedAt: serverTimestamp(),
    status: data.status || 'active',
  });

  return ref.id;
};

export const getUserSessions = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

export const getCompletedSessions = async (userId) => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('participants', 'array-contains', userId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

export const updateSessionStatus = async (sessionId, status, extra = {}) => {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status,
    ...extra,
    endedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const addSessionRating = async (sessionId, userId, rating) => {
  await setDoc(doc(db, 'sessions', sessionId, 'ratings', userId), {
    ...rating,
    ratedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'sessions', sessionId), { rating });
};

// ── Analiz fonksiyonları ──────────────────────────────────────
export const getWeeklyTotal = (sessions) => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions
    .filter(s => s.status === 'completed')
    .filter(s => (s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0)).getTime() > weekAgo)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
};

export const getSubjectStats = (sessions) => {
  const map = {};
  sessions.filter(s => s.status === 'completed').forEach(s => {
    const subj = s.subject || 'Genel Çalışma';
    if (!map[subj]) map[subj] = { count: 0, totalMins: 0 };
    map[subj].count++;
    map[subj].totalMins += s.durationMinutes || 0;
  });
  return Object.entries(map).map(([subject, v]) => ({ subject, ...v })).sort((a, b) => b.totalMins - a.totalMins);
};

export const getPartnerStats = (sessions) => {
  const map = {};
  sessions.filter(s => s.status === 'completed' && s.partnerId).forEach(s => {
    if (!map[s.partnerId]) map[s.partnerId] = { partnerName: s.partnerName || 'Kullanıcı', count: 0, totalMins: 0 };
    map[s.partnerId].count++;
    map[s.partnerId].totalMins += s.durationMinutes || 0;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
};

export const getDailyStats = (sessions) => {
  const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const map = { Pzt: 0, Sal: 0, Çar: 0, Per: 0, Cum: 0, Cmt: 0, Paz: 0 };
  sessions.filter(s => s.status === 'completed').forEach(s => {
    const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
    if (d.getTime() > weekAgo) map[DAYS[d.getDay()]] += s.durationMinutes || 0;
  });
  return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => ({ day, minutes: map[day] }));
};
