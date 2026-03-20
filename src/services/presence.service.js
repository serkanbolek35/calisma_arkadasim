import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ~500m-1km rastgele sapma
export const fuzzLocation = (lat, lng) => {
  const r = 0.004 + Math.random() * 0.004;
  const angle = Math.random() * 2 * Math.PI;
  return {
    lat: +(lat + r * Math.cos(angle)).toFixed(5),
    lng: +(lng + r * Math.sin(angle)).toFixed(5),
  };
};

// Presence güncelle:
// - lastSeen + isOnline her 8sn'de güncellenir (haritada görünmek için)
// - activeLat/activeLng SADECE ilk girişte veya konum yoksa yazılır (haritada sabit kalır)
export const updatePresence = async (uid) => {
  try {
    // Önce mevcut konumu kontrol et
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.data() || {};
    const hasLocation = userData.activeLat && userData.activeLng;

    // Her zaman lastSeen + isOnline güncelle
    await updateDoc(doc(db, 'users', uid), {
      lastSeen: serverTimestamp(),
      isOnline: true,
    });

    // Konum zaten varsa GPS'e bakma — sabit kalsın
    if (hasLocation) return;

    // Konum yoksa GPS'ten al ve fuzzla (sadece 1 kez)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { lat, lng } = fuzzLocation(pos.coords.latitude, pos.coords.longitude);
            await updateDoc(doc(db, 'users', uid), {
              activeLat: lat,
              activeLng: lng,
            });
          } catch (_) {}
        },
        () => {},
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  } catch (e) { console.error('Presence error:', e); }
};

export const setOffline = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { isOnline: false });
  } catch (_) {}
};

// Aktiflik kontrolü
export const isRecentlyActive = (lastSeen, isOnline) => {
  if (isOnline === false) return false;
  if (!lastSeen) return true;
  const elapsed = Date.now() - (lastSeen.toDate?.() ?? new Date(lastSeen)).getTime();
  if (isOnline === true) return elapsed < 10 * 1000;
  return elapsed < 30 * 60 * 1000;
};
