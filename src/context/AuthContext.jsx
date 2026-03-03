import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../services/auth.service';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { updatePresence, setOffline } from '../services/presence.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userDocUnsub = null;

    const authUnsub = onAuthChange(async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      // Önceki userDoc listener'ı temizle
      if (userDocUnsub) { userDocUnsub(); userDocUnsub = null; }

      if (firebaseUser) {
        // onSnapshot ile gerçek zamanlı dinle — onboarding bitince anında güncellenir
        userDocUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            setUserDoc({ id: snap.id, ...snap.data() });
          }
          setLoading(false);
        }, () => setLoading(false));

        // Presence güncelle
        await updatePresence(firebaseUser.uid);
      } else {
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  // 5 dakikada bir presence güncelle
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => updatePresence(currentUser.uid), 5 * 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') setOffline(currentUser.uid);
      else updatePresence(currentUser.uid);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser]);

  const refreshUserDoc = async () => {
    // onSnapshot zaten gerçek zamanlı günceller, bu fonksiyon artık gereksiz
    // ama geriye dönük uyumluluk için bırakıldı
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userDoc,
      loading,
      refreshUserDoc,
      isAdmin: userDoc?.role === 'admin',
      isOnboardingComplete: userDoc?.isOnboardingComplete ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
