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
  /** Forced lower bound (e.g. SpO₂ floor). When omitted, baseline hugs data min. */
  yMin?: number;
  /** Forced upper bound. When omitted, ceiling hugs data max. */
  yMax?: number;
}

const SECTIONS = 4;

/** Pick a "nice" step size (1/2/5 × 10^n) for axis ticks. */
function niceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const exp = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, exp);
  const frac = rawStep / base;
  let niceFrac: number;
  if (frac <= 1) niceFrac = 1;
  else if (frac <= 2) niceFrac = 2;
  else if (frac <= 2.5) niceFrac = 2.5;
  else if (frac <= 5) niceFrac = 5;
  else niceFrac = 10;
  return niceFrac * base;
}

/**
 * Domain close to the data (like SpO₂ 85–100), with rounded section ticks.
 * Forced yMin/yMax still get snapped to a nice step when only one side is free.
 */
function computeDomain(
  values: number[],
  forcedMin?: number,
  forcedMax?: number,
): { min: number; max: number } {
  const round = (n: number) => Math.round(n * 1000) / 1000;

  // Both bounds forced (e.g. SpO₂ 85–100): keep them exactly — do not expand
  // to a multiple of sections (that produced a spurious 105% ceiling).
  if (forcedMin !== undefined && forcedMax !== undefined) {
    return { min: round(forcedMin), max: round(forcedMax) };
  }

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  let lo = forcedMin ?? dataMin;
  let hi = forcedMax ?? dataMax;

  if (lo === hi) {
    const pad = Math.abs(lo) * 0.05 || 1;
    lo -= pad;
    hi += pad;
  }

  // Soft padding when auto-ranging (mirrors saturation chart tightness).
  const span = hi - lo;
  if (forcedMin === undefined) lo = dataMin - span * 0.08;
  if (forcedMax === undefined) hi = dataMax + span * 0.08;

  const step = niceStep((hi - lo) / SECTIONS);
  // Snap outward so every section boundary is a round number.
  const niceMin = Math.floor(lo / step) * step;
  let niceMax = Math.ceil(hi / step) * step;
  // Ensure at least SECTIONS steps so gifted-charts labels look even.
  if (niceMax - niceMin < step * SECTIONS) {
    niceMax = niceMin + step * SECTIONS;
  }
  return { min: round(niceMin), max: round(niceMax) };
}

function MiniLineChartImpl({ title, samples, color, unit, yMin, yMax }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  // Insets: screen padding (16+16) + Card.Content padding (16+16) = 64 dp,
  // and gifted-charts adds a Y-axis label column (~35 dp) on top of `width`.
  const chartWidth = Math.max(200, screenWidth - 110);

  const domain = useMemo(
    () => computeDomain(samples.map((s) => s.value), yMin, yMax),
    [samples, yMin, yMax],
  );

  // X-axis label only every Nth point — with 30+ samples, one label per point
  // gets a few px of width and RN ellipsizes them all to "…".
  const data = useMemo(() => {
    const step = Math.max(1, Math.ceil(samples.length / 6));
    return samples.map((s, i) => ({
      value: s.value,
      dateLabel: s.label,
      ...(i % step === 0 ? { label: s.label, labelTextStyle: AXIS_LABEL_STYLE } : {}),
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
        yAxisOffset={domain.min}
        maxValue={domain.max - domain.min}
        noOfSections={SECTIONS}
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

// Plain object on purpose: gifted-charts deep-clones each data point and
// stamps a temporary property on every nested object. StyleSheet.create
// freezes its styles in dev builds, so passing one crashes on Hermes with
// "Cannot add new property 'isActiveClone'".
const AXIS_LABEL_STYLE = { color: colors.grey2, fontSize: 9, width: 44 };

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
