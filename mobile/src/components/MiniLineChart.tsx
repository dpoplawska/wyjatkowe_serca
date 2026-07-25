import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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

function MiniLineChartImpl({ title, samples, color, unit, yMin, yMax }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  // Insety: padding ekranu (16+16) + padding Card.Content (16+16) = 64 dp,
  // a gifted-charts dokłada do `width` kolumnę etykiet osi Y (~35 dp).
  const chartWidth = Math.max(200, screenWidth - 110);

  // Etykieta osi X tylko co N-ty punkt — przy 30+ pomiarach etykieta przy każdym
  // punkcie dostaje kilka px szerokości i RN ucina wszystkie do "…".
  const data = useMemo(() => {
    const step = Math.max(1, Math.ceil(samples.length / 6));
    return samples.map((s, i) => ({
      value: s.value,
      dateLabel: s.label,
      ...(i % step === 0 ? { label: s.label, labelTextStyle: styles.axisLabel } : {}),
    }));
  }, [samples]);

  const pointerLabelComponent = useCallback(
    (items: { value: number; dateLabel?: string }[]) => {
      const item = items[0];
      if (!item) return null;
      return (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipValue}>{item.value} {unit}</Text>
          {item.dateLabel ? <Text style={styles.tooltipLabel}>{item.dateLabel}</Text> : null}
        </View>
      );
    },
    [unit],
  );

  if (samples.length < MIN_CHART_POINTS) return null;

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
          pointerLabelComponent,
        }}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

export const MiniLineChart = React.memo(MiniLineChartImpl);

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: { fontSize: 12, fontWeight: '700', color: colors.grey2, marginBottom: 4 },
  unit: { fontSize: 10, color: colors.grey2, marginTop: 4 },
  axisLabel: { color: colors.grey2, fontSize: 9, width: 44 },
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
