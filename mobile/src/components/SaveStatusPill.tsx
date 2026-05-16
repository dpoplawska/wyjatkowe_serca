import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { colors } from '../theme/colors';

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface Props {
  status: SaveStatus;
}

// Floating overlay pill that sits just below the tab header. Stays visible
// regardless of scroll position so the user can confirm an autosave fired
// even when editing fields deep in a long form.
export function SaveStatusPill({ status }: Props) {
  if (status === 'idle') return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.pill, status === 'saved' && styles.pillSaved]}>
        {status === 'saving' && <ActivityIndicator size={14} color="white" />}
        <Text style={styles.text}>
          {status === 'saving' ? 'Zapisywanie…' : 'Zapisane ✓'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(46, 46, 46, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillSaved: {
    backgroundColor: colors.successFg,
  },
  text: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
