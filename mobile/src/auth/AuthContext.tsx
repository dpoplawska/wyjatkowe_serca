import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { googleWebClientId, isGoogleSignInConfigured } from './firebase';
import { clearAllCaches, hydrateCache } from '../lib/dataCache';
import { setCrashUser } from '../lib/crash';
import { API } from '../api/config';

export interface AppUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  // null = not checked yet for the current user; false = ConsentScreen gates the app.
  consentAccepted: boolean | null;
  setConsentAccepted: (accepted: boolean) => void;
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
          await hydrateCache(parsed.uid).catch(() => {});
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
    const unsub = onAuthStateChanged(getAuth(), async (u) => {
      // Warm the in-memory data cache before the first screen mounts, while
      // the splash is still up — screens read it synchronously on first render.
      if (u) await hydrateCache(u.uid).catch(() => {});
      setCrashUser(u?.uid ?? null);
      setFirebaseUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Once we know who the user is (or that they're not signed in), dismiss
  // the splash screen so the next surface (Login or MainTabs) takes over
  // without a blank/spinner gap.
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => { /* already hidden */ });
    }
  }, [loading]);

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

  // Consent gate: every patient-data route on the API refuses accounts
  // without the current consent record, so ask once per signed-in user.
  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) {
      setConsentAccepted(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API}/consent`, {
          headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': '1' },
        });
        const body = res.ok ? ((await res.json()) as { accepted?: boolean }) : {};
        if (!cancelled) setConsentAccepted(Boolean(body.accepted));
      } catch {
        // Offline: assume the stored consent still holds so cached data stays
        // reachable; the API re-checks on every request anyway.
        if (!cancelled) setConsentAccepted(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const signInAsDevUser = useCallback(async (uid: string, name: string) => {
    const newUser: AppUser = {
      uid,
      email: name,
      getIdToken: async () => `dev:${uid}`,
    };
    setDevUser(newUser);
    await SecureStore.setItemAsync(DEV_USER_KEY, JSON.stringify({ uid, email: name }));
  }, []);

  const signInWithGoogle = useCallback(async () => {
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
  }, []);

  const signOutUser = useCallback(async () => {
    setDevUser(null);
    // Cached medical data must not survive a sign-out on a shared device.
    await clearAllCaches();
    await SecureStore.deleteItemAsync(DEV_USER_KEY);
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {
      // GoogleSignin module unavailable (Expo Go) — skip.
    }
    try {
      await signOut(getAuth());
    } catch {
      // User wasn't Firebase-signed-in (dev user only) — skip.
    }
  }, []);

  // Stable across renders while `user` is unchanged. Consumers depend on
  // identity equality (autosave debounce effects, useCallback deps).
  const getToken = useCallback(async () => {
    if (!user) throw new Error('Brak zalogowanego użytkownika');
    return user.getIdToken();
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, consentAccepted, setConsentAccepted, signInAsDevUser, signInWithGoogle, signOutUser, getToken }),
    [user, loading, consentAccepted, signInAsDevUser, signInWithGoogle, signOutUser, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
