import React, { useCallback, useMemo, useState } from 'react';
import { Snackbar } from 'react-native-paper';

interface UseSnackbarResult {
  show: (msg: string) => void;
  element: React.ReactElement;
}

// Returns a snackbar pair: `show(msg)` and an `element` to render somewhere
// in the screen tree. Built as React.createElement so this file stays .ts
// (no JSX, no .tsx rename needed).
export function useSnackbar(durationMs = 3000): UseSnackbarResult {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => setMessage(msg), []);
  const onDismiss = useCallback(() => setMessage(null), []);

  const element = useMemo(
    () => React.createElement(Snackbar, {
      visible: message !== null,
      onDismiss,
      duration: durationMs,
      children: message ?? '',
    }),
    [message, durationMs, onDismiss],
  );

  return { show, element };
}
