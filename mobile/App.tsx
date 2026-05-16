import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { paperTheme } from './src/theme/paperTheme';
import { setUpDoseNotifications } from './src/lib/notifications';
import { navigationRef } from './src/navigation/navRef';

export default function App() {
  useEffect(() => {
    setUpDoseNotifications().catch(() => { /* channel setup is best-effort */ });

    // Tapping a dose reminder opens the Leki tab. We don't deep-link to the
    // specific lek yet — the list naturally surfaces the harmonogram at top.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { lekId?: string } | undefined;
      if (!data?.lekId) return;
      if (navigationRef.isReady()) {
        navigationRef.navigate('Main', { screen: 'Leki' } as never);
      }
    });
    return () => sub.remove();
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
