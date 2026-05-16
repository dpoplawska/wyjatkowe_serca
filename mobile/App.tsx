import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { paperTheme } from './src/theme/paperTheme';
import { setUpDoseNotifications } from './src/lib/notifications';

registerTranslation('en', en);

export default function App() {
  useEffect(() => {
    setUpDoseNotifications().catch(() => { /* channel setup is best-effort */ });
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
