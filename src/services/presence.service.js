import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ~500m-1km rastgele sapma — tam konum gizlenir
export const fuzzLocation = (lat, lng) => {
  const r = 0.004 + Math.random() * 0.004;
  const angle = Math.random() * 2 * Math.PI;
  return {
    lat: +(lat + r * Math.cos(angle)).toFixed(5),
    lng: +(lng + r * Math.sin(angle)).toFixed(5),
  };
};

// GPS alıp fuzzlanmış konumu Firestore'a yaz
export const updatePresence = (uid) => {
  return new Promise((resolve) => {
    const writePresence = async (fuzzedLat = null, fuzzedLng = null) => {
      try {
        const data = {
          lastSeen: serverTimestamp(),
          isOnline: true,
        };
        if (fuzzedLat && fuzzedLng) {
          data.activeLat = fuzzedLat;
          data.activeLng = fuzzedLng;
        }
        await updateDoc(doc(db, 'users', uid), data);
      } catch (e) { console.error('Presence error:', e); }
      resolve();
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { lat, lng } = fuzzLocation(pos.coords.latitude, pos.coords.longitude);
          writePresence(lat, lng);
        },
        () => writePresence(), // izin yoksa sadece lastSeen yaz
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      writePresence();
    }
  });
};

export const setOffline = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { isOnline: false });
  } catch (_) {}
};

// Kullanıcı aktif mi?
// - isOnline: false ise anında gizle
// - isOnline: true ama lastSeen 20 saniyeden eskiyse (tarayıcı çöktü/kapandı) gizle
export const isRecentlyActive = (lastSeen, isOnline) => {
  if (!lastSeen) return false;
  if (isOnline === false) return false; // anında gizle
  const d = lastSeen.toDate?.() ?? new Date(lastSeen);
  const elapsed = Date.now() - d.getTime();
  // isOnline: true ama 20 sn'den uzun süredir güncelleme yok → tarayıcı kapandı
  if (isOnline === true && elapsed > 20 * 1000) return false;
  // isOnline değeri hiç yazılmamış eski hesaplar için 30 dk kontrolü
  if (isOnline === undefined || isOnline === null) return elapsed < 30 * 60 * 1000;
  return true;
};
