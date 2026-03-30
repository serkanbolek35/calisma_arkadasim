import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from './firebase';

export const createSession = async (userId, data) => {
  const participants = data.partnerId
    ? [userId, data.partnerId]
    : [userId];
  const ref = await addDoc(collection(db, 'sessions'), {
    ...data,
    participants,
    createdAt: serverTimestamp(),
    startedAt: serverTimestamp(), // Kesin başlangıç zamanı
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
    endedAt: serverTimestamp(), // Kesin bitiş zamanı
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

// ── Gelişmiş log fonksiyonları ──────────────────────────────

// Haftalık toplam süre (dakika)
export const getWeeklyTotal = (sessions) => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions
    .filter(s => s.status === 'completed')
    .filter(s => {
      const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
      return d.getTime() > weekAgo;
    })
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
};

// Konu bazlı oturum sayısı ve süre
export const getSubjectStats = (sessions) => {
  const completed = sessions.filter(s => s.status === 'completed');
  const map = {};
  completed.forEach(s => {
    const subj = s.subject || 'Genel Çalışma';
    if (!map[subj]) map[subj] = { count: 0, totalMins: 0 };
    map[subj].count++;
    map[subj].totalMins += s.durationMinutes || 0;
  });
  return Object.entries(map)
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a, b) => b.totalMins - a.totalMins);
};

// Eşleşme kalitesi — aynı partnerle kaç oturum
export const getPartnerStats = (sessions) => {
  const completed = sessions.filter(s => s.status === 'completed' && s.partnerId);
  const map = {};
  completed.forEach(s => {
    const key = s.partnerId;
    if (!map[key]) map[key] = { partnerName: s.partnerName || 'Kullanıcı', count: 0, totalMins: 0 };
    map[key].count++;
    map[key].totalMins += s.durationMinutes || 0;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
};

// Günlük dağılım (son 7 gün)
export const getDailyStats = (sessions) => {
  const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const map = { Pzt: 0, Sal: 0, Çar: 0, Per: 0, Cum: 0, Cmt: 0, Paz: 0 };
  sessions
    .filter(s => s.status === 'completed')
    .forEach(s => {
      const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
      if (d.getTime() > weekAgo) map[DAYS[d.getDay()]] += s.durationMinutes || 0;
    });
  return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => ({ day, minutes: map[day] }));
};
