import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../services/auth.service';
import { getUser } from '../services/user.service';
import { updatePresence, setOffline } from '../services/presence.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        const d = await getUser(firebaseUser.uid);
        setUserDoc(d);
        // İlk girişte presence güncelle
        await updatePresence(firebaseUser.uid);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Her 5 dakikada bir lastSeen güncelle
    const interval = setInterval(() => {
      updatePresence(currentUser.uid);
    }, 5 * 60 * 1000);

    // Sekme kapatılırsa/gizlenirse offline yap
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setOffline(currentUser.uid);
      } else {
        updatePresence(currentUser.uid);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser]);

  const refreshUserDoc = async () => {
    if (currentUser) {
      const d = await getUser(currentUser.uid);
      setUserDoc(d);
    }
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
