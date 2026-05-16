import { Lek, DoseEntry } from '../types/api';
import { formatDateTime, newId } from './format';
import dayjs from 'dayjs';

// Older patient records have historia_dawek as a list of ISO strings. New
// shape is { at, dawka }[]. Normalise on read so the rest of the app can
// treat the field uniformly.
export function normalizeHistory(history: unknown): DoseEntry[] {
  if (!Array.isArray(history)) return [];
  return history.map((entry) => {
    if (typeof entry === 'string') return { at: entry, dawka: '' };
    if (entry && typeof entry === 'object' && 'at' in entry) {
      return { at: String((entry as DoseEntry).at ?? ''), dawka: String((entry as DoseEntry).dawka ?? '') };
    }
    return { at: '', dawka: '' };
  });
}

export const CZESTOTLIWOSCI = [
  { label: 'Co 4 godziny', value: 'co_4h' },
  { label: 'Co 6 godzin', value: 'co_6h' },
  { label: 'Trzy razy dziennie', value: 'trzy_razy_dziennie' },
  { label: 'Dwa razy dziennie', value: 'dwa_razy_dziennie' },
  { label: 'Raz dziennie', value: 'raz_dziennie' },
  { label: 'Co 2 dni', value: 'co_2_dni' },
  { label: 'Raz w tygodniu', value: 'raz_w_tygodniu' },
];

export const FREQUENCY_HOURS: Record<string, number> = {
  raz_dziennie: 24,
  dwa_razy_dziennie: 12,
  trzy_razy_dziennie: 8,
  co_6h: 6,
  co_4h: 4,
  co_2_dni: 48,
  raz_w_tygodniu: 168,
};

export const CZAS_TRWANIA_LABELS: Record<string, string> = {
  bezterminowo: 'Bezterminowo',
  dni: 'Liczba dni',
  dawki: 'Liczba dawek',
};

export function frequencyLabel(value: string): string {
  return CZESTOTLIWOSCI.find((c) => c.value === value)?.label ?? value;
}

export function emptyLek(): Lek {
  return {
    id: newId(),
    nazwa: '',
    dawka: '',
    data_pierwszej_dawki: '',
    godzina_pierwszej_dawki: '',
    czestotliwosc: '',
    czas_trwania_typ: '',
    czas_trwania_wartosc: 0,
    sledzenie: false,
    ostatnia_dawka: '',
    historia_dawek: [],
    nastepna_dawka_override: '',
  };
}

export function isDone(lek: Lek): boolean {
  if (lek.czas_trwania_typ === 'dawki' && lek.czas_trwania_wartosc > 0) {
    return lek.historia_dawek.length >= lek.czas_trwania_wartosc;
  }
  if (lek.czas_trwania_typ === 'dni' && lek.czas_trwania_wartosc > 0 && lek.historia_dawek.length > 0) {
    const firstDose = new Date(lek.historia_dawek[lek.historia_dawek.length - 1].at);
    firstDose.setDate(firstDose.getDate() + lek.czas_trwania_wartosc);
    return Date.now() >= firstDose.getTime();
  }
  return false;
}

export function getNextDoseTime(lek: Lek): Date | null {
  if (!lek.sledzenie || !lek.ostatnia_dawka) return null;
  if (lek.nastepna_dawka_override) return new Date(lek.nastepna_dawka_override);
  const intervalMs = (FREQUENCY_HOURS[lek.czestotliwosc] ?? 24) * 3_600_000;
  return new Date(new Date(lek.ostatnia_dawka).getTime() + intervalMs);
}

export function formatNextDose(next: Date): string {
  const d = dayjs(next);
  const time = d.format('HH:mm');
  const today = dayjs().startOf('day');
  const tomorrow = today.add(1, 'day');
  const dayOf = d.startOf('day');
  if (dayOf.isSame(today)) return `dziś o ${time}`;
  if (dayOf.isSame(tomorrow)) return `jutro o ${time}`;
  return `${d.format('DD.MM')} o ${time}`;
}

export function formatHistoryEntry(iso: string): string {
  return formatDateTime(iso);
}
