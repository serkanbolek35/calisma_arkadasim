import {
  collection, doc, addDoc, getDocs, getDoc, updateDoc,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notification.service';

export const getMatches = async (userId) => {
  try {
    const q = query(collection(db, 'matches'), where('users', 'array-contains', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.status !== 'ended');
  } catch { return []; }
};

export const sendMatchRequest = async (fromUserId, toUserId, commonSubjects = [], score = 0, fromName = '') => {
  const ref = await addDoc(collection(db, 'matches'), {
    users: [fromUserId, toUserId],
    initiatedBy: fromUserId,
    status: 'pending',
    compatibilityScore: score,
    commonSubjects,
    createdAt: serverTimestamp(),
    endedAt: null,
  });
  await createNotification(toUserId, {
    type: 'match_request',
    title: '🤝 Yeni Eşleşme İsteği',
    body: `${fromName || 'Bir kullanıcı'} sana eşleşme isteği gönderdi.`,
    link: '/eslesmeler',
    fromUserId,
    fromName,
  });
  return ref.id;
};

export const respondToMatch = async (matchId, accept, responderId = '', responderName = '') => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.data();
  await updateDoc(matchRef, { status: accept ? 'active' : 'ended', respondedAt: serverTimestamp() });
  if (matchData?.initiatedBy) {
    await createNotification(matchData.initiatedBy, {
      type: accept ? 'match_accepted' : 'match_rejected',
      title: accept ? '✅ Eşleşme Kabul Edildi' : '❌ Eşleşme Reddedildi',
      body: accept ? `${responderName || 'Kullanıcı'} eşleşme isteğini kabul etti!` : `${responderName || 'Kullanıcı'} eşleşme isteğini reddetti.`,
      link: '/eslesmeler',
      fromUserId: responderId,
      fromName: responderName,
    });
  }
};

export const endMatch = async (matchId) => {
  await updateDoc(doc(db, 'matches', matchId), { status: 'ended', endedAt: serverTimestamp() });
};

// Koordinat okuma yardımcı fonksiyonu - her ihtimali dene
const extractCoords = (data, prefData = null) => {
  // 1. Ana dokümanda doğrudan
  if (data.campusLat && data.campusLng) return { lat: data.campusLat, lng: data.campusLng, name: data.campusName || data.campus || '' };
  // 2. Ana dokümanda preferences objesi içinde
  if (data.preferences?.campusLat) return { lat: data.preferences.campusLat, lng: data.preferences.campusLng, name: data.preferences.campus || data.preferences.campusName || '' };
  // 3. Alt koleksiyondan gelen veri
  if (prefData?.campusLat) return { lat: prefData.campusLat, lng: prefData.campusLng, name: prefData.campus || prefData.campusName || '' };
  return { lat: null, lng: null, name: '' };
};

export const findPotentialMatches = async (userId, mySubjects = []) => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const results = [];

    for (const userDoc of snap.docs) {
      if (userDoc.id === userId) continue;
      const data = userDoc.data();

      // Alt koleksiyondan da preferences'ı çekmeyi dene
      let prefData = null;
      try {
        const prefSnap = await getDoc(doc(db, 'users', userDoc.id, 'preferences', userDoc.id));
        if (prefSnap.exists()) prefData = prefSnap.data();
      } catch (_) {}

      const theirSubjects = data.subjects || data.preferences?.subjects || prefData?.subjects || [];

      let common = [];
      let score = 50;
      if (mySubjects.length > 0 && theirSubjects.length > 0) {
        common = mySubjects.filter(s => theirSubjects.includes(s));
        if (common.length === 0 && mySubjects.length > 0) continue;
        score = Math.round((common.length / Math.max(mySubjects.length, theirSubjects.length, 1)) * 100);
      }

      const { lat: campusLat, lng: campusLng, name: campusName } = extractCoords(data, prefData);

      results.push({
        uid: userDoc.id,
        displayName: data.displayName || 'Kullanıcı',
        email: data.email || '',
        campusLat,
        campusLng,
        campusName: campusName || data.campusName || '',
        faculty: data.faculty || '',
        subjects: theirSubjects,
        commonSubjects: common,
        compatibilityScore: score,
      });
    }

    return results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } catch (e) {
    console.error('findPotentialMatches error:', e);
    return [];
  }
};
