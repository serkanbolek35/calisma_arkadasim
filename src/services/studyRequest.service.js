import {
  collection, doc, addDoc, getDocs, getDoc, updateDoc,
  query, where, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// İstek oluştur
export const createStudyRequest = async (userId, data) => {
  const ref = await addDoc(collection(db, 'studyRequests'), {
    userId,
    displayName: data.displayName,
    subject: data.subject,
    location: data.location,
    date: data.date,
    timeSlot: data.timeSlot,
    note: data.note || '',
    status: 'open', // open | matched | cancelled
    matchedWith: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Tüm açık istekleri getir (kendi isteğin hariç)
export const getOpenRequests = async (currentUserId) => {
  try {
    const snap = await getDocs(collection(db, 'studyRequests'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.userId !== currentUserId && r.status === 'open')
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
  } catch (e) { console.error(e); return []; }
};

// Kendi isteklerini getir
export const getMyRequests = async (userId) => {
  try {
    const snap = await getDocs(collection(db, 'studyRequests'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.userId === userId)
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
  } catch (e) { return []; }
};

// İsteği iptal et
export const cancelRequest = async (requestId) => {
  await updateDoc(doc(db, 'studyRequests', requestId), { status: 'cancelled' });
};

// İsteği kabul et → sohbet oluştur
export const acceptRequest = async (requestId, acceptorId, acceptorName, request) => {
  // İsteği güncelle
  await updateDoc(doc(db, 'studyRequests', requestId), {
    status: 'matched',
    matchedWith: acceptorId,
    matchedAt: serverTimestamp(),
  });

  // Sohbet oluştur
  const chatRef = await addDoc(collection(db, 'chats'), {
    participants: [request.userId, acceptorId],
    participantNames: {
      [request.userId]: request.displayName,
      [acceptorId]: acceptorName,
    },
    requestId,
    subject: request.subject,
    location: request.location,
    date: request.date,
    timeSlot: request.timeSlot,
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageAt: null,
  });

  return chatRef.id;
};
