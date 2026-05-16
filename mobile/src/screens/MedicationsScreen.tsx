import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { confirmDelete } from '../lib/confirm';
import { PageScroll } from '../components/PageScroll';
import {
  Text,
  TextInput,
  Button,
  Switch,
  IconButton,
  Card,
  Divider,
} from 'react-native-paper';
import { ScreenSkeleton } from '../components/ScreenSkeleton';
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
  normalizeHistory,
} from '../lib/medications';
import { SelectMenu } from '../components/SelectMenu';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { EmptyState } from '../components/EmptyState';
import { CollapseHeader } from '../components/CollapseHeader';
import { useTopToast } from '../components/TopToast';
import { useSnackbar } from '../hooks/useSnackbar';
import {
  ensureNotificationPermission,
  reconcileDoseReminders,
} from '../lib/notifications';
import { SaveStatusPill, SaveStatus } from '../components/SaveStatusPill';
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
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [shortlistOpen, setShortlistOpen] = useState(true);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar();
  const { show: showTopToast, element: topToastEl } = useTopToast();
  // Track latest leki for the in-flight save snapshot match (avoids racing
  // user edits made during the network round-trip).
  const lekiRef = useRef(leki);
  lekiRef.current = leki;

  const load = useCallback(async () => {
    try {
      const api = makeApi(getToken);
      const data = await api.getMedications();
      if (data && Array.isArray(data.leki)) {
        const next: Lek[] = data.leki.map((l) => ({
          ...emptyLek(),
          ...l,
          historia_dawek: normalizeHistory((l as { historia_dawek?: unknown }).historia_dawek),
        }));
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

  // All mutations flow through update() so any edit becomes a debounced autosave.
  const update = (next: Lek[]) => {
    setLeki(next);
    setDirty(true);
  };

  // Debounced autosave: 1s after last mutation. Same snapshot-match pattern as
  // Patient Profile. The 'saving' pill is shown immediately on edit (not
  // after the debounce completes) so the user sees feedback right away.
  useEffect(() => {
    if (!dirty) return;
    setSaveStatus('saving');
    const t = setTimeout(async () => {
      const snapshot = leki;
      try {
        const api = makeApi(getToken);
        await api.putMedications({ leki: snapshot });
        reconcileDoseReminders(snapshot).catch(() => { /* best effort */ });
        if (lekiRef.current === snapshot) setDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (e) {
        showSnackbar(e instanceof Error ? `Błąd zapisu: ${e.message}` : 'Błąd zapisu');
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [dirty, leki, getToken, showSnackbar]);

  const updateLek = <K extends keyof Lek>(index: number, field: K, value: Lek[K]) => {
    const updatedList = leki.map((lek, i) => (i === index ? { ...lek, [field]: value } : lek));
    update(updatedList);
    // User enables tracking → prompt for notification permission so they
    // actually get reminders. No-op if already granted.
    if (field === 'sledzenie' && value === true) {
      ensureNotificationPermission().then((granted) => {
        if (!granted) {
          showSnackbar('Powiadomienia są wyłączone — włącz je w ustawieniach systemowych, aby dostawać przypomnienia.');
          return;
        }
        const nextDose = getNextDoseTime(updatedList[index]);
        showTopToast(nextDose
          ? `Przypomnienie zaplanowane: ${formatNextDose(nextDose)}`
          : 'Powiadomienia o lekach włączone');
      });
    }
  };

  const addLek = () => update([...leki, emptyLek()]);

  const removeLek = (index: number) => {
    const target = leki[index];
    confirmDelete({
      title: 'Usunąć lek?',
      message: target?.nazwa
        ? `"${target.nazwa}" zostanie usunięty wraz z historią podań.`
        : 'Lek wraz z historią podań zostanie usunięty.',
      onConfirm: () => update(leki.filter((_, i) => i !== index)),
    });
  };

  const markGiven = (index: number, at?: Date) => {
    const now = (at ?? new Date()).toISOString();
    const updatedList = leki.map((lek, i) => i === index ? {
      ...lek,
      ostatnia_dawka: now,
      historia_dawek: [{ at: now, dawka: lek.dawka }, ...lek.historia_dawek],
      nastepna_dawka_override: '',
    } : lek);
    update(updatedList);
    if (updatedList[index].sledzenie) {
      const nextDose = getNextDoseTime(updatedList[index]);
      if (nextDose) showTopToast(`Następne przypomnienie: ${formatNextDose(nextDose)}`);
    }
  };

  const undoLastGiven = (index: number) => {
    update(leki.map((lek, i) => {
      if (i !== index) return lek;
      const newHistory = lek.historia_dawek.slice(1);
      return { ...lek, ostatnia_dawka: newHistory[0]?.at ?? '', historia_dawek: newHistory };
    }));
  };

  const saveOverride = (index: number, override: string) => {
    const updatedList = leki.map((lek, i) => (i === index ? { ...lek, nastepna_dawka_override: override } : lek));
    update(updatedList);
    if (updatedList[index].sledzenie) {
      const nextDose = getNextDoseTime(updatedList[index]);
      if (nextDose) showTopToast(`Następne przypomnienie: ${formatNextDose(nextDose)}`);
    }
  };

  // Filter to tracked meds, then push finished courses to the bottom so the
  // user's eye lands on the active reminders first. Carry the original index
  // so per-row callbacks don't need an O(n) indexOf at render time.
  const tracked = useMemo(() => {
    return leki
      .map((lek, globalIndex) => ({ lek, globalIndex }))
      .filter(({ lek }) => lek.sledzenie)
      .sort((a, b) => Number(isDone(a.lek)) - Number(isDone(b.lek)));
  }, [leki]);

  if (fetching) {
    return <ScreenSkeleton />;
  }

  return (
    <View style={styles.page}>
      <PageScroll refreshing={refreshing} onRefresh={refresh}>

        {tracked.length > 0 && (
          <Card style={styles.shortlist} mode="elevated">
            <View style={styles.shortlistToggleWrap}>
              <CollapseHeader
                title="Harmonogram dawek"
                open={shortlistOpen}
                onToggle={() => setShortlistOpen((v) => !v)}
              />
            </View>
            {shortlistOpen && (
              <View style={styles.shortlistBody}>
                {tracked.map(({ lek, globalIndex }, i) => {
                  const done = isDone(lek);
                  const next = getNextDoseTime(lek);
                  return (
                    <View key={lek.id} style={[styles.shortlistRow, i > 0 && styles.shortlistRowBorder, done && { opacity: 0.5 }]}>
                      <Text style={styles.shortlistName} numberOfLines={3}>
                        {lek.nazwa || 'bez nazwy'}
                      </Text>
                      {done ? (
                        <Text style={styles.doneLabel}>zakończony</Text>
                      ) : (
                        <View style={styles.shortlistActionRow}>
                          <Text style={styles.shortlistNext}>
                            {next ? `następna:\n${formatNextDose(next)}` : '—'}
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
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        )}

        {leki.length === 0 && (
          <EmptyState
            icon="pill"
            title="Brak dodanych leków"
            message="Dodaj pierwszy lek, a my pomożemy Ci śledzić dawki i przypominać o ich podaniu."
            actionLabel="Dodaj lek"
            onAction={addLek}
          />
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

        {leki.length > 0 && (
          <Button
            mode="outlined"
            icon="plus-circle-outline"
            onPress={addLek}
            style={styles.addLekBtn}
          >
            Dodaj kolejny lek
          </Button>
        )}

      </PageScroll>

      <SaveStatusPill status={saveStatus} />
      {topToastEl}

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
  const sorted = [...lek.historia_dawek].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
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
          <View style={{ flex: 1 }}>
            <CollapseHeader
              title={lek.nazwa || `Lek ${index + 1}`}
              open={!collapsed}
              onToggle={() => setCollapsed((v) => !v)}
            />
          </View>
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
                multiline
              />

              <TextInput
                mode="outlined"
                label="Dawka"
                value={lek.dawka}
                onChangeText={(v) => onChange('dawka', v)}
                placeholder="np. 5 mg, 2 tabletki"
                placeholderTextColor={colors.grey3}
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
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: colors.grey1 }}>Śledzenie harmonogramu</Text>
                  <Text style={styles.switchHint}>Powiadomienia o kolejnych dawkach</Text>
                </View>
                <Switch value={lek.sledzenie} onValueChange={(v) => onChange('sledzenie', v)} />
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
                      onPress={() => { setGivenDate(new Date()); setGivenEditing(true); }}
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
                  {history.map((entry, i) => (
                    <Text key={i} style={styles.historyItem}>
                      {formatHistoryEntry(entry.at)}
                      {entry.dawka ? ` — ${entry.dawka}` : ''}
                    </Text>
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },

  shortlist: { marginBottom: 16, backgroundColor: colors.cardBg },
  shortlistToggleWrap: { paddingHorizontal: 12, paddingTop: 4 },
  shortlistBody: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 4 },
  shortlistRow: { padding: 12, gap: 8 },
  shortlistRowBorder: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  shortlistName: { fontWeight: '600', color: colors.grey1 },
  shortlistActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shortlistNext: { flex: 1, fontSize: 12, color: colors.grey2, lineHeight: 16 },
  doneLabel: { fontSize: 12, fontWeight: '600', color: colors.successFgAlt, backgroundColor: colors.successBgAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  lekCard: { marginBottom: 12, backgroundColor: colors.cardBg },
  lekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lekTitle: { fontWeight: '700', color: colors.grey1, fontSize: 15 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchHint: { color: colors.grey3, fontSize: 12, marginTop: 2 },

  doneBox: { backgroundColor: colors.successBgAlt, borderRadius: 8, padding: 10 },
  nextDoseBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.infoBgSoft, borderRadius: 8, padding: 12 },
  editBox: { backgroundColor: colors.surfaceTint, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.borderLight },

  historyBox: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  historyLabel: { fontSize: 13, fontWeight: '600', color: colors.grey2, marginBottom: 4 },
  historyItem: { fontSize: 13, color: colors.grey2, paddingVertical: 2 },

  addLekBtn: {
    alignSelf: 'flex-start',
    borderColor: colors.blue,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
});
