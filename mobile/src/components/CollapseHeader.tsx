import React, { useEffect } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

interface Props {
  title: string;
  open: boolean;
  onToggle: () => void;
  // Smaller variant for nested sub-sections (e.g. "Wykresy" under "Historia").
  sub?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Title row that toggles a collapsible section. Chevron icon rotates 180° on
// open/close; row uses TouchableRipple for native press feedback. Shared
// across screens so the affordance reads the same everywhere.
export function CollapseHeader({ title, open, onToggle, sub, style }: Props) {
  const rotation = useSharedValue(open ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, { duration: 180 });
  }, [open, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableRipple
      onPress={onToggle}
      style={[styles.row, sub && styles.rowSub, style]}
      borderless={false}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, sub && styles.titleSub]} numberOfLines={2}>
          {title}
        </Text>
        <AnimatedIcon
          name="chevron-down"
          size={sub ? 18 : 22}
          color={sub ? colors.grey2 : colors.grey1}
          style={iconStyle}
        />
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 8,
    marginBottom: 4,
  },
  rowSub: {
    marginBottom: 2,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
    color: colors.grey1,
  },
  titleSub: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grey2,
  },
});
