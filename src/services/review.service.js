import {
  collection, doc, addDoc, getDocs, getDoc,
  query, where, orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Yorum gönder (oturum sonrası partneri değerlendir)
export const submitReview = async ({ fromUserId, fromName, toUserId, sessionId, rating, comment }) => {
  // Aynı oturum için zaten yorum var mı?
  const existing = await getDocs(
    query(collection(db, 'reviews'), where('sessionId', '==', sessionId), where('fromUserId', '==', fromUserId))
  );
  if (!existing.empty) return null; // Zaten değerlendirdi

  const ref = await addDoc(collection(db, 'reviews'), {
    fromUserId, fromName,
    toUserId, sessionId,
    rating, // 1-5
    comment: comment || '',
    createdAt: serverTimestamp(),
  });

  // Kullanıcının ortalama puanını güncelle
  await recalcUserRating(toUserId);
  return ref.id;
};

// Kullanıcının aldığı tüm yorumları getir
export const getUserReviews = async (userId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('toUserId', '==', userId), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

// Kullanıcının ortalama puanını yeniden hesapla ve users'a yaz
export const recalcUserRating = async (userId) => {
  try {
    const reviews = await getUserReviews(userId);
    if (reviews.length === 0) return;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await updateDoc(doc(db, 'users', userId), {
      avgRating: +avg.toFixed(2),
      reviewCount: reviews.length,
    });
  } catch (e) { console.error(e); }
};

// Belirli bir oturum için bu kullanıcının yorumu var mı?
export const hasReviewedSession = async (sessionId, fromUserId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('sessionId', '==', sessionId), where('fromUserId', '==', fromUserId))
    );
    return !snap.empty;
  } catch { return false; }
};
