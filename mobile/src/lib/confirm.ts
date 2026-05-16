import { Alert } from 'react-native';

interface ConfirmDeleteOptions {
  title: string;
  message?: string;
  onConfirm: () => void;
}

// Native confirmation dialog with the destructive-action shape used across
// the app: "Anuluj" + "Usuń" (red). Defaults the message to the standard
// "this can't be undone" copy so call sites don't drift.
export function confirmDelete({ title, message, onConfirm }: ConfirmDeleteOptions): void {
  Alert.alert(title, message ?? 'Tej zmiany nie można cofnąć.', [
    { text: 'Anuluj', style: 'cancel' },
    { text: 'Usuń', style: 'destructive', onPress: onConfirm },
  ]);
}
