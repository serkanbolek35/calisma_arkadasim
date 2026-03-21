import {
  collection, doc, addDoc, getDocs, getDoc, updateDoc,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notification.service';
import { isRecentlyActive } from './presence.service';

// Eşleşme kabul edilince chat oluştur (zaten varsa oluşturma)
const createMatchChat = async (user1Id, user2Id, matchId) => {
  try {
    // Bu match'e ait chat var mı? (matchId'ye göre ara)
    const snap = await getDocs(collection(db, 'chats'));
    const existing = snap.docs.find(d => d.data().matchId === matchId);
    if (existing) return existing.id;

    // Kullanıcı isimlerini al
    const [u1Snap, u2Snap] = await Promise.all([
      getDoc(doc(db, 'users', user1Id)),
      getDoc(doc(db, 'users', user2Id)),
    ]);
    const u1Name = u1Snap.data()?.displayName || 'Kullanıcı';
    const u2Name = u2Snap.data()?.displayName || 'Kullanıcı';

    const ref = await addDoc(collection(db, 'chats'), {
      participants: [user1Id, user2Id],
      participantNames: { [user1Id]: u1Name, [user2Id]: u2Name },
      matchId,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) { console.error('createMatchChat error:', e); return null; }
};


export const getMatches = async (userId) => {
  try {
    const q = query(collection(db, 'matches'), where('users', 'array-contains', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.status !== 'ended');
  } catch { return []; }
};

export const sendMatchRequest = async (fromUserId, toUserId, commonSubjects = [], score = 0, fromName = '') => {
  if (fromUserId === toUserId) return null; // kendine istek gönderme engeli
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
    fromUserId, fromName,
  });
  return ref.id;
};

export const respondToMatch = async (matchId, accept, responderId = '', responderName = '') => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.data();
  await updateDoc(matchRef, { status: accept ? 'active' : 'ended', respondedAt: serverTimestamp() });

  // Kabul edilirse sohbet oluştur
  let chatId = null;
  if (accept && matchData?.users) {
    chatId = await createMatchChat(matchData.users[0], matchData.users[1], matchId);
    if (chatId) {
      await updateDoc(matchRef, { chatId });
    }
  }

  if (matchData?.initiatedBy) {
    await createNotification(matchData.initiatedBy, {
      type: accept ? 'match_accepted' : 'match_rejected',
      title: accept ? '✅ Eşleşme Kabul Edildi' : '❌ Eşleşme Reddedildi',
      body: accept
        ? `${responderName || 'Kullanıcı'} eşleşme isteğini kabul etti!`
        : `${responderName || 'Kullanıcı'} eşleşme isteğini reddetti.`,
      link: accept && chatId ? `/sohbet/${chatId}` : '/eslesmeler',
      fromUserId: responderId, fromName: responderName,
    });
  }
};

export const endMatch = async (matchId) => {
  await updateDoc(doc(db, 'matches', matchId), { status: 'ended', endedAt: serverTimestamp() });
};

const extractCoords = (data, prefData = null) => {
  // 1. Aktif GPS konumu (fuzzlanmış, güncel)
  if (data.activeLat && data.activeLng) return { lat: data.activeLat, lng: data.activeLng, name: data.campusName || '' };
  // 2. Kayıtlı kampüs konumu
  if (data.campusLat && data.campusLng) return { lat: data.campusLat, lng: data.campusLng, name: data.campusName || '' };
  if (data.preferences?.campusLat) return { lat: data.preferences.campusLat, lng: data.preferences.campusLng, name: data.preferences.campus || '' };
  if (prefData?.campusLat) return { lat: prefData.campusLat, lng: prefData.campusLng, name: prefData.campus || '' };
  return { lat: null, lng: null, name: '' };
};

export const findPotentialMatches = async (userId, mySubjects = []) => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const results = [];

    for (const userDoc of snap.docs) {
      if (userDoc.id === userId) continue;
      const data = userDoc.data();

      // Sadece son 30 dakikada aktif olanlar
      if (!isRecentlyActive(data.lastSeen)) continue;

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
        if (common.length === 0) continue;
        score = Math.round((common.length / Math.max(mySubjects.length, theirSubjects.length, 1)) * 100);
      }

      const { lat: campusLat, lng: campusLng, name: campusName } = extractCoords(data, prefData);

      results.push({
        uid: userDoc.id,
        displayName: data.displayName || 'Kullanıcı',
        campusLat,   // zaten fuzzlanmış veya kampüs merkezi
        campusLng,
        campusName: campusName || data.campusName || '',
        faculty: data.faculty || '',
        subjects: theirSubjects,
        commonSubjects: common,
        compatibilityScore: score,
        isOnline: data.isOnline || false,
      });
    }

    return results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } catch (e) {
    console.error('findPotentialMatches error:', e);
    return [];
  }
};
