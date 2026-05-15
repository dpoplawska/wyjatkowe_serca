import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Sample, MIN_CHART_POINTS } from '../lib/measurements';
import { colors } from '../theme/colors';

interface Props {
  title: string;
  samples: Sample[];
  color: string;
  unit: string;
  yMin?: number;
  yMax?: number;
}

export function MiniLineChart({ title, samples, color, unit, yMin, yMax }: Props) {
  if (samples.length < MIN_CHART_POINTS) return null;

  const data = samples.map((s) => ({
    value: s.value,
    label: s.label,
    dataPointText: '',
  }));

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(200, screenWidth - 80);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={data}
        thickness={2}
        color={color}
        hideRules
        hideDataPoints={data.length > 20}
        dataPointsRadius={3}
        dataPointsColor={color}
        width={chartWidth}
        height={100}
        initialSpacing={10}
        spacing={Math.max(8, chartWidth / Math.max(1, data.length))}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.grey2, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.grey2, fontSize: 9 }}
        adjustToWidth
        yAxisOffset={yMin}
        maxValue={yMax !== undefined && yMin !== undefined ? yMax - yMin : undefined}
        noOfSections={4}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: { fontSize: 12, fontWeight: '700', color: colors.grey2, marginBottom: 4 },
  unit: { fontSize: 10, color: colors.grey2, marginTop: 4 },
});
