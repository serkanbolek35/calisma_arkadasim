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

// Son 30 dakikada aktif mi?
export const isRecentlyActive = (lastSeen) => {
  if (!lastSeen) return false;
  const d = lastSeen.toDate?.() ?? new Date(lastSeen);
  return Date.now() - d.getTime() < 30 * 60 * 1000;
};
