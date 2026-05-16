import dayjs from 'dayjs';

export function newId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// All in-app display dates follow Polish convention: DD.MM.YYYY, HH:mm.
export function formatDateTime(iso: string): string {
  return dayjs(iso).format('DD.MM.YYYY, HH:mm');
}

export function formatDateShort(iso: string): string {
  return dayjs(iso).format('DD.MM');
}

// ISO date (YYYY-MM-DD) — used for Operacja.data which is stored as a date
// string without time. Backend matches the web's <input type="date"> format.
export function parseIsoDate(s: string): Date | null {
  if (!s) return null;
  const d = dayjs(s, 'YYYY-MM-DD');
  return d.isValid() ? d.toDate() : null;
}

export function toIsoDate(d: Date): string {
  return dayjs(d).format('YYYY-MM-DD');
}
