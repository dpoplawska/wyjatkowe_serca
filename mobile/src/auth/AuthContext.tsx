import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  auth as firebaseAuth,
  isFirebaseConfigured,
  googleWebClientId,
  isGoogleSignInConfigured,
} from './firebase';

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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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
      } finally {
        if (!isFirebaseConfigured) setLoading(false);
      }
    })();
  }, []);

  // Subscribe to Firebase auth state if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
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
    if (!isFirebaseConfigured || !firebaseAuth) {
      throw new Error('Firebase nie jest skonfigurowane');
    }
    if (!isGoogleSignInConfigured) {
      throw new Error('Brak googleWebClientId w app.json');
    }
    // Native module — import lazily so JS bundle works without it (e.g. in Expo Go)
    const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: googleWebClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    try {
      const result = await GoogleSignin.signIn();
      // RNGoogleSignin v13+ returns { type: 'success', data: { idToken } }
      const idToken =
        (result as { data?: { idToken?: string } }).data?.idToken ??
        (result as { idToken?: string }).idToken;
      if (!idToken) throw new Error('Brak idToken z Google');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(firebaseAuth, credential);
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
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch {
        // not configured / not on native — ignore
      }
      await signOut(firebaseAuth);
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
