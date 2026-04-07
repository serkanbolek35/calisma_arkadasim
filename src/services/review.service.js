import {
  collection, doc, addDoc, getDocs,
  query, where, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Yorum gönder
export const submitReview = async ({ fromUserId, fromName, toUserId, rating, comment }) => {
  // Daha önce yorum var mı? — tek field sorgu (index gerekmez)
  const existing = await getDocs(
    query(collection(db, 'reviews'), where('fromUserId', '==', fromUserId))
  );
  const alreadyReviewed = existing.docs.some(d => d.data().toUserId === toUserId);
  if (alreadyReviewed) return null;

  await addDoc(collection(db, 'reviews'), {
    fromUserId, fromName, toUserId,
    rating,
    comment: comment || '',
    createdAt: serverTimestamp(),
  });

  await recalcUserRating(toUserId);
};

// Kullanıcının aldığı yorumları getir — tek field sorgu
export const getUserReviews = async (userId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('toUserId', '==', userId))
    );
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  } catch (e) {
    console.error('getUserReviews error:', e);
    return [];
  }
};

// Daha önce yorum yapıldı mı? — tek field sorgu
export const hasReviewedUser = async (fromUserId, toUserId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('fromUserId', '==', fromUserId))
    );
    return snap.docs.some(d => d.data().toUserId === toUserId);
  } catch { return false; }
};

// Ortalama puanı users dokümanına yaz
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
