import Constants from 'expo-constants';

const fromConfig = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API = fromConfig ?? 'https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app';
