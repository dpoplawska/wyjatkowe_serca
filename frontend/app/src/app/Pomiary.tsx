import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Snackbar } from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts';
import { useAuth } from './AuthContext.tsx';
import AppHeader from './AppHeader.tsx';
import { shared } from './appStyles.ts';
import { API } from './config.ts';

const IS_DEV = window.location.hostname === 'localhost';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MeasurementEntry {
  id: string;
  date: string;
  saturacja?: number;
  tetno?: number;
  cisnienie_skurczowe?: number;
  cisnienie_rozkurczowe?: number;
  diureza?: number;
  note: string;
}

interface InrEntry {
  id: string;
  date: string;
  inr: number;
  note: string;
}

// ── Types & constants ──────────────────────────────────────────────────────────

type ChartRange = '7d' | '1m' | '3m' | '6m' | 'all';

const CHART_RANGES: { key: ChartRange; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: 'all', label: 'Wszystko' },
];

function filterByRange<T extends { date: string }>(entries: T[], range: ChartRange): T[] {
  if (range === 'all') return entries;
  const days = ({ '7d': 7, '1m': 30, '3m': 90, '6m': 180 } as Record<string, number>)[range];
  const cutoff = Date.now() - days * 86400000;
  return entries.filter((e) => new Date(e.date).getTime() >= cutoff);
}

// ── Status helpers ─────────────────────────────────────────────────────────────

function satStatus(v: number) {
  if (v >= 95) return { color: '#166534', bg: '#dcfce7' };
  if (v >= 90) return { color: '#92400e', bg: '#fef3c7' };
  return { color: '#991b1b', bg: '#fee2e2' };
}

function tetnoStatus(v: number) {
  if (v >= 60 && v <= 100) return { color: '#166534', bg: '#dcfce7' };
  if ((v >= 50 && v < 60) || (v > 100 && v <= 120)) return { color: '#92400e', bg: '#fef3c7' };
  return { color: '#991b1b', bg: '#fee2e2' };
}

function cisnienieStatus(sys: number, dia: number) {
  if (sys >= 90 && sys < 140 && dia >= 60 && dia < 90) return { color: '#166534', bg: '#dcfce7' };
  if ((sys >= 140 && sys < 180) || (dia >= 90 && dia < 110)) return { color: '#92400e', bg: '#fef3c7' };
  return { color: '#991b1b', bg: '#fee2e2' };
}

