// Crash and error reporting via Firebase Crashlytics.
//
// Native crashes and uncaught JS errors are captured by the SDK on its own.
// This module covers what it can't see: errors we catch ourselves (render
// errors in ErrorBoundary, failed API calls) and who was signed in.
//
// Every call is wrapped so a reporting failure can never break the app.
import {
  getCrashlytics,
  log as crashLog,
  recordError as crashRecordError,
  setAttributes,
  setUserId,
} from '@react-native-firebase/crashlytics';

function crashlytics() {
  return getCrashlytics();
}

// Record a caught error as a non-fatal event. `context` becomes searchable
// keys on the report (e.g. { where: 'api', path: '/documents', status: '500' }).
export function reportError(error: unknown, context: Record<string, string> = {}): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const c = crashlytics();
    if (Object.keys(context).length > 0) setAttributes(c, context).catch(() => {});
    crashRecordError(c, err, context.where);
  } catch {
    // never let reporting throw
  }
}

// Breadcrumb attached to the next report (last ~64 KB kept).
export function logBreadcrumb(message: string): void {
  try {
    crashLog(crashlytics(), message);
  } catch {
    // ignore
  }
}

// Firebase uid only — no e-mail or name, so reports stay pseudonymous.
export function setCrashUser(uid: string | null): void {
  try {
    setUserId(crashlytics(), uid ?? '').catch(() => {});
  } catch {
    // ignore
  }
}
