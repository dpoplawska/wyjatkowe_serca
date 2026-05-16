import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Lek } from '../types/api';
import { getNextDoseTime, isDone, frequencyLabel } from './medications';

const DOSE_CHANNEL_ID = 'medication-doses';
const POMIARY_CHANNEL_ID = 'measurements';
const POMIARY_REMINDER_KEY = 'pomiaryReminderTime'; // "HH:MM" or absent = off
const POMIARY_NOTIFICATION_ID = 'pomiary-daily';

// Foreground behaviour: show banner + sound when a dose reminder fires while
// the app is open. Default behaviour suppresses notifications when app is in
// the foreground, which is wrong for medication reminders.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Call once at app startup (App.tsx) — registers the Android channel.
// iOS uses per-notification config so no setup needed there.
export async function setUpDoseNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DOSE_CHANNEL_ID, {
      name: 'Przypomnienia o lekach',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(POMIARY_CHANNEL_ID, {
      name: 'Przypomnienia o pomiarach',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 300],
      sound: 'default',
    });
  }
}

// Request notification permission. Returns true if granted (or already
// granted previously). Call this lazily — when the user first enables
// sledzenie for a medication.
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: next } = await Notifications.requestPermissionsAsync();
  return next === 'granted';
}

// Schedule a dose reminder. Cancels any previous reminder for the same lek.
// Returns the OS identifier (informational; we cancel by lek id instead).
export async function scheduleDoseReminder(lek: Lek): Promise<string | null> {
  // Don't schedule for: not tracking, course finished, no last dose recorded.
  if (!lek.sledzenie || isDone(lek)) {
    await cancelDoseReminder(lek.id);
    return null;
  }
  const next = getNextDoseTime(lek);
  if (!next || next.getTime() <= Date.now()) {
    // Either not enough info to compute a next dose, or it's already due/past.
    // Don't schedule — past-due notifications would fire immediately and feel buggy.
    await cancelDoseReminder(lek.id);
    return null;
  }

  await cancelDoseReminder(lek.id);

  const identifier = doseNotificationId(lek.id);
  const name = lek.nazwa || 'Lek';
  const freq = lek.czestotliwosc ? ` (${frequencyLabel(lek.czestotliwosc)})` : '';

  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: 'Czas na lek',
      body: `${name}${freq}`,
      sound: 'default',
      data: { lekId: lek.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: next,
      channelId: DOSE_CHANNEL_ID,
    },
  });
}

export async function cancelDoseReminder(lekId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(doseNotificationId(lekId));
  } catch {
    // No-op: nothing was scheduled.
  }
}

// Reconcile a full set of meds — useful on first load to align scheduled
// notifications with the latest server state.
export async function reconcileDoseReminders(leki: Lek[]): Promise<void> {
  const desired = new Map<string, Lek>();
  for (const l of leki) {
    if (l.sledzenie && !isDone(l)) desired.set(l.id, l);
  }
  // Cancel anything ours that isn't desired anymore.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const s of scheduled) {
    if (s.identifier.startsWith(DOSE_NOTIFICATION_PREFIX) && !desired.has(idFromDoseNotificationId(s.identifier))) {
      try { await Notifications.cancelScheduledNotificationAsync(s.identifier); } catch { /* ignore */ }
    }
  }
  for (const lek of desired.values()) {
    await scheduleDoseReminder(lek);
  }
}

const DOSE_NOTIFICATION_PREFIX = 'dose:';
function doseNotificationId(lekId: string): string { return `${DOSE_NOTIFICATION_PREFIX}${lekId}`; }
function idFromDoseNotificationId(notifId: string): string { return notifId.replace(DOSE_NOTIFICATION_PREFIX, ''); }

// ── Pomiary daily reminder ──────────────────────────────────────────────
// Persisted as "HH:MM" in SecureStore. Off by default; user opts in via
// the Pomiary screen toggle.

export async function getPomiaryReminderTime(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(POMIARY_REMINDER_KEY);
  } catch {
    return null;
  }
}

export async function setPomiaryReminderTime(timeHHMM: string | null): Promise<void> {
  if (!timeHHMM) {
    try { await Notifications.cancelScheduledNotificationAsync(POMIARY_NOTIFICATION_ID); } catch { /* not scheduled */ }
    try { await SecureStore.deleteItemAsync(POMIARY_REMINDER_KEY); } catch { /* ignore */ }
    return;
  }
  await SecureStore.setItemAsync(POMIARY_REMINDER_KEY, timeHHMM);
  try { await Notifications.cancelScheduledNotificationAsync(POMIARY_NOTIFICATION_ID); } catch { /* not scheduled */ }
  const [h, m] = timeHHMM.split(':').map((n) => parseInt(n, 10));
  await Notifications.scheduleNotificationAsync({
    identifier: POMIARY_NOTIFICATION_ID,
    content: {
      title: 'Czas na pomiar',
      body: 'Pamiętaj o codziennych pomiarach.',
      sound: 'default',
      data: { kind: 'pomiary' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: h,
      minute: m,
      channelId: POMIARY_CHANNEL_ID,
    },
  });
}
