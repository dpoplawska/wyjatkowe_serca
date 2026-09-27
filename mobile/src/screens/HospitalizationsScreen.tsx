import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { PageScroll } from '../components/PageScroll';
import { ScreenSkeleton } from '../components/ScreenSkeleton';
import { EmptyState } from '../components/EmptyState';
import { SelectMenu } from '../components/SelectMenu';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { SaveStatusPill, SaveStatus } from '../components/SaveStatusPill';
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator';
import { confirmDelete } from '../lib/confirm';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { readCacheSync, writeCache } from '../lib/dataCache';
import { useSnackbar } from '../hooks/useSnackbar';
import { TYPY_WPISU_HISTORII } from '../lib/patientProfileOptions';
import { HospitalizacjaEntry, HospitalizationsData } from '../types/api';
import { newId, parseIsoDate, toIsoDate } from '../lib/format';
import { colors } from '../theme/colors';

const emptyEntry = (): HospitalizacjaEntry => ({
  id: newId(),
  typ: 'Hospitalizacja',
  data_od: toIsoDate(new Date()),
  data_do: '',
  placowka: '',
  oddzial: '',
  powod: '',
  przebieg: '',
});

function fmt(iso: string): string {
  const d = parseIsoDate(iso);
  return d ? dayjs(d).format('DD.MM.YYYY') : '';
}

// "1 dzień" / "2 dni" / "9 dni" — Polish plural for the stay length. Both ends
// inclusive, so a same-day admission and discharge counts as one day.
function stayLength(from: string, to: string): string {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  if (!a || !b) return '';
  const days = dayjs(b).startOf('day').diff(dayjs(a).startOf('day'), 'day') + 1;
  if (days < 1) return '';
  return days === 1 ? '1 dzień' : `${days} dni`;
}

function dateRange(e: HospitalizacjaEntry): string {
  const from = fmt(e.data_od);
  if (!from) return 'Bez daty';
  if (!e.data_do) return `od ${from} · trwa`;
  const len = stayLength(e.data_od, e.data_do);
  return len ? `${from} – ${fmt(e.data_do)} · ${len}` : `${from} – ${fmt(e.data_do)}`;
}

