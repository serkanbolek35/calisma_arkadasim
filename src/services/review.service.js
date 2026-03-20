import {
  collection, doc, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Yorum gönder
export const submitReview = async ({ fromUserId, fromName, toUserId, sessionId, rating, comment }) => {
  // Bu kullanıcıya daha önce yorum yapıldı mı?
  const existing = await getDocs(
    query(collection(db, 'reviews'), where('fromUserId', '==', fromUserId), where('toUserId', '==', toUserId))
  );
  if (!existing.empty) return null;

  await addDoc(collection(db, 'reviews'), {
    fromUserId, fromName,
    toUserId, sessionId,
    rating,
    comment: comment || '',
    createdAt: serverTimestamp(),
  });

  await recalcUserRating(toUserId);
};

// Kullanıcının aldığı yorumları getir
export const getUserReviews = async (userId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('toUserId', '==', userId), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

// Ortalama puanı güncelle
export const recalcUserRating = async (userId) => {
  try {
    const reviews = await getUserReviews(userId);
    if (!reviews.length) return;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await updateDoc(doc(db, 'users', userId), {
      avgRating: +avg.toFixed(2),
      reviewCount: reviews.length,
    });
  } catch (e) { console.error(e); }
};

// Bu kullanıcıya daha önce yorum yapıldı mı?
export const hasReviewedSession = async (sessionId, fromUserId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('sessionId', '==', sessionId), where('fromUserId', '==', fromUserId))
    );
    return !snap.empty;
  } catch { return false; }
};
