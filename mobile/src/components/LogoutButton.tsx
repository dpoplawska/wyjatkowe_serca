import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';

export function LogoutButton() {
  const { signOutUser } = useAuth();
  return (
    <Pressable onPress={signOutUser} style={styles.btn} hitSlop={8}>
      <Text style={styles.text}>Wyloguj</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6 },
  text: { color: colors.red, fontSize: 14, fontWeight: '600' },
});
