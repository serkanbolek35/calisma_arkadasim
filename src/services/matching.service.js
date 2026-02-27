import {
  collection, doc, addDoc, getDocs, getDoc, updateDoc,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export const getMatches = async (userId) => {
  try {
    const q = query(collection(db, 'matches'), where('users', 'array-contains', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.status !== 'ended');
  } catch { return []; }
};

export const sendMatchRequest = async (fromUserId, toUserId, commonSubjects = [], score = 0) => {
  const ref = await addDoc(collection(db, 'matches'), {
    users: [fromUserId, toUserId],
    initiatedBy: fromUserId,
    status: 'pending',
    compatibilityScore: score,
    commonSubjects,
    createdAt: serverTimestamp(),
    endedAt: null,
  });
  return ref.id;
};

export const respondToMatch = async (matchId, accept) => {
  await updateDoc(doc(db, 'matches', matchId), {
    status: accept ? 'active' : 'ended',
    respondedAt: serverTimestamp(),
  });
};

export const endMatch = async (matchId) => {
  await updateDoc(doc(db, 'matches', matchId), { status: 'ended', endedAt: serverTimestamp() });
};

export const findPotentialMatches = async (userId, mySubjects = []) => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const results = [];

    for (const userDoc of snap.docs) {
      if (userDoc.id === userId) continue;
      const data = userDoc.data();

      // Kullanıcının subjects alanı doğrudan ana dökümanında
      const theirSubjects = data.subjects || data.preferences?.subjects || [];
      if (theirSubjects.length === 0) continue;

      let common = [];
      let score = 0;

      if (mySubjects.length > 0) {
        common = mySubjects.filter(s => theirSubjects.includes(s));
        if (common.length === 0) continue;
        score = Math.round((common.length / Math.max(mySubjects.length, theirSubjects.length, 1)) * 100);
      } else {
        // Kendi subject'i yoksa herkesi göster
        score = 50;
      }

      results.push({
        uid: userDoc.id,
        displayName: data.displayName || 'Kullanıcı',
        email: data.email || '',
        campusLat: data.campusLat || data.preferences?.campusLat || null,
        campusLng: data.campusLng || data.preferences?.campusLng || null,
        campusName: data.campusName || data.preferences?.campus || '',
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
