import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { colors } from '../theme/colors';

// Generic "screen loading" placeholder. Three card-like blocks roughly
// matching the layout most screens land on (title + sections).
export function ScreenSkeleton() {
  return (
    <View style={styles.page}>
      <Skeleton height={28} width="60%" style={{ marginBottom: 16 }} />
      <View style={styles.card}>
        <Skeleton height={16} width="40%" style={{ marginBottom: 12 }} />
        <Skeleton height={48} style={{ marginBottom: 8 }} />
        <Skeleton height={48} />
      </View>
      <View style={styles.card}>
        <Skeleton height={16} width="50%" style={{ marginBottom: 12 }} />
        <Skeleton height={64} />
      </View>
      <View style={styles.card}>
        <Skeleton height={16} width="35%" style={{ marginBottom: 12 }} />
        <Skeleton height={64} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: colors.greyBg },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
});
