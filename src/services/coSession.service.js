import {
  collection, doc, addDoc, getDocs, updateDoc,
  onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notification.service';

export const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Haversine formülü — iki koordinat arası metre cinsinden mesafe
export const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Tarayıcıdan gerçek GPS konumu al (fuzzlanmamış)
export const getRealLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Konum servisi desteklenmiyor'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Konum izni alınamadı. Lütfen tarayıcı konum iznini açın.')),
      { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
    );
  });

// Eş zamanlı oturum oluştur — initiator'ın gerçek konumunu kaydet
export const createCoSessionRequest = async ({
  initiatorId, initiatorName, partnerId, partnerName, subject,
  bulusmaYeri = null, initiatorLat = null, initiatorLng = null,
}) => {
  const code = generateCode();
  const ref = await addDoc(collection(db, 'coSessions'), {
    initiatorId, initiatorName,
    partnerId, partnerName,
    subject: subject || 'Genel Çalışma',
    bulusmaYeri: bulusmaYeri || null,
    code,
    status: 'waiting',
    initiatorJoined: true,
    partnerJoined: false,
    // Gerçek konum — mesafe kontrolü için (haritada gösterilmez)
    initiatorLat,
    initiatorLng,
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null,
  });

  await createNotification(partnerId, {
    type: 'co_session_invite',
    title: '⏱ Oturum Daveti',
    body: `${initiatorName} seninle eş zamanlı oturum başlatmak istiyor. Kod: ${code}`,
    link: '/oturumlar',
    fromUserId: initiatorId,
    fromName: initiatorName,
    coSessionId: ref.id,
    code,
  });

  return { id: ref.id, code };
};

// Kodu doğrula, mesafeyi kontrol et ve partneri katıl
export const joinWithCode = async (code, partnerUserId, partnerLat = null, partnerLng = null) => {
  try {
    const snap = await getDocs(collection(db, 'coSessions'));
    const match = snap.docs.find(d => {
      const data = d.data();
      return data.code === code &&
        data.partnerId === partnerUserId &&
        data.status === 'waiting';
    });

    if (!match) return { error: 'Geçersiz kod veya oturum bulunamadı' };

    const csData = match.data();

    // Mesafe kontrolü — her iki tarafın da konumu varsa kontrol et
    if (
      csData.initiatorLat && csData.initiatorLng &&
      partnerLat && partnerLng
    ) {
      const distance = getDistanceMeters(
        csData.initiatorLat, csData.initiatorLng,
        partnerLat, partnerLng
      );
      if (distance > 500) {
        return {
          error: `Konumunuz çok uzak (${Math.round(distance)} metre). Eş zamanlı oturum başlatmak için aynı yerde (max 500 metre) olmanız gerekiyor.`,
          distance: Math.round(distance),
        };
      }
    }

    await updateDoc(doc(db, 'coSessions', match.id), {
      partnerJoined: true,
      status: 'active',
      startedAt: serverTimestamp(),
      partnerLat,
      partnerLng,
    });

    return { id: match.id, data: csData };
  } catch (e) {
    console.error('joinWithCode error:', e);
    return { error: 'Bir hata oluştu' };
  }
};

export const listenCoSession = (coSessionId, callback) =>
  onSnapshot(doc(db, 'coSessions', coSessionId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });

export const endCoSession = async (coSessionId, durationMinutes) => {
  await updateDoc(doc(db, 'coSessions', coSessionId), {
    status: 'ended',
    endedAt: serverTimestamp(),
    durationMinutes,
  });
};
