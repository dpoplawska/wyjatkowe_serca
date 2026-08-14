import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { colors } from '../theme/colors';

// Small floating pill shown while a background revalidation is in flight —
// the screen underneath stays fully interactive (pointerEvents="none").
export function BackgroundRefreshIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.pill}>
        <ActivityIndicator size={12} color={colors.blue} />
        <Text style={styles.text}>Odświeżanie…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    right: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  text: { fontSize: 11, color: colors.grey2 },
});