export default function HospitalizationsScreen() {
  const { getToken, user } = useAuth();
  const uid = user?.uid;

  const [initialCache] = useState(() =>
    uid ? readCacheSync<Partial<HospitalizationsData>>(uid, 'hospitalizations')?.entries ?? null : null,
  );
  const [entries, setEntries] = useState<HospitalizacjaEntry[]>(initialCache ?? []);
  const [fetching, setFetching] = useState(initialCache === null);
  const [revalidating, setRevalidating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Until the first revalidation settles the list may be a stale cached copy;
  // editing it would make the next full-document PUT clobber newer changes
  // from another device. Unlocks on failure too, so offline is never read-only.
  const [synced, setSynced] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [openId, setOpenId] = useState<string | null>(null);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar();

  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const showSnackbarRef = useRef(showSnackbar);
  showSnackbarRef.current = showSnackbar;

  const load = useCallback(async () => {
    setRevalidating(true);
    try {
      const data = await makeApi(getToken).getHospitalizations();
      if (data?.entries) {
        if (uid) writeCache(uid, 'hospitalizations', data);
        if (!dirtyRef.current) setEntries(data.entries);
      }
    } catch {
      // First visit returns an empty document, or we're offline — keep what we have.
    } finally {
      setFetching(false);
      setRevalidating(false);
      setSynced(true);
    }
  }, [getToken, uid]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Debounced autosave, same shape as the profile and medication screens: the
  // whole document is written, so the snapshot is compared on the way back to
  // avoid clearing `dirty` when the user typed while the request was in flight.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      const snapshot = entriesRef.current;
      setSaveStatus('saving');
      try {
        await makeApi(getToken).putHospitalizations({ entries: snapshot });
        if (uid) writeCache(uid, 'hospitalizations', { entries: snapshot });
        if (entriesRef.current === snapshot) setDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (e) {
        showSnackbarRef.current(e instanceof Error ? `Błąd zapisu: ${e.message}` : 'Błąd zapisu');
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [dirty, entries, getToken, uid]);

  const guard = (): boolean => {
    if (synced) return true;
    showSnackbar('Trwa odświeżanie danych — spróbuj za chwilę.');
    return false;
  };

  const mutate = (next: HospitalizacjaEntry[]) => {
    setEntries(next);
    setDirty(true);
  };

  const addEntry = () => {
    if (!guard()) return;
    const entry = emptyEntry();
    mutate([entry, ...entries]);
    setOpenId(entry.id);
  };

  const setField = <K extends keyof HospitalizacjaEntry>(
    id: string,
    key: K,
    value: HospitalizacjaEntry[K],
  ) => {
    if (!guard()) return;
    mutate(entries.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
  };

  const removeEntry = (id: string) => {
    if (!guard()) return;
    confirmDelete({
      title: 'Usunąć wpis z historii?',
      onConfirm: () => mutate(entries.filter((e) => e.id !== id)),
    });
  };

  // Newest first; entries without a start date sink to the bottom.
  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b.data_od || '').localeCompare(a.data_od || '')),
    [entries],
  );

  if (fetching) return <ScreenSkeleton />;

  return (
    <View style={styles.page}>
      <PageScroll refreshing={refreshing} onRefresh={refresh}>
        {entries.length === 0 ? (
          <EmptyState
            icon="hospital-building"
            title="Historia leczenia jest pusta"
            message="Zapisz pobyty w szpitalu, zabiegi i konsultacje, żeby mieć je pod ręką na wizycie i przy zmianie ośrodka."
            actionLabel="Dodaj pierwszy wpis"
            onAction={addEntry}
          />
        ) : (
          <>
            <Button mode="contained" icon="plus" onPress={addEntry} style={styles.addBtn}>
              Dodaj wpis
            </Button>

            {sorted.map((entry, i) => {
              const open = openId === entry.id;
              return (
                <View key={entry.id} style={styles.row}>
                  <View style={styles.rail}>
                    <View style={styles.dot} />
                    {i < sorted.length - 1 && <View style={styles.line} />}
                  </View>

                  <Card style={styles.card} mode="elevated">
                    <Pressable onPress={() => setOpenId(open ? null : entry.id)}>
                      <Card.Content>
                        <View style={styles.headerRow}>
                          <View style={styles.headerText}>
                            <View style={styles.badgeRow}>
                              <Text style={styles.badge}>{entry.typ || 'Wpis'}</Text>
                              {!entry.data_do && !!entry.data_od && (
                                <Text style={[styles.badge, styles.badgeOngoing]}>trwa</Text>
                              )}
                            </View>
                            <Text style={styles.dates}>{dateRange(entry)}</Text>
                            {!!entry.placowka && (
                              <Text style={styles.place} numberOfLines={open ? undefined : 1}>
                                {entry.placowka}
                                {entry.oddzial ? ` · ${entry.oddzial}` : ''}
                              </Text>
                            )}
                            {!!entry.powod && (
                              <Text style={styles.reason} numberOfLines={open ? undefined : 2}>
                                {entry.powod}
                              </Text>
                            )}
                          </View>
                          <MaterialCommunityIcons
                            name={open ? 'chevron-up' : 'chevron-down'}
                            size={22}
                            color={colors.grey2}
                          />
                        </View>
                      </Card.Content>
                    </Pressable>

                    {open && (
                      <Card.Content style={styles.form}>
                        <SelectMenu
                          label="Rodzaj wpisu"
                          value={entry.typ}
                          onChange={(v) => setField(entry.id, 'typ', v)}
                          options={TYPY_WPISU_HISTORII}
                        />
                        <DateTimePickerField
                          label="Data od"
                          mode="date"
                          value={parseIsoDate(entry.data_od)}
                          onChange={(d) => setField(entry.id, 'data_od', toIsoDate(d))}
                        />
                        <DateTimePickerField
                          label="Data do (pusta = trwa)"
                          mode="date"
                          value={parseIsoDate(entry.data_do)}
                          onChange={(d) => setField(entry.id, 'data_do', toIsoDate(d))}
                          onClear={() => setField(entry.id, 'data_do', '')}
                        />
                        <TextInput
                          mode="outlined"
                          label="Placówka"
                          value={entry.placowka}
                          onChangeText={(v) => setField(entry.id, 'placowka', v)}
                          placeholder="np. Centrum Zdrowia Dziecka"
                          placeholderTextColor={colors.grey3}
                        />
                        <TextInput
                          mode="outlined"
                          label="Oddział"
                          value={entry.oddzial}
                          onChangeText={(v) => setField(entry.id, 'oddzial', v)}
                          placeholder="np. Kardiochirurgia"
                          placeholderTextColor={colors.grey3}
                        />
                        <TextInput
                          mode="outlined"
                          label="Powód"
                          value={entry.powod}
                          onChangeText={(v) => setField(entry.id, 'powod', v)}
                          placeholder="np. korekcja całkowita"
                          placeholderTextColor={colors.grey3}
                          multiline
                          numberOfLines={2}
                        />
                        <TextInput
                          mode="outlined"
                          label="Przebieg"
                          value={entry.przebieg}
                          onChangeText={(v) => setField(entry.id, 'przebieg', v)}
                          placeholder="np. zabieg bez powikłań, wypis do domu"
                          placeholderTextColor={colors.grey3}
                          multiline
                          numberOfLines={4}
                        />
                        <View style={styles.actions}>
                          <IconButton
                            icon="delete-outline"
                            iconColor={colors.red}
                            onPress={() => removeEntry(entry.id)}
                            accessibilityLabel="Usuń wpis"
                          />
                        </View>
                      </Card.Content>
                    )}
                  </Card>
                </View>
              );
            })}
          </>
        )}
      </PageScroll>

      <SaveStatusPill status={saveStatus} />
      <BackgroundRefreshIndicator visible={revalidating && !refreshing} />
      {snackbarEl}
    </View>
  );
}

const RAIL = 22;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  addBtn: { marginBottom: 14 },

  row: { flexDirection: 'row' },
  rail: { width: RAIL, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
    backgroundColor: colors.blue,
  },
  line: { flex: 1, width: 2, marginTop: 2, backgroundColor: colors.border },

  card: { flex: 1, marginBottom: 12, marginLeft: 10, backgroundColor: colors.cardBg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  headerText: { flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.infoFg,
    backgroundColor: colors.infoBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  badgeOngoing: { color: colors.warningFg, backgroundColor: colors.warningBg },
  dates: { fontSize: 13, fontWeight: '700', color: colors.grey1 },
  place: { fontSize: 13, color: colors.grey2, marginTop: 2 },
  reason: { fontSize: 13, color: colors.grey1, marginTop: 4 },

  form: { gap: 16, paddingTop: 4, paddingBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
