import React from 'react';
import { Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';

export function LogoutButton() {
  const { signOutUser } = useAuth();

  const handlePress = () => {
    Alert.alert('Wylogować?', 'Wrócisz do ekranu logowania.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: () => { signOutUser(); } },
    ]);
  };

  return (
    <IconButton
      icon="logout-variant"
      iconColor={colors.red}
      onPress={handlePress}
      accessibilityLabel="Wyloguj"
      size={22}
    />
  );
}
