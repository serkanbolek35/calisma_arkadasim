import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, orderBy, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export const createNotification = async (toUserId, data) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      toUserId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link || null,
      fromUserId: data.fromUserId || null,
      fromName: data.fromName || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) { console.error('Notification error:', e); }
};

export const listenNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => console.error(err));
};

export const markAsRead = async (notifId) => {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
};

export const markAllAsRead = async (userId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'notifications'), where('toUserId', '==', userId), where('read', '==', false))
    );
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (e) { console.error(e); }
};
