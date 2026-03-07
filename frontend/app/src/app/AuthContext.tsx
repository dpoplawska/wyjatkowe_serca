import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithRedirect, signInWithPopup, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase.ts';

export interface AppUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
  loginAsDevUser: (uid: string, name: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [devUser, setDevUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    getRedirectResult(auth)
      .catch(() => {})
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setFirebaseUser(currentUser);
          setLoading(false);
        });
      });
    return () => unsubscribe();
  }, []);

  const user: AppUser | null = devUser ?? firebaseUser;

  const signInWithGoogle = async () => {
    if (window.location.hostname === 'localhost') {
      await signInWithPopup(auth, googleProvider);
    } else {
      await signInWithRedirect(auth, googleProvider);
    }
  };

  const logout = async () => {
    setDevUser(null);
    await signOut(auth);
  };

  const getToken = async (): Promise<string> => {
    if (!user) throw new Error('Brak zalogowanego użytkownika');
    return user.getIdToken();
  };

  const loginAsDevUser = (uid: string, name: string) => {
    setDevUser({
      uid,
      email: name,
      getIdToken: async () => `dev:${uid}`,
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken, loginAsDevUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  return context;
}
