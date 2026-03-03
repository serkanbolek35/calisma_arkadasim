import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
// 1. Önce anında lastSeen + isOnline:true yaz (haritada hemen görünsün)
// 2. Sonra GPS gelirse koordinatı da güncelle
export const updatePresence = async (uid) => {
  try {
    // ADIM 1: Anında yaz — GPS beklemeden
    await updateDoc(doc(db, 'users', uid), {
      lastSeen: serverTimestamp(),
      isOnline: true,
    });
  } catch (e) { console.error('Presence error:', e); }

  // ADIM 2: GPS koordinatını arka planda güncelle (engelleme yok)
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
      () => {}, // izin yoksa sessizce geç
      { timeout: 5000, maximumAge: 60000 }
    );
  }
};

export const setOffline = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { isOnline: false });
  } catch (_) {}
};

// Aktiflik kontrolü:
// - isOnline: false → anında gizle
// - isOnline: true + lastSeen 10s'den eskiyse → çöktü, gizle
// - eski hesaplar (isOnline yok) → 30 dk içindeyse göster
export const isRecentlyActive = (lastSeen, isOnline) => {
  if (isOnline === false) return false;
  if (!lastSeen) return true;
  const elapsed = Date.now() - (lastSeen.toDate?.() ?? new Date(lastSeen)).getTime();
  if (isOnline === true) return elapsed < 10 * 1000;
  return elapsed < 30 * 60 * 1000;
};
