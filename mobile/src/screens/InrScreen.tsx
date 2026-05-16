import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { confirmDelete } from '../lib/confirm';
import { PageScroll } from '../components/PageScroll';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  Divider,
} from 'react-native-paper';
import { ScreenSkeleton } from '../components/ScreenSkeleton';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { InrEntry } from '../types/api';
import { calculateInr, getInterpretation } from '../lib/inr';
import { formatDateTime, newId } from '../lib/format';
import { useSnackbar } from '../hooks/useSnackbar';
import { colors } from '../theme/colors';

const REFERENCE_RANGES = [
  { range: '< 2,0', label: 'Poniżej terapeutycznego', color: colors.warningFgStrong, bg: colors.warningBg },
  { range: '2,0 – 3,0', label: 'Migotanie przedsionków, zakrzepica, protezy biologiczne', color: colors.successFg, bg: colors.successBg },
  { range: '2,5 – 3,5', label: 'Protezy zastawkowe mechaniczne', color: colors.successFg, bg: colors.successBg },
  { range: '> 4,0', label: 'Ryzyko krwawienia — konsultacja lekarska', color: colors.dangerFg, bg: colors.dangerBg },
];

export default function InrScreen() {
  const { getToken } = useAuth();
  const [history, setHistory] = useState<InrEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pt, setPt] = useState('');
  const [ptNormal, setPtNormal] = useState('12');
  const [isi, setIsi] = useState('1.0');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar();

  const load = useCallback(async () => {
    try {
      const api = makeApi(getToken);
      const data = await api.getInr();
      if (data?.entries) setHistory(data.entries);
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

  const ptVal = parseFloat(pt);
  const ptNormalVal = parseFloat(ptNormal);
  const isiVal = parseFloat(isi);
  const canCalculate = ptVal > 0 && ptNormalVal > 0 && isiVal > 0;

  const handleCalculate = () => {
    if (!canCalculate) return;
    setResult(calculateInr(ptVal, ptNormalVal, isiVal));
  };

  const persist = async (entries: InrEntry[], successMsg: string) => {
    setSaving(true);
    try {
      const api = makeApi(getToken);
      await api.putInr({ entries });
      showSnackbar(successMsg);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (result === null) return;
    const entry: InrEntry = {
      id: newId(),
      date: new Date().toISOString(),
      inr: result,
      pt: ptVal,
      pt_normal: ptNormalVal,
      isi: isiVal,
      note: note.trim(),
    };
    const updated = [entry, ...history];
    setHistory(updated);
    persist(updated, 'Wynik INR zapisany.');
    setPt('');
    setNote('');
    setResult(null);
  };

  const handleDelete = (id: string) => {
    confirmDelete({
      title: 'Usunąć wpis?',
      onConfirm: () => {
        const updated = history.filter((e) => e.id !== id);
        setHistory(updated);
        persist(updated, 'Wpis usunięty.');
      },
    });
  };

  const interpretation = result !== null ? getInterpretation(result) : null;

  if (fetching) {
    return <ScreenSkeleton />;
  }

  return (
    <View style={styles.page}>
      <PageScroll refreshing={refreshing} onRefresh={refresh}>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={{ fontWeight: '700' }}>INR (International Normalized Ratio)</Text> to
            wskaźnik krzepliwości krwi, używany do monitorowania leczenia przeciwzakrzepowego
            (np. warfaryna, acenokumarol).{'\n'}
            Wzór: <Text style={{ fontWeight: '700' }}>INR = (PT pacjenta / PT norma)^ISI</Text>
          </Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={styles.cardTitle}>Oblicz INR</Text>
            <Divider style={{ marginBottom: 12 }} />

            <TextInput
              mode="outlined"
              label="Czas protrombinowy pacjenta (PT) [s]"
              value={pt}
              onChangeText={(v) => { setPt(v); setResult(null); }}
              keyboardType="decimal-pad"
              placeholder="np. 28"
            />

            <Pressable onPress={() => setShowAdvanced((v) => !v)} style={styles.advancedToggle}>
              <Text style={styles.advancedToggleText}>
                {showAdvanced ? '▲ Ukryj parametry laboratoryjne' : '▼ Parametry laboratoryjne (ISI, PT norma)'}
              </Text>
            </Pressable>

            {showAdvanced && (
              <View style={{ gap: 12, marginTop: 8 }}>
                <TextInput
                  mode="outlined"
                  label="PT norma laboratorium (MNPT) [s]"
                  value={ptNormal}
                  onChangeText={(v) => { setPtNormal(v); setResult(null); }}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  mode="outlined"
                  label="ISI (International Sensitivity Index)"
                  value={isi}
                  onChangeText={(v) => { setIsi(v); setResult(null); }}
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleCalculate}
              disabled={!canCalculate}
              style={{ marginTop: 12 }}
            >
              Oblicz INR
            </Button>

            {result !== null && interpretation && (
              <View style={[styles.resultBox, { backgroundColor: interpretation.bg }]}>
                <Text style={[styles.resultValue, { color: interpretation.color }]}>
                  INR = {result.toFixed(2)}
                </Text>
                <Text style={[styles.resultLabel, { color: interpretation.color }]}>
                  {interpretation.label}
                </Text>
              </View>
            )}

            {result !== null && (
              <>
                <TextInput
                  mode="outlined"
                  label="Notatka (opcjonalnie)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={2}
                  placeholder="np. kontrola po zmianie dawki"
                  style={{ marginTop: 12 }}
                />
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  style={{ marginTop: 12 }}
                >
                  Zapisz wynik w historii
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={styles.cardTitle}>Zakresy terapeutyczne</Text>
            <Divider style={{ marginBottom: 12 }} />
            {REFERENCE_RANGES.map((r) => (
              <View key={r.range} style={[styles.rangeRow, { backgroundColor: r.bg }]}>
                <Text style={[styles.rangeValue, { color: r.color }]}>{r.range}</Text>
                <Text style={[styles.rangeLabel, { color: r.color }]}>{r.label}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Historia pomiarów</Text>
            {history.map((entry) => {
              const interp = getInterpretation(entry.inr);
              return (
                <Card key={entry.id} style={[styles.historyCard, { borderLeftColor: interp.color, borderLeftWidth: 4 }]} mode="elevated">
                  <Card.Content style={styles.historyCardContent}>
                    <View style={[styles.inrBig, { backgroundColor: interp.bg }]}>
                      <Text style={[styles.inrBigText, { color: interp.color }]}>{entry.inr.toFixed(2)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyDate}>{formatDateTime(entry.date)}</Text>
                      {entry.note ? <Text style={styles.historyNote}>„{entry.note}"</Text> : null}
                      <Text style={styles.historyDetails}>PT: {entry.pt} s · norma: {entry.pt_normal} s · ISI: {entry.isi}</Text>
                    </View>
                    <IconButton icon="delete-outline" iconColor={colors.red} onPress={() => handleDelete(entry.id)} />
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}
      </PageScroll>

      {snackbarEl}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },

  infoBox: { backgroundColor: colors.infoBg, borderRadius: 10, padding: 14, marginBottom: 12 },
  infoText: { fontSize: 13, color: colors.infoFgStrong, lineHeight: 18 },

  card: { marginBottom: 12, backgroundColor: colors.cardBg },
  cardTitle: { fontWeight: '700', color: colors.grey1, marginBottom: 8, fontSize: 16 },

  advancedToggle: { backgroundColor: colors.blueTintAlt, borderRadius: 8, padding: 10, marginTop: 12 },
  advancedToggleText: { color: colors.blue, fontWeight: '600', fontSize: 13 },

  resultBox: { borderRadius: 10, padding: 14, marginTop: 12 },
  resultValue: { fontWeight: '700', fontSize: 22 },
  resultLabel: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 10, marginBottom: 6 },
  rangeValue: { fontWeight: '700', fontSize: 14, minWidth: 80 },
  rangeLabel: { fontSize: 13, flex: 1 },

  historySection: { marginTop: 8 },
  historyTitle: { fontWeight: '700', fontSize: 16, color: colors.grey1, marginBottom: 12 },
  historyCard: { marginBottom: 8, backgroundColor: colors.cardBg },
  historyCardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inrBig: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, minWidth: 56, alignItems: 'center' },
  inrBigText: { fontSize: 18, fontWeight: '800' },
  historyDate: { fontSize: 13, fontWeight: '700', color: colors.grey1 },
  historyNote: { fontSize: 12, color: colors.grey2, fontStyle: 'italic', marginTop: 2 },
  historyDetails: { fontSize: 11, color: colors.grey3, marginTop: 2 },
});
