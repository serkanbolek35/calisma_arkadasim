import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, onSnapshot, serverTimestamp, writeBatch
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

// orderBy kaldırıldı — composite index gerektirmiyor
export const listenNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('toUserId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const notifs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
    callback(notifs);
  }, err => console.error('Notification listen error:', err));
};

export const markAsRead = async (notifId) => {
  try { await updateDoc(doc(db, 'notifications', notifId), { read: true }); } catch (e) { console.error(e); }
};

export const markAllAsRead = async (userId) => {
  try {
    const snap = await getDocs(query(collection(db, 'notifications'), where('toUserId', '==', userId), where('read', '==', false)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (e) { console.error(e); }
};