function inrStatus(v: number) {
  if (v >= 2.0 && v <= 3.5) return { color: '#166534', bg: '#dcfce7' };
  if ((v >= 1.5 && v < 2.0) || (v > 3.5 && v <= 4.0)) return { color: '#92400e', bg: '#fef3c7' };
  return { color: '#991b1b', bg: '#fee2e2' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

// ── Metric chip ────────────────────────────────────────────────────────────────

function MetricChip({ label, value, unit, status }: {
  label: string; value: string; unit: string; status: { color: string; bg: string };
}) {
  return (
    <div style={{ ...s.chip, backgroundColor: status.bg }}>
      <span style={{ ...s.chipLabel, color: status.color }}>{label}</span>
      <span style={{ ...s.chipValue, color: status.color }}>{value}</span>
      <span style={{ ...s.chipUnit, color: status.color }}>{unit}</span>
    </div>
  );
}

// ── Range picker ───────────────────────────────────────────────────────────────

function RangePicker({ range, onChange }: { range: ChartRange; onChange: (r: ChartRange) => void }) {
  return (
    <div style={s.rangePicker}>
      {CHART_RANGES.map((r) => (
        <button
          key={r.key}
          className="pomiary-range-btn"
          onClick={() => onChange(r.key)}
          style={{ ...s.rangeBtn, ...(range === r.key ? s.rangeBtnActive : {}) }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ── Mini chart ─────────────────────────────────────────────────────────────────

const MIN_CHART_POINTS = 4;

interface ChartDef {
  label: string;
  color: string;
  dataKey: string;
  unit: string;
  refLines?: { y: number; color: string }[];
  domain?: [number | string, number | string];
}

function MiniChart({ data, chart }: { data: Record<string, unknown>[]; chart: ChartDef }) {
  if (data.length < MIN_CHART_POINTS) return null;
  return (
    <div style={s.miniChartWrap}>
      <div style={s.miniChartLabel}>{chart.label}</div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickCount={6}
            tickFormatter={(v) => formatDateShort(new Date(v).toISOString())}
            tick={{ fontSize: 10, fill: '#999' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis domain={chart.domain ?? ['auto', 'auto']} tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontFamily: 'Quicksand, sans-serif', fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            formatter={(v: unknown) => [`${v} ${chart.unit}`, chart.label]}
            labelFormatter={(v) => formatDate(new Date(v as number).toISOString())}
          />
          {chart.refLines?.map((r) => (
            <ReferenceLine key={r.y} y={r.y} stroke={r.color} strokeDasharray="4 4" strokeOpacity={0.5} />
          ))}
          <Line
            type="monotone"
            dataKey={chart.dataKey}
            stroke={chart.color}
            strokeWidth={2}
            dot={{ r: 3, fill: chart.color }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartSection({ entries, range, onRangeChange }: {
  entries: MeasurementEntry[];
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}) {
  const ts = (iso: string) => new Date(iso).getTime();
  const filtered = filterByRange(entries, range);
  const sorted = [...filtered].sort((a, b) => ts(a.date) - ts(b.date));

  const satData = sorted.filter((e) => e.saturacja != null).map((e) => ({ date: ts(e.date), value: e.saturacja }));
  const tetnoData = sorted.filter((e) => e.tetno != null).map((e) => ({ date: ts(e.date), value: e.tetno }));
  const cisData = sorted.filter((e) => e.cisnienie_skurczowe != null && e.cisnienie_rozkurczowe != null).map((e) => ({
    date: ts(e.date), sys: e.cisnienie_skurczowe, dia: e.cisnienie_rozkurczowe,
  }));
  const diurezaData = sorted.filter((e) => e.diureza != null).map((e) => ({ date: ts(e.date), value: e.diureza }));

  const hasEnough = [satData, tetnoData, cisData, diurezaData].some((d) => d.length >= MIN_CHART_POINTS);

  return (
    <div style={s.chartsWrap}>
      <RangePicker range={range} onChange={onRangeChange} />
      {!hasEnough && (
        <div style={s.chartInfoBox}>
          Brak wystarczającej liczby pomiarów w wybranym przedziale czasu.
        </div>
      )}
      {satData.length >= MIN_CHART_POINTS && (
        <MiniChart data={satData as Record<string, unknown>[]} chart={{
          label: 'Saturacja (SpO₂ %)', color: '#2383C5', dataKey: 'value', unit: '%',
          domain: [85, 100], refLines: [{ y: 95, color: '#166534' }, { y: 90, color: '#92400e' }],
        }} />
      )}
      {tetnoData.length >= MIN_CHART_POINTS && (
        <MiniChart data={tetnoData as Record<string, unknown>[]} chart={{
          label: 'Tętno (bpm)', color: '#EC1A3B', dataKey: 'value', unit: 'bpm',
          refLines: [{ y: 60, color: '#166534' }, { y: 100, color: '#92400e' }],
        }} />
      )}
      {cisData.length >= MIN_CHART_POINTS && (<>
        <MiniChart data={cisData as Record<string, unknown>[]} chart={{
          label: 'Ciśnienie skurczowe (mmHg)', color: '#7c3aed', dataKey: 'sys', unit: 'mmHg',
          refLines: [{ y: 90, color: '#166534' }, { y: 140, color: '#92400e' }],
        }} />
        <MiniChart data={cisData as Record<string, unknown>[]} chart={{
          label: 'Ciśnienie rozkurczowe (mmHg)', color: '#a78bfa', dataKey: 'dia', unit: 'mmHg',
          refLines: [{ y: 60, color: '#166534' }, { y: 90, color: '#92400e' }],
        }} />
      </>)}
      {diurezaData.length >= MIN_CHART_POINTS && (
        <MiniChart data={diurezaData as Record<string, unknown>[]} chart={{
          label: 'Diureza dobowa (ml)', color: '#1e40af', dataKey: 'value', unit: 'ml',
        }} />
      )}
    </div>
  );
}

function InrChartSection({ entries, range, onRangeChange }: {
  entries: InrEntry[];
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}) {
  const ts = (iso: string) => new Date(iso).getTime();
  const filtered = filterByRange(entries, range);
  const data = [...filtered]
    .sort((a, b) => ts(a.date) - ts(b.date))
    .map((e) => ({ date: ts(e.date), value: e.inr }));

  return (
    <div style={s.chartsWrap}>
      <RangePicker range={range} onChange={onRangeChange} />
      {data.length < MIN_CHART_POINTS ? (
        <div style={s.chartInfoBox}>
          Brak wystarczającej liczby wyników INR w wybranym przedziale czasu.
        </div>
      ) : (
        <MiniChart data={data as Record<string, unknown>[]} chart={{
          label: 'INR', color: '#EC1A3B', dataKey: 'value', unit: '', domain: [0, 5],
          refLines: [{ y: 2.0, color: '#166534' }, { y: 3.5, color: '#166534' }, { y: 4.0, color: '#991b1b' }],
        }} />
      )}
    </div>
  );
}

// ── Collapse header ────────────────────────────────────────────────────────────

function SectionHeader({ title, open, onToggle, sub }: { title: string; open: boolean; onToggle: () => void; sub?: boolean }) {
  return (
    <div style={{ ...s.sectionHeader, ...(sub ? s.sectionHeaderSub : {}) }} onClick={onToggle}>
      <span style={{ ...s.sectionTitle, ...(sub ? s.sectionTitleSub : {}) }}>{title}</span>
      <button style={s.collapseBtn}>
        {open ? <KeyboardArrowUpIcon style={{ fontSize: '18px' }} /> : <KeyboardArrowDownIcon style={{ fontSize: '18px' }} />}
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Pomiary() {
  const { user, loading, logout, getToken } = useAuth();
  const navigate = useNavigate();

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
  const [measurementDate, setMeasurementDate] = useState<Dayjs | null>(dayjs());

  const [historyOpen, setHistoryOpen] = useState(true);
  const [chartsOpen, setChartsOpen] = useState(true);
  const [chartRange, setChartRange] = useState<ChartRange>('3m');
  const [inrOpen, setInrOpen] = useState(true);
  const [inrChartsOpen, setInrChartsOpen] = useState(true);
  const [inrChartRange, setInrChartRange] = useState<ChartRange>('3m');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getToken();
        const [mRes, iRes] = await Promise.all([
          fetch(`${API}/measurements`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/inr`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (mRes.ok) {
          const data = await mRes.json();
          if (data?.entries) setEntries(data.entries);
        }
        if (iRes.ok) {
          const data = await iRes.json();
          if (data?.entries) setInrEntries(data.entries.slice(0, 20));
        }
      } catch {
        // first visit
      } finally {
        setFetching(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div style={s.loadingPage}>Ładowanie...</div>;
  if (!user) return <Navigate to="/app" replace />;

  const hasAnyValue = saturacja || tetno || cisSys || diureza;

  const persist = async (updated: MeasurementEntry[], successMsg: string) => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/measurements`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entries: updated }),
      });
      if (!res.ok) throw new Error();
      setSnackbar({ open: true, message: successMsg, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Błąd podczas zapisywania. Spróbuj ponownie.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!hasAnyValue) return;
    const entry: MeasurementEntry = {
      id: crypto.randomUUID(),
      date: (measurementDate?.isValid() ? measurementDate : dayjs()).toISOString(),
      saturacja: saturacja ? parseFloat(saturacja) : undefined,
      tetno: tetno ? parseFloat(tetno) : undefined,
      cisnienie_skurczowe: cisSys ? parseFloat(cisSys) : undefined,
      cisnienie_rozkurczowe: cisDia ? parseFloat(cisDia) : undefined,
      diureza: diureza ? parseFloat(diureza) : undefined,
      note: note.trim(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    persist(updated, 'Pomiary zapisane.');
    setSaturacja(''); setTetno(''); setCisSys(''); setCisDia(''); setDiureza(''); setNote(''); setMeasurementDate(dayjs());
  };

  const handleGenerateTestData = () => {
    const generated: MeasurementEntry[] = [];
    const now = new Date();
    let cursor = new Date(now);
    cursor.setMonth(cursor.getMonth() - 3);

    while (cursor <= now) {
      const rand = (min: number, max: number, decimals = 0) => {
        const v = Math.random() * (max - min) + min;
        return decimals ? Math.round(v * 10 ** decimals) / 10 ** decimals : Math.round(v);
      };
      generated.push({
        id: crypto.randomUUID(),
        date: new Date(cursor).toISOString(),
        saturacja: rand(92, 99),
        tetno: rand(55, 105),
        cisnienie_skurczowe: rand(100, 155),
        cisnienie_rozkurczowe: rand(60, 100),
        diureza: rand(900, 2200),
        note: '',
      });
      cursor.setDate(cursor.getDate() + Math.floor(Math.random() * 5) + 1);
    }

    const updated = [...generated.reverse(), ...entries];
    setEntries(updated);
    persist(updated, `Wygenerowano ${generated.length} wpisów testowych.`);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    persist(updated, 'Wpis usunięty.');
  };

  return (
    <div style={s.page}>
      <style>{`
        .pomiary-num-input::-webkit-outer-spin-button,
        .pomiary-num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .pomiary-num-input[type=number] { -moz-appearance: textfield; }
        .pomiary-num-input::placeholder { font-weight: 400; color: #bbb; }
        .pomiary-note-input::placeholder { color: #bbb; }
        .pomiary-section-header:hover { background: #f4f4f4; }
        .pomiary-range-btn:active { opacity: 0.85; }
      `}</style>
      <AppHeader user={user} logout={logout} />

      <main style={s.main}>
        <h2 style={s.pageTitle}>Pomiary</h2>

        {fetching ? (
          <div style={s.centerLoader}><CircularProgress style={{ color: '#EC1A3B' }} /></div>
        ) : (<>

        {/* Add measurement card */}
        <div style={s.card}>
          <div style={s.cardTitle}>Dodaj pomiar</div>

          <div style={s.metricsGrid}>
            <div style={s.metricInput}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Saturacja</span>
                <span style={s.metricUnit}>SpO₂ %</span>
              </div>
              <input className="pomiary-num-input" type="number" value={saturacja}
                onChange={(e) => setSaturacja(e.target.value)} placeholder="np. 98"
                min={50} max={100} step={1} style={s.numInput} />
            </div>

            <div style={s.metricInput}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Tętno</span>
                <span style={s.metricUnit}>bpm</span>
              </div>
              <input className="pomiary-num-input" type="number" value={tetno}
                onChange={(e) => setTetno(e.target.value)} placeholder="np. 72"
                min={20} max={300} step={1} style={s.numInput} />
            </div>

            <div style={{ ...s.metricInput, gridColumn: 'span 2' } as React.CSSProperties}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Ciśnienie tętnicze</span>
                <span style={s.metricUnit}>mmHg</span>
              </div>
              <div style={s.bpRow}>
                <input className="pomiary-num-input" type="number" value={cisSys}
                  onChange={(e) => setCisSys(e.target.value)} placeholder="np. 120"
                  min={50} max={300} step={1} style={{ ...s.numInput, flex: 1 }} />
                <span style={s.bpSlash}>/</span>
                <input className="pomiary-num-input" type="number" value={cisDia}
                  onChange={(e) => setCisDia(e.target.value)} placeholder="np. 80"
                  min={30} max={200} step={1} style={{ ...s.numInput, flex: 1 }} />
              </div>
            </div>

            <div style={{ ...s.metricInput, gridColumn: 'span 2' } as React.CSSProperties}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Diureza dobowa</span>
                <span style={s.metricUnit}>ml / 24h</span>
              </div>
              <input className="pomiary-num-input" type="number" value={diureza}
                onChange={(e) => setDiureza(e.target.value)} placeholder="np. 1500"
                min={0} max={10000} step={10} style={s.numInput} />
            </div>
          </div>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <DatePicker
                  label="Data pomiaru"
                  value={measurementDate}
                  onChange={(d) => d && setMeasurementDate((prev) => d.hour(prev?.hour() ?? 0).minute(prev?.minute() ?? 0))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <TimePicker
                  label="Godzina pomiaru"
                  value={measurementDate}
                  onChange={(t) => t && setMeasurementDate((prev) => (prev ?? t).hour(t.hour()).minute(t.minute()))}
                  ampm={false}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </div>
            </div>
          </LocalizationProvider>

          <input className="pomiary-note-input" type="text" value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notatka (opcjonalnie)" style={s.noteInput} />

          <button onClick={handleSave} disabled={!hasAnyValue || saving}
            style={{ ...s.saveBtn, ...((!hasAnyValue || saving) ? s.saveBtnDisabled : {}) }}>
            {saving
              ? <><CircularProgress size={16} style={{ color: '#fff', marginRight: '8px' }} />Zapisywanie...</>
              : 'Zapisz pomiar'}
          </button>

          {IS_DEV && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleGenerateTestData} disabled={saving} style={{ ...s.testDataBtn, marginTop: 0, flex: 1 }}>
                [DEV] Generuj dane testowe
              </button>
              <button onClick={() => { setEntries([]); persist([], 'Dane usunięte.'); }} disabled={saving} style={{ ...s.testDataBtn, marginTop: 0, flex: 1, borderColor: '#f87171', color: '#f87171' }}>
                [DEV] Usuń wszystkie pomiary
              </button>
            </div>
          )}
        </div>

        {/* Measurements history */}
        {entries.length > 0 && (
          <div style={s.section}>
            <SectionHeader
              title={`Historia pomiarów (${entries.length})`}
              open={historyOpen}
              onToggle={() => setHistoryOpen((v) => !v)}
            />
            {historyOpen && (<>
              <SectionHeader
                title="Wykresy"
                open={chartsOpen}
                onToggle={() => setChartsOpen((v) => !v)}
                sub
              />
              {chartsOpen && (
                <ChartSection entries={entries} range={chartRange} onRangeChange={setChartRange} />
              )}
              {entries.map((entry) => (
                <div key={entry.id} style={s.historyCard}>
                  <div style={s.historyCardTop}>
                    <span style={s.historyDate}>{formatDate(entry.date)}</span>
                    <button onClick={() => handleDelete(entry.id)} style={s.deleteBtn} title="Usuń wpis">
                      <DeleteOutlineIcon style={{ fontSize: '22px' }} />
                    </button>
                  </div>
                  <div style={s.chipsRow}>
                    {entry.saturacja != null && (
                      <MetricChip label="Saturacja" value={`${entry.saturacja}`} unit="%" status={satStatus(entry.saturacja)} />
                    )}
                    {entry.tetno != null && (
                      <MetricChip label="Tętno" value={`${entry.tetno}`} unit="bpm" status={tetnoStatus(entry.tetno)} />
                    )}
                    {entry.cisnienie_skurczowe != null && entry.cisnienie_rozkurczowe != null && (
                      <MetricChip label="Ciśnienie" value={`${entry.cisnienie_skurczowe}/${entry.cisnienie_rozkurczowe}`} unit="mmHg"
                        status={cisnienieStatus(entry.cisnienie_skurczowe, entry.cisnienie_rozkurczowe)} />
                    )}
                    {entry.cisnienie_skurczowe != null && entry.cisnienie_rozkurczowe == null && (
                      <MetricChip label="Ciśnienie sk." value={`${entry.cisnienie_skurczowe}`} unit="mmHg"
                        status={{ color: '#2E2E2E', bg: '#f3f4f6' }} />
                    )}
                    {entry.diureza != null && (
                      <MetricChip label="Diureza" value={`${entry.diureza}`} unit="ml" status={{ color: '#1e40af', bg: '#dbeafe' }} />
                    )}
                  </div>
                  {entry.note && <div style={s.historyNote}>„{entry.note}"</div>}
                </div>
              ))}
            </>)}
          </div>
        )}

        {/* INR section */}
        <div style={s.section}>
          <SectionHeader
            title={inrEntries.length > 0 ? `INR (${inrEntries.length})` : 'INR'}
            open={inrOpen}
            onToggle={() => setInrOpen((v) => !v)}
          />
          {inrOpen && (<>
            {inrEntries.length === 0 ? (
              <div style={s.emptyBox}>
                Brak wyników INR. Przejdź do kalkulatora, aby dodać pierwszy pomiar.
              </div>
            ) : (<>
              {inrEntries.length >= MIN_CHART_POINTS && (<>
                <SectionHeader
                  title="Wykres INR"
                  open={inrChartsOpen}
                  onToggle={() => setInrChartsOpen((v) => !v)}
                  sub
                />
                {inrChartsOpen && (
                  <InrChartSection entries={inrEntries} range={inrChartRange} onRangeChange={setInrChartRange} />
                )}
              </>)}
              {inrEntries.map((entry) => {
                const st = inrStatus(entry.inr);
                return (
                  <div key={entry.id} style={s.historyCard}>
                    <div style={s.historyCardTop}>
                      <span style={s.historyDate}>{formatDate(entry.date)}</span>
                    </div>
                    <div style={s.chipsRow}>
                      <MetricChip label="INR" value={entry.inr.toFixed(2)} unit="" status={st} />
                    </div>
                    {entry.note && <div style={s.historyNote}>„{entry.note}"</div>}
                  </div>
                );
              })}
            </>)}
            <button style={s.inrLinkBtn} onClick={() => navigate('/app/kalkulator-inr')}>
              Kalkulator INR i pełna historia
              <ArrowForwardIosIcon style={{ fontSize: '13px', marginLeft: '6px' }} />
            </button>
          </>)}
        </div>

        </>)}
      </main>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ fontFamily: 'Quicksand' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  ...shared,
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '20px 24px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: '16px',
    color: '#2E2E2E',
    marginBottom: '16px',
    textAlign: 'left' as const,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  metricInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    padding: '12px 14px',
  },
  metricHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '8px',
    gap: '1px',
  },
  metricName: {
    fontWeight: 700,
    fontSize: '13px',
    color: '#2E2E2E',
    textAlign: 'left' as const,
  },
  metricUnit: {
    fontSize: '11px',
    color: '#aaa',
    fontWeight: 600,
    textAlign: 'left' as const,
  },
  numInput: {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '20px',
    fontWeight: 700,
    fontFamily: 'Quicksand, sans-serif',
    color: '#2E2E2E',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  bpRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bpSlash: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#bbb',
    flexShrink: 0,
  },
  noteInput: {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: 'Quicksand, sans-serif',
    color: '#2E2E2E',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
    outline: 'none',
    marginBottom: '16px',
  },
  saveBtn: {
    backgroundColor: '#EC1A3B',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '15px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  section: {
    marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'background 0.15s',
    userSelect: 'none' as const,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: '16px',
    color: '#2E2E2E',
    textAlign: 'left' as const,
  },
  collapseBtn: {
    background: 'none',
    border: 'none',
    color: '#616161',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  sectionHeaderSub: {
    padding: '2px 10px',
    marginBottom: '6px',
  },
  sectionTitleSub: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#616161',
  },
  rangePicker: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
    marginBottom: '4px',
  },
  rangeBtn: {
    backgroundColor: 'transparent',
    border: '1.5px solid #e5e7eb',
    borderRadius: '20px',
    padding: '3px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#616161',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    flex: '0 0 auto',
    width: 'auto',
    height: '30px',
  },
  rangeBtnActive: {
    backgroundColor: '#EC1A3B',
    borderColor: '#EC1A3B',
    color: '#fff',
  },
  chartsWrap: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '12px 16px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    overflow: 'hidden',
    minWidth: 0,
  },
  miniChartWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  miniChartLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#616161',
    textAlign: 'left' as const,
  },
  chartInfoBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '13px',
    color: '#999',
    marginBottom: '16px',
    textAlign: 'left' as const,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '14px 16px',
    marginBottom: '10px',
  },
  historyCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  historyDate: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2E2E2E',
    whiteSpace: 'nowrap' as const,
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  chip: {
    borderRadius: '8px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  chipLabel: {
    fontSize: '11px',
    fontWeight: 600,
    marginRight: '2px',
  },
  chipValue: {
    fontSize: '16px',
    fontWeight: 800,
  },
  chipUnit: {
    fontSize: '11px',
    fontWeight: 600,
  },
  historyNote: {
    fontSize: '12px',
    color: '#616161',
    fontStyle: 'italic' as const,
    marginTop: '8px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#EC1A3B',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content',
    minWidth: 0,
  },
  emptyBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    padding: '16px 18px',
    fontSize: '14px',
    color: '#616161',
    marginBottom: '12px',
    textAlign: 'left' as const,
  },
  testDataBtn: {
    marginTop: '8px',
    background: 'none',
    border: '1.5px dashed #bbb',
    borderRadius: '8px',
    color: '#999',
    fontWeight: 600,
    fontSize: '12px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    width: '100%',
  },
  inrLinkBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: '1.5px solid #2383C5',
    borderRadius: '8px',
    color: '#2383C5',
    fontWeight: 700,
    fontSize: '14px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    marginTop: '4px',
  },
};
