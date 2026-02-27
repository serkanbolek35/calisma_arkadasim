import {
  collection, doc, addDoc, getDocs, getDoc,
  query, where, orderBy, onSnapshot, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Kullanıcının sohbetlerini getir
export const getUserChats = async (userId) => {
  try {
    const snap = await getDocs(collection(db, 'chats'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.participants?.includes(userId))
      .sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
        const tb = b.lastMessageAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
  } catch (e) { console.error(e); return []; }
};

// Sohbet mesajlarını gerçek zamanlı dinle
export const listenMessages = (chatId, callback) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
};

// Mesaj gönder
export const sendMessage = async (chatId, senderId, senderName, text) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    senderName,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  // Son mesajı güncelle
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text.trim(),
    lastMessageAt: serverTimestamp(),
  });
};

// Tek sohbet bilgisi
export const getChat = async (chatId) => {
  const snap = await getDoc(doc(db, 'chats', chatId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
