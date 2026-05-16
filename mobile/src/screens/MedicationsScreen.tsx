import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { PageScroll } from '../components/PageScroll';
import {
  Text,
  TextInput,
  Button,
  Switch,
  ActivityIndicator,
  IconButton,
  Card,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { Lek } from '../types/api';
import {
  CZESTOTLIWOSCI,
  emptyLek,
  getNextDoseTime,
  formatNextDose,
  formatHistoryEntry,
  isDone,
} from '../lib/medications';
import { SelectMenu } from '../components/SelectMenu';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { useSnackbar } from '../hooks/useSnackbar';
import {
  ensureNotificationPermission,
  reconcileDoseReminders,
} from '../lib/notifications';
import { colors } from '../theme/colors';

const CZESTOTLIWOSCI_LABELS = CZESTOTLIWOSCI.map((c) => c.label);
const CZAS_TRWANIA_OPTIONS = [
  { label: 'Bezterminowo', value: 'bezterminowo' },
  { label: 'Liczba dni', value: 'dni' },
  { label: 'Liczba dawek', value: 'dawki' },
];

export default function MedicationsScreen() {
  const { getToken } = useAuth();
  const [leki, setLeki] = useState<Lek[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(true);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar();

  const load = useCallback(async () => {
    try {
      const api = makeApi(getToken);
      const data = await api.getMedications();
      if (data && Array.isArray(data.leki)) {
        const next = data.leki.map((l) => ({ ...emptyLek(), ...l }));
        setLeki(next);
        // Align OS-scheduled dose reminders with the loaded state.
        reconcileDoseReminders(next).catch(() => { /* best effort */ });
      }
    } catch {
      // first visit
    } finally {
      setFetching(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const updateLek = <K extends keyof Lek>(index: number, field: K, value: Lek[K]) => {
    setLeki((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // User enables tracking → prompt for notification permission so they actually
    // get reminders once they save. No-op if already granted.
    if (field === 'sledzenie' && value === true) {
      ensureNotificationPermission().then((granted) => {
        if (!granted) {
          showSnackbar('Powiadomienia są wyłączone — włącz je w ustawieniach systemowych, aby dostawać przypomnienia.');
        }
      });
    }
  };

  const addLek = () => setLeki((prev) => [...prev, emptyLek()]);
  const removeLek = (index: number) => setLeki((prev) => prev.filter((_, i) => i !== index));

  const persist = async (updated: Lek[], successMsg: string) => {
    setSaving(true);
    try {
      const api = makeApi(getToken);
      await api.putMedications({ leki: updated });
      // Realign OS dose reminders to match persisted state — covers all of:
      // mark-given, undo, override, sledzenie toggle, frequency change, delete.
      reconcileDoseReminders(updated).catch(() => { /* best effort */ });
      showSnackbar(successMsg);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => persist(leki, 'Leki zapisane.');

  const markGiven = (index: number, at?: Date) => {
    const now = (at ?? new Date()).toISOString();
    const updated = leki.map((lek, i) => {
      if (i !== index) return lek;
      return {
        ...lek,
        ostatnia_dawka: now,
        historia_dawek: [now, ...lek.historia_dawek],
        nastepna_dawka_override: '',
      };
    });
    setLeki(updated);
    persist(updated, 'Podanie zapisane.');
  };

  const undoLastGiven = (index: number) => {
    const updated = leki.map((lek, i) => {
      if (i !== index) return lek;
      const newHistory = lek.historia_dawek.slice(1);
      return {
        ...lek,
        ostatnia_dawka: newHistory[0] ?? '',
        historia_dawek: newHistory,
      };
    });
    setLeki(updated);
    persist(updated, 'Cofnięto ostatnie podanie.');
  };

  const saveOverride = (index: number, override: string) => {
    const updated = leki.map((lek, i) => (i === index ? { ...lek, nastepna_dawka_override: override } : lek));
    setLeki(updated);
    persist(updated, override ? 'Czas dawki zaktualizowany.' : 'Zmiana usunięta.');
  };

  const tracked = useMemo(() => leki.filter((l) => l.sledzenie), [leki]);

  if (fetching) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <PageScroll refreshing={refreshing} onRefresh={refresh}>

        {tracked.length > 0 && (
          <Card style={styles.shortlist} mode="elevated">
            <Pressable onPress={() => setShortlistOpen((v) => !v)} style={styles.shortlistToggle}>
              <Text style={styles.shortlistToggleText}>Harmonogram dawek</Text>
              <Text style={styles.chevron}>{shortlistOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {shortlistOpen && (
              <View style={styles.shortlistBody}>
                {tracked.map((lek, i) => {
                  const globalIndex = leki.indexOf(lek);
                  const done = isDone(lek);
                  const next = getNextDoseTime(lek);
                  return (
                    <View key={lek.id} style={[styles.shortlistRow, i > 0 && styles.shortlistRowBorder, done && { opacity: 0.5 }]}>
                      <Text style={styles.shortlistName} numberOfLines={2}>
                        {lek.nazwa || 'bez nazwy'}
                      </Text>
                      {done ? (
                        <Text style={styles.doneLabel}>zakończony</Text>
                      ) : (
                        <>
                          <Text style={styles.shortlistNext}>
                            {next ? `następna: ${formatNextDose(next)}` : '—'}
                          </Text>
                          <Button
                            mode="outlined"
                            icon="pill"
                            compact
                            onPress={() => markGiven(globalIndex)}
                            textColor={colors.blue}
                            style={{ borderColor: colors.blue }}
                          >
                            Podanie
                          </Button>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        )}

        {leki.map((lek, i) => (
          <LekCard
            key={lek.id}
            lek={lek}
            index={i}
            onChange={(field, value) => updateLek(i, field, value)}
            onRemove={() => removeLek(i)}
            onMarkGiven={(at) => markGiven(i, at)}
            onUndoGiven={() => undoLastGiven(i)}
            onSaveOverride={(o) => saveOverride(i, o)}
          />
        ))}

        <Button mode="outlined" icon="plus-circle-outline" onPress={addLek} textColor={colors.red} style={{ borderColor: colors.red, borderStyle: 'dashed', alignSelf: 'flex-start', marginVertical: 8 }}>
          Dodaj lek
        </Button>

        <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.saveBtn}>
          Zapisz leki
        </Button>
      </PageScroll>

      {snackbarEl}
    </View>
  );
}

function LekCard({
  lek,
  index,
  onChange,
  onRemove,
  onMarkGiven,
  onUndoGiven,
  onSaveOverride,
}: {
  lek: Lek;
  index: number;
  onChange: <K extends keyof Lek>(field: K, value: Lek[K]) => void;
  onRemove: () => void;
  onMarkGiven: (at?: Date) => void;
  onUndoGiven: () => void;
  onSaveOverride: (override: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [overrideDate, setOverrideDate] = useState<Date | null>(null);
  const [overrideEditing, setOverrideEditing] = useState(false);
  const [givenEditing, setGivenEditing] = useState(false);
  const [givenDate, setGivenDate] = useState<Date | null>(null);

  const next = getNextDoseTime(lek);
  const done = isDone(lek);
  const sorted = [...lek.historia_dawek].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const history = showFullHistory ? sorted : sorted.slice(0, 3);

  const openOverride = () => {
    setOverrideDate(next ?? new Date());
    setOverrideEditing(true);
  };

  const applyOverride = () => {
    if (overrideDate) {
      onSaveOverride(overrideDate.toISOString());
      setOverrideEditing(false);
    }
  };

  return (
    <Card style={styles.lekCard} mode="elevated">
      <Card.Content>
        <View style={styles.lekHeader}>
          <Pressable onPress={() => setCollapsed((v) => !v)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.lekTitle}>{lek.nazwa || `Lek ${index + 1}`}</Text>
            <Text style={styles.chevron}>{collapsed ? '▼' : '▲'}</Text>
          </Pressable>
          <IconButton icon="delete-outline" iconColor={colors.red} onPress={onRemove} />
        </View>

        {!collapsed && (
          <>
            <Divider style={{ marginBottom: 16 }} />
            <View style={{ gap: 16 }}>
              <TextInput
                mode="outlined"
                label="Nazwa leku"
                value={lek.nazwa}
                onChangeText={(v) => onChange('nazwa', v)}
              />

              <SelectMenu
                label="Częstotliwość"
                value={CZESTOTLIWOSCI.find((c) => c.value === lek.czestotliwosc)?.label ?? ''}
                onChange={(label) => {
                  const found = CZESTOTLIWOSCI.find((c) => c.label === label);
                  if (found) onChange('czestotliwosc', found.value);
                }}
                options={CZESTOTLIWOSCI_LABELS}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SelectMenu
                    label="Czas trwania"
                    value={CZAS_TRWANIA_OPTIONS.find((o) => o.value === lek.czas_trwania_typ)?.label ?? ''}
                    onChange={(label) => {
                      const found = CZAS_TRWANIA_OPTIONS.find((o) => o.label === label);
                      if (found) onChange('czas_trwania_typ', found.value);
                    }}
                    options={CZAS_TRWANIA_OPTIONS.map((o) => o.label)}
                  />
                </View>
                {(lek.czas_trwania_typ === 'dni' || lek.czas_trwania_typ === 'dawki') && (
                  <TextInput
                    mode="outlined"
                    label={lek.czas_trwania_typ === 'dni' ? 'Dni' : 'Dawki'}
                    value={lek.czas_trwania_wartosc ? String(lek.czas_trwania_wartosc) : ''}
                    onChangeText={(v) => onChange('czas_trwania_wartosc', parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    style={{ width: 110 }}
                  />
                )}
              </View>

              <Pressable style={styles.switchRow} onPress={() => onChange('sledzenie', !lek.sledzenie)}>
                <Text style={{ color: colors.grey1 }}>Śledzenie harmonogramu</Text>
                <Switch value={lek.sledzenie} onValueChange={(v) => onChange('sledzenie', v)} color={colors.red} />
              </Pressable>

              {lek.sledzenie && done && (
                <View style={styles.doneBox}>
                  <Text style={{ color: colors.successFgAlt }}>Kurs zakończony — wszystkie dawki przyjęte.</Text>
                </View>
              )}

              {lek.sledzenie && !done && (
                <>
                  {next && (
                    <View style={styles.nextDoseBox}>
                      <Text style={{ flex: 1, color: colors.grey1 }}>
                        Następna dawka: <Text style={{ fontWeight: '700' }}>{formatNextDose(next)}</Text>
                        {lek.nastepna_dawka_override ? '  (zmieniony)' : ''}
                      </Text>
                      <Button compact mode="outlined" onPress={openOverride} textColor={colors.blue} style={{ borderColor: colors.blue }}>
                        Zmień
                      </Button>
                    </View>
                  )}

                  {overrideEditing && (
                    <View style={styles.editBox}>
                      <DateTimePickerField label="Data i godzina" value={overrideDate} onChange={setOverrideDate} />
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <Button mode="contained" onPress={applyOverride}>Zastosuj</Button>
                        <Button onPress={() => setOverrideEditing(false)} textColor={colors.grey2}>Anuluj</Button>
                        {lek.nastepna_dawka_override !== '' && (
                          <Button onPress={() => { onSaveOverride(''); setOverrideEditing(false); }} textColor={colors.grey2}>
                            Usuń zmianę
                          </Button>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      mode="outlined"
                      icon="pill"
                      onPress={() => markGivenNowOrShowPicker(setGivenEditing, setGivenDate)}
                      textColor={colors.blue}
                      style={{ borderColor: colors.blue }}
                    >
                      Zapisz podanie
                    </Button>
                    {lek.historia_dawek.length > 0 && (
                      <Button
                        mode="outlined"
                        icon="delete-outline"
                        onPress={onUndoGiven}
                        textColor={colors.red}
                        style={{ borderColor: colors.red }}
                      >
                        Cofnij ostatnie
                      </Button>
                    )}
                  </View>

                  {givenEditing && (
                    <View style={styles.editBox}>
                      <DateTimePickerField label="Data i godzina podania" value={givenDate} onChange={setGivenDate} />
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <Button
                          mode="contained"
                          onPress={() => {
                            if (givenDate) {
                              onMarkGiven(givenDate);
                              setGivenEditing(false);
                            }
                          }}
                        >
                          Potwierdź
                        </Button>
                        <Button onPress={() => setGivenEditing(false)} textColor={colors.grey2}>Anuluj</Button>
                      </View>
                    </View>
                  )}
                </>
              )}

              {lek.sledzenie && lek.historia_dawek.length > 0 && (
                <View style={styles.historyBox}>
                  <Text style={styles.historyLabel}>Historia podań:</Text>
                  {history.map((iso, i) => (
                    <Text key={i} style={styles.historyItem}>{formatHistoryEntry(iso)}</Text>
                  ))}
                  {lek.historia_dawek.length > 3 && (
                    <Button compact mode="text" onPress={() => setShowFullHistory((v) => !v)} textColor={colors.blue}>
                      {showFullHistory ? 'Zwiń' : 'Pokaż całą historię'}
                    </Button>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

// Toggle helper: open the picker pre-filled with "now"
function markGivenNowOrShowPicker(
  setOpen: (v: boolean) => void,
  setDate: (d: Date) => void,
) {
  setDate(new Date());
  setOpen(true);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },

  shortlist: { marginBottom: 16, backgroundColor: colors.cardBg },
  shortlistToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  shortlistToggleText: { fontWeight: '700', color: colors.grey1, fontSize: 15 },
  chevron: { fontSize: 11, color: colors.grey2 },
  shortlistBody: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  shortlistRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, flexWrap: 'wrap' },
  shortlistRowBorder: { borderTopWidth: 1, borderTopColor: '#f7f7f7' },
  shortlistName: { flex: 1, fontWeight: '600', color: colors.grey1 },
  shortlistNext: { fontSize: 12, color: colors.grey2 },
  doneLabel: { fontSize: 12, fontWeight: '600', color: colors.successFgAlt, backgroundColor: colors.successBgAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  lekCard: { marginBottom: 12, backgroundColor: colors.cardBg },
  lekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lekTitle: { fontWeight: '700', color: colors.red, fontSize: 15 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  doneBox: { backgroundColor: colors.successBgAlt, borderRadius: 8, padding: 10 },
  nextDoseBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.infoBgSoft, borderRadius: 8, padding: 12 },
  editBox: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#eee' },

  historyBox: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  historyLabel: { fontSize: 13, fontWeight: '600', color: colors.grey2, marginBottom: 4 },
  historyItem: { fontSize: 13, color: colors.grey2, paddingVertical: 2 },

  saveBtn: { marginTop: 12, paddingVertical: 6 },
});
