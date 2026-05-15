// React Native Firebase — initializes from google-services.json (Android) /
// GoogleService-Info.plist (iOS) at build time. No JS config needed.
// API key restrictions can stay strict (Android headers verified by Google).

import { getAuth } from '@react-native-firebase/auth';
import Constants from 'expo-constants';

interface Extras {
  googleWebClientId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extras;

export const googleWebClientId = extra.googleWebClientId ?? '';
export const isGoogleSignInConfigured = Boolean(googleWebClientId);

// RNFB auth() is initialized lazily; calling getAuth() before native init
// would throw, but by the time any screen mounts, init is done.
export const auth = getAuth;
