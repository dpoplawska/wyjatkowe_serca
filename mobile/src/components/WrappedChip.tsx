import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  onClose?: () => void;
}

export function WrappedChip({ label, onClose }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{label}</Text>
      {onClose && (
        <Pressable onPress={onClose} style={styles.close} hitSlop={8}>
          <MaterialCommunityIcons name="close-circle" size={18} color={colors.red} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8ec',
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    marginBottom: 6,
    alignSelf: 'stretch',
  },
  text: {
    flex: 1,
    color: colors.red,
    fontSize: 13,
    lineHeight: 17,
    marginRight: 6,
  },
  close: {
    padding: 2,
  },
});
