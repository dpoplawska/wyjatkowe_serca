import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Snackbar,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { MeasurementEntry, InrEntry } from '../types/api';
import {
  ChartRange,
  CHART_RANGES,
  filterByRange,
  satStatus,
  tetnoStatus,
  cisnienieStatus,
  inrStatus,
  formatDate,
  makeMeasurement,
  pickSamples,
  pickInrSamples,
  MIN_CHART_POINTS,
  diurezaStatus,
} from '../lib/measurements';
import { MetricChip } from '../components/MetricChip';
import { MiniLineChart } from '../components/MiniLineChart';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { TabScreenNav } from '../navigation/types';
import { colors } from '../theme/colors';

export default function PomiaryScreen() {
  const { getToken } = useAuth();
  const navigation = useNavigation<TabScreenNav>();
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [inrEntries, setInrEntries] = useState<InrEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saturacja, setSaturacja] = useState('');
  const [tetno, setTetno] = useState('');
  const [cisSys, setCisSys] = useState('');
  const [cisDia, setCisDia] = useState('');
  const [diureza, setDiureza] = useState('');
  const [note, setNote] = useState('');
  const [measurementDate, setMeasurementDate] = useState<Date>(new Date());

  const [chartRange, setChartRange] = useState<ChartRange>('3m');
  const [inrChartRange, setInrChartRange] = useState<ChartRange>('3m');
  const [chartsOpen, setChartsOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [inrOpen, setInrOpen] = useState(true);

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const api = makeApi(getToken);
      const [m, i] = await Promise.all([api.getMeasurements(), api.getInr()]);
      if (m?.entries) setEntries(m.entries);
      if (i?.entries) setInrEntries(i.entries.slice(0, 50));
    } catch {
      // first visit
    } finally {
      setFetching(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const persist = async (updated: MeasurementEntry[], successMsg: string) => {
    setSaving(true);
    try {
      const api = makeApi(getToken);
      await api.putMeasurements({ entries: updated });
      setSnackbar(successMsg);
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  const hasAnyValue = saturacja || tetno || cisSys || diureza;

  const handleSave = () => {
    if (!hasAnyValue) return;
    const entry = makeMeasurement({
      date: measurementDate.toISOString(),
      saturacja,
      tetno,
      cisSys,
      cisDia,
      diureza,
      note,
    });
    const updated = [entry, ...entries];
    setEntries(updated);
    persist(updated, 'Pomiar zapisany.');
    setSaturacja(''); setTetno(''); setCisSys(''); setCisDia(''); setDiureza(''); setNote('');
    setMeasurementDate(new Date());
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    persist(updated, 'Wpis usunięty.');
  };

  const filteredEntries = useMemo(() => filterByRange(entries, chartRange), [entries, chartRange]);
  const filteredInr = useMemo(() => filterByRange(inrEntries, inrChartRange), [inrEntries, inrChartRange]);

  const samples = useMemo(() => ({
    sat: pickSamples(filteredEntries, 'saturacja'),
    tet: pickSamples(filteredEntries, 'tetno'),
    sys: pickSamples(filteredEntries, 'cisnienie_skurczowe'),
    dia: pickSamples(filteredEntries, 'cisnienie_rozkurczowe'),
    diu: pickSamples(filteredEntries, 'diureza'),
    inr: pickInrSamples(filteredInr),
  }), [filteredEntries, filteredInr]);

  const hasChartData = Object.values(samples).some((arr) => arr.length >= MIN_CHART_POINTS);

  if (fetching) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={styles.cardTitle}>Dodaj pomiar</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Saturacja</Text>
                <Text style={styles.metricUnit}>SpO₂ %</Text>
                <TextInput
                  mode="outlined"
                  dense
                  value={saturacja}
                  onChangeText={setSaturacja}
                  keyboardType="numeric"
                  placeholder="np. 98"
                />
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Tętno</Text>
                <Text style={styles.metricUnit}>bpm</Text>
                <TextInput
                  mode="outlined"
                  dense
                  value={tetno}
                  onChangeText={setTetno}
                  keyboardType="numeric"
                  placeholder="np. 72"
                />
              </View>
            </View>

            <View style={styles.metricBoxFull}>
              <Text style={styles.metricLabel}>Ciśnienie tętnicze</Text>
              <Text style={styles.metricUnit}>mmHg</Text>
              <View style={styles.bpRow}>
                <TextInput
                  mode="outlined"
                  dense
                  value={cisSys}
                  onChangeText={setCisSys}
                  keyboardType="numeric"
                  placeholder="120"
                  style={{ flex: 1 }}
                />
                <Text style={styles.bpSlash}>/</Text>
                <TextInput
                  mode="outlined"
                  dense
                  value={cisDia}
                  onChangeText={setCisDia}
                  keyboardType="numeric"
                  placeholder="80"
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            <View style={styles.metricBoxFull}>
              <Text style={styles.metricLabel}>Diureza dobowa</Text>
              <Text style={styles.metricUnit}>ml / 24h</Text>
              <TextInput
                mode="outlined"
                dense
                value={diureza}
                onChangeText={setDiureza}
                keyboardType="numeric"
                placeholder="np. 1500"
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <DateTimePickerField label="Data i godzina pomiaru" value={measurementDate} onChange={setMeasurementDate} />
            </View>

            <TextInput
              mode="outlined"
              label="Notatka (opcjonalnie)"
              value={note}
              onChangeText={setNote}
              style={{ marginTop: 12 }}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={!hasAnyValue || saving}
              style={{ marginTop: 12 }}
            >
              Zapisz pomiar
            </Button>
          </Card.Content>
        </Card>

        {entries.length > 0 && (
          <View style={styles.section}>
            <CollapseHeader title={`Historia pomiarów (${entries.length})`} open={historyOpen} onToggle={() => setHistoryOpen((v) => !v)} />
            {historyOpen && (
              <>
                <CollapseHeader title="Wykresy" sub open={chartsOpen} onToggle={() => setChartsOpen((v) => !v)} />
                {chartsOpen && (
                  <Card style={styles.chartCard} mode="elevated">
                    <Card.Content>
                      <RangePicker range={chartRange} onChange={setChartRange} />
                      {!hasChartData && (
                        <Text style={styles.emptyText}>Brak wystarczającej liczby pomiarów w wybranym przedziale.</Text>
                      )}
                      <MiniLineChart title="Saturacja (SpO₂ %)" samples={samples.sat} color={colors.blue} unit="%" yMin={85} yMax={100} />
                      <MiniLineChart title="Tętno (bpm)" samples={samples.tet} color={colors.red} unit="bpm" />
                      <MiniLineChart title="Ciśnienie skurczowe (mmHg)" samples={samples.sys} color={colors.purpleFg} unit="mmHg" />
                      <MiniLineChart title="Ciśnienie rozkurczowe (mmHg)" samples={samples.dia} color={colors.purpleFgAlt} unit="mmHg" />
                      <MiniLineChart title="Diureza (ml)" samples={samples.diu} color={colors.infoFg} unit="ml" />
                    </Card.Content>
                  </Card>
                )}

                {entries.map((entry) => (
                  <Card key={entry.id} style={styles.historyCard} mode="elevated">
                    <Card.Content>
                      <View style={styles.historyTop}>
                        <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                        <IconButton icon="delete-outline" iconColor={colors.red} size={20} onPress={() => handleDelete(entry.id)} />
                      </View>
                      <View style={styles.chipsRow}>
                        {entry.saturacja != null && (
                          <MetricChip label="Saturacja" value={String(entry.saturacja)} unit="%" status={satStatus(entry.saturacja)} />
                        )}
                        {entry.tetno != null && (
                          <MetricChip label="Tętno" value={String(entry.tetno)} unit="bpm" status={tetnoStatus(entry.tetno)} />
                        )}
                        {entry.cisnienie_skurczowe != null && entry.cisnienie_rozkurczowe != null && (
                          <MetricChip
                            label="Ciśnienie"
                            value={`${entry.cisnienie_skurczowe}/${entry.cisnienie_rozkurczowe}`}
                            unit="mmHg"
                            status={cisnienieStatus(entry.cisnienie_skurczowe, entry.cisnienie_rozkurczowe)}
                          />
                        )}
                        {entry.diureza != null && (
                          <MetricChip label="Diureza" value={String(entry.diureza)} unit="ml" status={diurezaStatus} />
                        )}
                      </View>
                      {entry.note ? <Text style={styles.historyNote}>„{entry.note}"</Text> : null}
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}
          </View>
        )}

        <View style={styles.section}>
          <CollapseHeader
            title={inrEntries.length > 0 ? `INR (${inrEntries.length})` : 'INR'}
            open={inrOpen}
            onToggle={() => setInrOpen((v) => !v)}
          />
          {inrOpen && (
            <>
              {inrEntries.length === 0 ? (
                <Card style={styles.card}><Card.Content>
                  <Text style={styles.emptyText}>Brak wyników INR. Przejdź do kalkulatora, aby dodać pierwszy pomiar.</Text>
                </Card.Content></Card>
              ) : (
                <>
                  {samples.inr.length >= MIN_CHART_POINTS && (
                    <Card style={styles.chartCard} mode="elevated">
                      <Card.Content>
                        <RangePicker range={inrChartRange} onChange={setInrChartRange} />
                        <MiniLineChart title="INR" samples={samples.inr} color={colors.red} unit="" yMin={0} yMax={5} />
                      </Card.Content>
                    </Card>
                  )}
                  {inrEntries.map((entry) => {
                    const st = inrStatus(entry.inr);
                    return (
                      <Card key={entry.id} style={styles.historyCard} mode="elevated">
                        <Card.Content>
                          <View style={styles.historyTop}>
                            <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                          </View>
                          <View style={styles.chipsRow}>
                            <MetricChip label="INR" value={entry.inr.toFixed(2)} unit="" status={st} />
                          </View>
                          {entry.note ? <Text style={styles.historyNote}>„{entry.note}"</Text> : null}
                        </Card.Content>
                      </Card>
                    );
                  })}
                </>
              )}
              <Button
                mode="outlined"
                icon="chevron-right"
                onPress={() => navigation.navigate('Inr')}
                textColor={colors.blue}
                style={{ borderColor: colors.blue, marginTop: 8 }}
              >
                Kalkulator INR i pełna historia
              </Button>
            </>
          )}
        </View>
      </ScrollView>

      <Snackbar visible={snackbar !== null} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar ?? ''}
      </Snackbar>
    </View>
  );
}

function CollapseHeader({ title, open, onToggle, sub }: { title: string; open: boolean; onToggle: () => void; sub?: boolean }) {
  return (
    <Pressable onPress={onToggle} style={[styles.collapseHeader, sub && styles.collapseHeaderSub]}>
      <Text style={[styles.collapseTitle, sub && styles.collapseTitleSub]}>{title}</Text>
      <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
    </Pressable>
  );
}

function RangePicker({ range, onChange }: { range: ChartRange; onChange: (r: ChartRange) => void }) {
  return (
    <View style={styles.rangeRow}>
      {CHART_RANGES.map((r) => {
        const active = r.key === range;
        return (
          <Pressable
            key={r.key}
            onPress={() => onChange(r.key)}
            style={[styles.rangeBtn, active && styles.rangeBtnActive]}
          >
            <Text style={[styles.rangeBtnText, active && styles.rangeBtnTextActive]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  scroll: { padding: 16, paddingBottom: 48 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },

  card: { marginBottom: 12, backgroundColor: colors.cardBg },
  cardTitle: { fontWeight: '700', color: colors.grey1, marginBottom: 16, fontSize: 16 },

  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricBox: { flex: 1, backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10 },
  metricBoxFull: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10, marginBottom: 12 },
  metricLabel: { fontWeight: '700', fontSize: 13, color: colors.grey1 },
  metricUnit: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 6 },
  bpRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bpSlash: { fontSize: 20, fontWeight: '700', color: '#bbb' },

  section: { marginBottom: 8 },
  collapseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 8 },
  collapseHeaderSub: { paddingVertical: 2 },
  collapseTitle: { fontWeight: '700', fontSize: 16, color: colors.grey1 },
  collapseTitleSub: { fontSize: 13, fontWeight: '600', color: colors.grey2 },
  chevron: { fontSize: 11, color: colors.grey2 },

  chartCard: { marginBottom: 12, backgroundColor: colors.cardBg },
  emptyText: { color: colors.grey2, fontSize: 13, padding: 10 },

  rangeRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  rangeBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  rangeBtnActive: { backgroundColor: colors.red, borderColor: colors.red },
  rangeBtnText: { fontSize: 12, fontWeight: '600', color: colors.grey2 },
  rangeBtnTextActive: { color: 'white' },

  historyCard: { marginBottom: 8, backgroundColor: colors.cardBg },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 13, fontWeight: '700', color: colors.grey1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyNote: { fontSize: 12, color: colors.grey2, fontStyle: 'italic', marginTop: 8 },
});
