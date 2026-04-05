import {
  collection, doc, addDoc, getDoc, updateDoc, onSnapshot,
  serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notification.service';

// 6 haneli rastgele kod üret
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Eş zamanlı oturum isteği oluştur
export const createCoSessionRequest = async ({ initiatorId, initiatorName, partnerId, partnerName, subject }) => {
  const code = generateCode();
  const ref = await addDoc(collection(db, 'coSessions'), {
    initiatorId,
    initiatorName,
    partnerId,
    partnerName,
    subject: subject || 'Genel Çalışma',
    code,
    status: 'waiting', // waiting | active | ended
    initiatorJoined: false,
    partnerJoined: false,
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null,
  });

  // Partnera bildirim gönder
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

// Kodu doğrula ve oturuma katıl
export const joinCoSession = async (coSessionId, userId, isInitiator) => {
  const ref = doc(db, 'coSessions', coSessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { error: 'Oturum bulunamadı' };

  const data = snap.data();
  if (data.status === 'ended') return { error: 'Oturum sona erdi' };

  const update = isInitiator
    ? { initiatorJoined: true }
    : { partnerJoined: true };

  // Her ikisi de katıldıysa oturumu başlat
  const initiatorJoined = isInitiator ? true : data.initiatorJoined;
  const partnerJoined = isInitiator ? data.partnerJoined : true;

  if (initiatorJoined && partnerJoined) {
    await updateDoc(ref, { ...update, status: 'active', startedAt: serverTimestamp() });
    return { status: 'active' };
  } else {
    await updateDoc(ref, update);
    return { status: 'waiting' };
  }
};

// Oturumu dinle (realtime)
export const listenCoSession = (coSessionId, callback) => {
  return onSnapshot(doc(db, 'coSessions', coSessionId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};

// Oturumu sonlandır
export const endCoSession = async (coSessionId, durationMinutes) => {
  await updateDoc(doc(db, 'coSessions', coSessionId), {
    status: 'ended',
    endedAt: serverTimestamp(),
    durationMinutes,
  });
};
