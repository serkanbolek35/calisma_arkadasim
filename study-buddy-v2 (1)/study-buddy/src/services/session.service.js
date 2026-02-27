import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from './firebase';

export const createSession = async (userId, data) => {
  const ref = await addDoc(collection(db, 'sessions'), {
    ...data, participants: [userId], createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserSessions = async (userId, limitCount = 20) => {
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
  await updateDoc(doc(db, 'sessions', sessionId), { status, ...extra, updatedAt: serverTimestamp() });
};

export const addSessionRating = async (sessionId, userId, rating) => {
  await setDoc(doc(db, 'sessions', sessionId, 'ratings', userId), { ...rating, ratedAt: serverTimestamp() });
  // Oturuma rating özetini de yaz
  await updateDoc(doc(db, 'sessions', sessionId), { rating });
};
