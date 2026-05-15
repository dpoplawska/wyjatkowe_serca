import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: string;
  unit: string;
  status: { color: string; bg: string };
}

export function MetricChip({ label, value, unit, status }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: status.bg }]}>
      <Text style={[styles.label, { color: status.color }]}>{label}</Text>
      <Text style={[styles.value, { color: status.color }]}>{value}</Text>
      {unit ? <Text style={[styles.unit, { color: status.color }]}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  label: { fontSize: 11, fontWeight: '600', marginRight: 2 },
  value: { fontSize: 16, fontWeight: '800' },
  unit: { fontSize: 11, fontWeight: '600' },
});
