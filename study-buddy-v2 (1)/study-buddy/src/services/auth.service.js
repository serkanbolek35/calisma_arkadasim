import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export { auth };

export const isEduEmail = (email) =>
  typeof email === 'string' && email.toLowerCase().endsWith('.edu.tr');

export const registerUser = async ({ email, password, displayName }) => {
  if (!isEduEmail(email)) {
    throw new Error('Sadece .edu.tr uzantılı e-posta adresleri kabul edilmektedir.');
  }
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email.toLowerCase(),
      displayName: displayName || '',
      role: 'user',
      isOnboardingComplete: false,
      accountStatus: 'active',
      subjects: [],
      campusLat: null,
      campusLng: null,
      campusName: null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore kayıt hatası:', err.message);
  }

  try {
    await sendEmailVerification(user);
  } catch (err) {
    console.warn('Doğrulama maili gönderilemedi:', err.message);
  }

  return user;
};

export const loginUser = async ({ email, password }) => {
  if (!isEduEmail(email)) {
    throw new Error('Sadece .edu.tr uzantılı e-posta adresleri kabul edilmektedir.');
  }
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  // Son giriş zamanını güncelle
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const updates = { lastLoginAt: serverTimestamp() };

      // Eski alt koleksiyon verisi varsa migration yap
      if (!data.subjects && data.preferences?.subjects) {
        updates.subjects = data.preferences.subjects;
        updates.campusLat = data.preferences.campusLat || null;
        updates.campusLng = data.preferences.campusLng || null;
        updates.campusName = data.preferences.campus || null;
      }

      await setDoc(userRef, updates, { merge: true });
    }
  } catch (_) {}

  return user;
};

export const logoutUser = () => signOut(auth);

export const requestPasswordReset = (email) =>
  sendPasswordResetEmail(auth, email);

export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

export const getAuthErrorMessage = (code) => {
  const map = {
    'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password': 'E-posta veya şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
    'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
    'auth/user-disabled': 'Bu hesap askıya alınmış.',
    'auth/invalid-email': 'Geçersiz e-posta formatı.',
    'auth/network-request-failed': 'İnternet bağlantısı hatası.',
  };
  return map[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
};
