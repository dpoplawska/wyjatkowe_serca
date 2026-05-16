import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
}

// Friendly hint shown on a screen with no user data yet. Kept minimal so it
// doesn't compete with the actual form/list when there *is* data.
export function EmptyState({ icon, title, message }: Props) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={56} color={colors.blue} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.grey1,
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.grey2,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
