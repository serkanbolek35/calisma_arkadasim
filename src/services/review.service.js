import {
  collection, doc, addDoc, getDocs,
  query, where, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Yorum gönder — kişi başına 1 yorum
export const submitReview = async ({ fromUserId, fromName, toUserId, rating, comment }) => {
  // Daha önce bu kişiye yorum yapıldı mı?
  const existing = await getDocs(
    query(
      collection(db, 'reviews'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    )
  );
  if (!existing.empty) return null; // Zaten yorum var

  await addDoc(collection(db, 'reviews'), {
    fromUserId,
    fromName,
    toUserId,
    rating,
    comment: comment || '',
    createdAt: serverTimestamp(),
  });

  await recalcUserRating(toUserId);
};

// Kullanıcının aldığı yorumları getir (orderBy olmadan — index gerekmez)
export const getUserReviews = async (userId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('toUserId', '==', userId))
    );
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Client tarafında tarihe göre sırala
    return reviews.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
  } catch (e) {
    console.error('getUserReviews error:', e);
    return [];
  }
};

// Bu kişiye daha önce yorum yapıldı mı?
export const hasReviewedUser = async (fromUserId, toUserId) => {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'reviews'),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId)
      )
    );
    return !snap.empty;
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
