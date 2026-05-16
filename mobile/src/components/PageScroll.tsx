import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

// Wraps screen scroll content with:
//  - KeyboardAvoidingView (so on-screen keyboard doesn't cover the active input)
//  - safe-area bottom inset (so the last button isn't under a home indicator)
//  - optional pull-to-refresh
export function PageScroll({ children, contentContainerStyle, refreshing, onRefresh }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh
            ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.red} colors={[colors.red]} />
            : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
});
