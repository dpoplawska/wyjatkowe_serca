import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { googleWebClientId, isGoogleSignInConfigured } from './firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signInAsDevUser: (uid: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getToken: () => Promise<string>;
}

const DEV_USER_KEY = 'devUser';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [devUser, setDevUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore dev-user session from secure store
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(DEV_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { uid: string; email: string };
          setDevUser({
            uid: parsed.uid,
            email: parsed.email,
            getIdToken: async () => `dev:${parsed.uid}`,
          });
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Subscribe to Firebase native auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setFirebaseUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const user: AppUser | null = useMemo(() => {
    if (devUser) return devUser;
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        getIdToken: () => firebaseUser.getIdToken(),
      };
    }
    return null;
  }, [devUser, firebaseUser]);

  const signInAsDevUser = async (uid: string, name: string) => {
    const newUser: AppUser = {
      uid,
      email: name,
      getIdToken: async () => `dev:${uid}`,
    };
    setDevUser(newUser);
    await SecureStore.setItemAsync(DEV_USER_KEY, JSON.stringify({ uid, email: name }));
  };

  const signInWithGoogle = async () => {
    if (!isGoogleSignInConfigured) {
      throw new Error('Brak googleWebClientId w app.json');
    }
    const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: googleWebClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    try {
      const result = await GoogleSignin.signIn();
      const idToken =
        (result as { data?: { idToken?: string } }).data?.idToken ??
        (result as { idToken?: string }).idToken;
      if (!idToken) throw new Error('Brak idToken z Google');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getAuth(), credential);
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED) return;
      if (code === statusCodes.IN_PROGRESS) return;
      throw err;
    }
  };

  const signOutUser = async () => {
    setDevUser(null);
    await SecureStore.deleteItemAsync(DEV_USER_KEY);
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {
      // ignore
    }
    try {
      await signOut(getAuth());
    } catch {
      // not signed in
    }
  };

  const getToken = async () => {
    if (!user) throw new Error('Brak zalogowanego użytkownika');
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInAsDevUser, signInWithGoogle, signOutUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
