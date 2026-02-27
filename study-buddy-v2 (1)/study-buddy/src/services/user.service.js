import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Ana kullanıcı dökümanı
export const getUser = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch { return null; }
};

// Tercihleri ana dökümanın içinde sakla (alt koleksiyon yerine)
export const getUserPreferences = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.preferences || null;
  } catch { return null; }
};

// Profil + tercihler hepsini ana dökümanа yaz
export const updateUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const updateUserPreferences = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    preferences: { ...data },
    // Harita için konum bilgisini üst seviyede de tut
    campusLat: data.campusLat || null,
    campusLng: data.campusLng || null,
    campusName: data.campus || null,
    subjects: data.subjects || [],
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const completeOnboarding = async (uid) => {
  await setDoc(doc(db, 'users', uid), { isOnboardingComplete: true }, { merge: true });
};
