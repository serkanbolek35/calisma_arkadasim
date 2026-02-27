import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../services/auth.service';
import { getUser } from '../services/user.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        const doc = await getUser(firebaseUser.uid);
        setUserDoc(doc);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUserDoc = async () => {
    if (currentUser) {
      const doc = await getUser(currentUser.uid);
      setUserDoc(doc);
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
