import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../theme/colors';

interface TopToastProps {
  message: string | null;
}

// Visual: same pill placement as SaveStatusPill (just below header), but for
// arbitrary informational messages instead of save status.
export function TopToast({ message }: TopToastProps) {
  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

// Hook that returns a show(msg) callback and an element to render. Auto-
// dismisses after `durationMs`. Different from useSnackbar (bottom of screen,
// uses Paper) — this one floats at the top so it doesn't clash with the FAB
// or system gesture areas.
export function useTopToast(durationMs = 2500) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs]);

  const show = useCallback((msg: string) => setMessage(msg), []);
  const element = <TopToast message={message} />;

  return { show, element };
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    // Sits below SaveStatusPill (which uses top:12) so the two can co-exist
    // visually when an autosave and a toast fire from the same gesture.
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successFg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '90%',
  },
  text: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
