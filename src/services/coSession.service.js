import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  onSnapshot, serverTimestamp, query, where
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notification.service';

export const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Eş zamanlı oturum oluştur — initiator otomatik katılmış sayılır
export const createCoSessionRequest = async ({ initiatorId, initiatorName, partnerId, partnerName, subject }) => {
  const code = generateCode();
  const ref = await addDoc(collection(db, 'coSessions'), {
    initiatorId, initiatorName,
    partnerId, partnerName,
    subject: subject || 'Genel Çalışma',
    code,
    status: 'waiting',
    initiatorJoined: true,  // initiator zaten dahil
    partnerJoined: false,
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

// Kodu doğrula ve partneri katıl — kod ile coSession bul
export const joinWithCode = async (code, partnerUserId) => {
  try {
    // Tüm waiting coSession'ları çek, client'ta filtrele (index gerekmez)
    const snap = await getDocs(collection(db, 'coSessions'));
    const match = snap.docs.find(d => {
      const data = d.data();
      return data.code === code &&
        data.partnerId === partnerUserId &&
        data.status === 'waiting';
    });

    if (!match) return { error: 'Geçersiz kod veya oturum bulunamadı' };

    const ref = doc(db, 'coSessions', match.id);
    await updateDoc(ref, {
      partnerJoined: true,
      status: 'active',
      startedAt: serverTimestamp(),
    });

    return { id: match.id, data: match.data() };
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
