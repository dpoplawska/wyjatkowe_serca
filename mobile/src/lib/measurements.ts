import { MeasurementEntry, InrEntry } from '../types/api';
import { colors } from '../theme/colors';

export interface StatusColor { color: string; bg: string }

const STATUS_OK: StatusColor = { color: colors.successFg, bg: colors.successBg };
const STATUS_WARN: StatusColor = { color: colors.warningFg, bg: colors.warningBg };
const STATUS_DANGER: StatusColor = { color: colors.dangerFg, bg: colors.dangerBg };

export type ChartRange = '7d' | '1m' | '3m' | '6m' | 'all';

export const CHART_RANGES: { key: ChartRange; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: 'all', label: 'Wszystko' },
];

export const MIN_CHART_POINTS = 4;

export function filterByRange<T extends { date: string }>(entries: T[], range: ChartRange): T[] {
  if (range === 'all') return entries;
  const days = ({ '7d': 7, '1m': 30, '3m': 90, '6m': 180 } as Record<string, number>)[range];
  const cutoff = Date.now() - days * 86400000;
  return entries.filter((e) => new Date(e.date).getTime() >= cutoff);
}

export function satStatus(v: number): StatusColor {
  if (v >= 95) return STATUS_OK;
  if (v >= 90) return STATUS_WARN;
  return STATUS_DANGER;
}

export function tetnoStatus(v: number): StatusColor {
  if (v >= 60 && v <= 100) return STATUS_OK;
  if ((v >= 50 && v < 60) || (v > 100 && v <= 120)) return STATUS_WARN;
  return STATUS_DANGER;
}

export function cisnienieStatus(sys: number, dia: number): StatusColor {
  if (sys >= 90 && sys < 140 && dia >= 60 && dia < 90) return STATUS_OK;
  if ((sys >= 140 && sys < 180) || (dia >= 90 && dia < 110)) return STATUS_WARN;
  return STATUS_DANGER;
}

export function inrStatus(v: number): StatusColor {
  if (v >= 2.0 && v <= 3.5) return STATUS_OK;
  if ((v >= 1.5 && v < 2.0) || (v > 3.5 && v <= 4.0)) return STATUS_WARN;
  return STATUS_DANGER;
}

export const diurezaStatus: StatusColor = { color: colors.infoFg, bg: colors.infoBg };

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeMeasurement(input: {
  date: string;
  saturacja: string;
  tetno: string;
  cisSys: string;
  cisDia: string;
  diureza: string;
  note: string;
}): MeasurementEntry {
  const num = (s: string): number | null => {
    if (!s) return null;
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : null;
  };
  return {
    id: newId(),
    date: input.date,
    saturacja: num(input.saturacja),
    tetno: num(input.tetno),
    cisnienie_skurczowe: num(input.cisSys),
    cisnienie_rozkurczowe: num(input.cisDia),
    diureza: num(input.diureza),
    note: input.note.trim(),
  };
}

export type Sample = { value: number; label: string; timestamp: number };

export function pickSamples(entries: MeasurementEntry[], field: keyof MeasurementEntry): Sample[] {
  return entries
    .filter((e) => typeof e[field] === 'number' && e[field] !== null)
    .map((e) => ({ value: e[field] as number, label: formatDateShort(e.date), timestamp: new Date(e.date).getTime() }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function pickInrSamples(entries: InrEntry[]): Sample[] {
  return entries
    .map((e) => ({ value: e.inr, label: formatDateShort(e.date), timestamp: new Date(e.date).getTime() }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
