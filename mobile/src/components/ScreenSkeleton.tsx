import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Skeleton } from './Skeleton';
import { colors } from '../theme/colors';

// Initial-load placeholder. The pulsing blocks alone read as "this screen
// hasn't been styled yet" to non-technical users — pairing them with an
// explicit "Wczytywanie…" + spinner above makes the loading state legible.
export function ScreenSkeleton() {
  return (
    <View style={styles.page}>
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Wczytywanie…</Text>
      </View>
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
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingVertical: 4,
  },
  loadingText: { color: colors.grey2, fontSize: 14 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
});
