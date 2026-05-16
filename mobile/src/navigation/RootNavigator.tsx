import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { navigationRef } from './navRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../auth/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import AcceptInviteScreen from '../screens/AcceptInviteScreen';
import MainTabs from './MainTabs';
import { RootStackParamList } from './types';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'https://wyjatkoweserca.pl', 'https://www.wyjatkoweserca.pl'],
  config: {
    screens: {
      Login: 'app',
      AcceptInvite: 'app/accept',
      Main: {
        screens: {
          Profil: 'app/profil-pacjenta',
          Leki: 'app/leki',
          Pomiary: 'app/pomiary',
          Inr: 'app/kalkulator-inr',
        },
      },
    },
  },
};

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AcceptInvite"
              component={AcceptInviteScreen}
              options={{ headerShown: true, title: 'Zaproszenie' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="AcceptInvite"
              component={AcceptInviteScreen}
              options={{ headerShown: true, title: 'Zaproszenie' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greyBg,
  },
});
