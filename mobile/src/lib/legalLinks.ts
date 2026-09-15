import { Linking } from 'react-native';

// Same PDFs the website footer links to (Firebase Storage, public read).
const BUCKET = 'wyjatkowe-serca.firebasestorage.app';
const storageUrl = (path: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

export const PRIVACY_POLICY_URL = storageUrl('Polityka_prywatnosci_aplikacji.pdf');
export const TERMS_URL = storageUrl('Regulamin_serwisu_FWS.pdf');

export function openPrivacyPolicy(): Promise<void> {
  return Linking.openURL(PRIVACY_POLICY_URL).then(() => undefined);
}

export function openTerms(): Promise<void> {
  return Linking.openURL(TERMS_URL).then(() => undefined);
}
