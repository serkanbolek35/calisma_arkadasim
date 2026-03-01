import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Kullanıcı aktif olduğunda lastSeen güncelle
export const updatePresence = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      lastSeen: serverTimestamp(),
      isOnline: true,
    });
  } catch (e) { console.error('Presence error:', e); }
};

// Kullanıcı çıkış yapınca veya pencere kapanınca offline yap
export const setOffline = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { isOnline: false });
  } catch (_) {}
};

// 30 dakika içinde aktif mi?
export const isRecentlyActive = (lastSeen) => {
  if (!lastSeen) return false;
  const d = lastSeen.toDate?.() ?? new Date(lastSeen);
  return Date.now() - d.getTime() < 30 * 60 * 1000; // 30 dakika
};

// Kampüs merkezi etrafında ~500m-1km rastgele sapma (gizlilik)
export const fuzzLocation = (lat, lng) => {
  const r = 0.004 + Math.random() * 0.004; // ~450m-900m
  const angle = Math.random() * 2 * Math.PI;
  return {
    lat: lat + r * Math.cos(angle),
    lng: lng + r * Math.sin(angle),
  };
};
