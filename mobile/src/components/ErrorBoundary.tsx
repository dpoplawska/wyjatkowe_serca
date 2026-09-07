import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { reportError } from '../lib/crash';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render errors below it, reports them to Crashlytics with the
// component stack, and shows a recoverable screen instead of the red box
// (dev) or a silent white screen (release).
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, {
      where: 'render',
      componentStack: (info.componentStack ?? '').slice(0, 1000),
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Coś poszło nie tak</Text>
        <Text style={styles.body}>
          Wystąpił nieoczekiwany błąd. Zgłoszenie zostało wysłane automatycznie. Spróbuj ponownie,
          a jeśli problem się powtarza, uruchom aplikację jeszcze raz.
        </Text>
        <Button mode="contained" onPress={this.reset} buttonColor={colors.blue}>
          Spróbuj ponownie
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: colors.greyBg,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.grey1 },
  body: { fontSize: 14, color: colors.grey2, textAlign: 'center' },
});
