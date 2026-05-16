import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { paperTheme } from './src/theme/paperTheme';
import { setUpDoseNotifications } from './src/lib/notifications';
import { navigationRef } from './src/navigation/navRef';

// Keep the native splash screen visible until AuthProvider knows the user
// state. Otherwise users see a blank/spinner gap between splash and content.
SplashScreen.preventAutoHideAsync().catch(() => { /* already hidden */ });

export default function App() {
  useEffect(() => {
    setUpDoseNotifications().catch(() => { /* channel setup is best-effort */ });

    // Safety net: AuthProvider hides the splash when it knows the user
    // state, but if auth never settles (offline, Firebase init failure)
    // we don't want a stuck splash. Force-dismiss after 5s.
    const splashTimeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { /* already hidden */ });
    }, 5000);

    // Tapping a dose reminder opens the Leki tab. We don't deep-link to the
    // specific lek yet — the list naturally surfaces the harmonogram at top.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { lekId?: string } | undefined;
      if (!data?.lekId) return;
      if (navigationRef.isReady()) {
        navigationRef.navigate('Main', { screen: 'Leki' } as never);
      }
    });
    return () => {
      clearTimeout(splashTimeout);
      sub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
