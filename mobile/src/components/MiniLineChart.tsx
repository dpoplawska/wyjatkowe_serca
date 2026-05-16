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

// Small trend chart with tap-to-inspect. gifted-charts' pointerConfig renders
// a vertical guideline + label when the user touches a data point.
export function MiniLineChart({ title, samples, color, unit, yMin, yMax }: Props) {
  if (samples.length < MIN_CHART_POINTS) return null;

  const data = samples.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(200, screenWidth - 72);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={data}
        thickness={2}
        color={color}
        areaChart
        startFillColor={color}
        startOpacity={0.18}
        endFillColor={color}
        endOpacity={0.02}
        hideRules
        hideDataPoints={data.length > 30}
        dataPointsRadius={3}
        dataPointsColor={color}
        width={chartWidth}
        height={140}
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
        pointerConfig={{
          pointerStripHeight: 140,
          pointerStripColor: colors.border,
          pointerStripWidth: 1,
          pointerColor: color,
          radius: 5,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number; label?: string }[]) => {
            const item = items[0];
            if (!item) return null;
            return (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipValue}>{item.value} {unit}</Text>
                {item.label ? <Text style={styles.tooltipLabel}>{item.label}</Text> : null}
              </View>
            );
          },
        }}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: { fontSize: 12, fontWeight: '700', color: colors.grey2, marginBottom: 4 },
  unit: { fontSize: 10, color: colors.grey2, marginTop: 4 },
  tooltip: {
    backgroundColor: colors.grey1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 72,
  },
  tooltipValue: { color: 'white', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  tooltipLabel: { color: 'white', opacity: 0.7, fontSize: 10, textAlign: 'center', marginTop: 2 },
});
