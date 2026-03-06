import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Snackbar, Divider } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useAuth } from './AuthContext.tsx';
import AppHeader from './AppHeader.tsx';
import { shared } from './appStyles.ts';
import { API } from './config.ts';

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

// ── Metric chip ────────────────────────────────────────────────────────────────

function MetricChip({ label, value, unit, status }: {
  label: string;
  value: string;
  unit: string;
  status: { color: string; bg: string };
}) {
  return (
    <div style={{ ...s.chip, backgroundColor: status.bg }}>
      <span style={{ ...s.chipLabel, color: status.color }}>{label}</span>
      <span style={{ ...s.chipValue, color: status.color }}>{value}</span>
      <span style={{ ...s.chipUnit, color: status.color }}>{unit}</span>
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
          if (data?.entries) setInrEntries(data.entries.slice(0, 5));
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
      date: new Date().toISOString(),
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
    setSaturacja(''); setTetno(''); setCisSys(''); setCisDia(''); setDiureza(''); setNote('');
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
          <Divider style={{ marginBottom: '20px' }} />

          <div style={s.metricsGrid}>
            {/* Saturacja */}
            <div style={s.metricInput}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Saturacja</span>
                <span style={s.metricUnit}>SpO₂ %</span>
              </div>
              <input
                className="pomiary-num-input"
                type="number"
                value={saturacja}
                onChange={(e) => setSaturacja(e.target.value)}
                placeholder="np. 98"
                min={50}
                max={100}
                step={1}
                style={s.numInput}
              />
            </div>

            {/* Tętno */}
            <div style={s.metricInput}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Tętno</span>
                <span style={s.metricUnit}>bpm</span>
              </div>
              <input
                className="pomiary-num-input"
                type="number"
                value={tetno}
                onChange={(e) => setTetno(e.target.value)}
                placeholder="np. 72"
                min={20}
                max={300}
                step={1}
                style={s.numInput}
              />
            </div>

            {/* Ciśnienie */}
            <div style={{ ...s.metricInput, gridColumn: 'span 2' } as React.CSSProperties}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Ciśnienie tętnicze</span>
                <span style={s.metricUnit}>mmHg</span>
              </div>
              <div style={s.bpRow}>
                <input
                  type="number"
                  value={cisSys}
                  onChange={(e) => setCisSys(e.target.value)}
                  placeholder="np. 120"
                  min={50}
                  max={300}
                  step={1}
                  style={{ ...s.numInput, flex: 1 }}
                  className="pomiary-num-input"
                />
                <span style={s.bpSlash}>/</span>
                <input
                  className="pomiary-num-input"
                  type="number"
                  value={cisDia}
                  onChange={(e) => setCisDia(e.target.value)}
                  placeholder="np. 80"
                  min={30}
                  max={200}
                  step={1}
                  style={{ ...s.numInput, flex: 1 }}
                />
              </div>
            </div>

            {/* Diureza */}
            <div style={{ ...s.metricInput, gridColumn: 'span 2' } as React.CSSProperties}>
              <div style={s.metricHeader}>
                <span style={s.metricName}>Diureza dobowa</span>
                <span style={s.metricUnit}>ml / 24h</span>
              </div>
              <input
                className="pomiary-num-input"
                type="number"
                value={diureza}
                onChange={(e) => setDiureza(e.target.value)}
                placeholder="np. 1500"
                min={0}
                max={10000}
                step={10}
                style={s.numInput}
              />
            </div>
          </div>

          <input
            className="pomiary-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notatka (opcjonalnie)"
            style={s.noteInput}
          />

          <button
            onClick={handleSave}
            disabled={!hasAnyValue || saving}
            style={{ ...s.saveBtn, ...((!hasAnyValue || saving) ? s.saveBtnDisabled : {}) }}
          >
            {saving
              ? <><CircularProgress size={16} style={{ color: '#fff', marginRight: '8px' }} />Zapisywanie...</>
              : 'Zapisz pomiar'}
          </button>
        </div>

        {/* History */}
        {entries.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Historia pomiarów</div>
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
                    <MetricChip
                      label="Saturacja"
                      value={`${entry.saturacja}`}
                      unit="%"
                      status={satStatus(entry.saturacja)}
                    />
                  )}
                  {entry.tetno != null && (
                    <MetricChip
                      label="Tętno"
                      value={`${entry.tetno}`}
                      unit="bpm"
                      status={tetnoStatus(entry.tetno)}
                    />
                  )}
                  {entry.cisnienie_skurczowe != null && entry.cisnienie_rozkurczowe != null && (
                    <MetricChip
                      label="Ciśnienie"
                      value={`${entry.cisnienie_skurczowe}/${entry.cisnienie_rozkurczowe}`}
                      unit="mmHg"
                      status={cisnienieStatus(entry.cisnienie_skurczowe, entry.cisnienie_rozkurczowe)}
                    />
                  )}
                  {entry.cisnienie_skurczowe != null && entry.cisnienie_rozkurczowe == null && (
                    <MetricChip
                      label="Ciśnienie sk."
                      value={`${entry.cisnienie_skurczowe}`}
                      unit="mmHg"
                      status={{ color: '#2E2E2E', bg: '#f3f4f6' }}
                    />
                  )}
                  {entry.diureza != null && (
                    <MetricChip
                      label="Diureza"
                      value={`${entry.diureza}`}
                      unit="ml"
                      status={{ color: '#1e40af', bg: '#dbeafe' }}
                    />
                  )}
                </div>
                {entry.note && <div style={s.historyNote}>„{entry.note}"</div>}
              </div>
            ))}
          </div>
        )}

        {/* INR section */}
        <div style={s.section}>
          <div style={s.sectionTitle}>INR</div>
          {inrEntries.length === 0 ? (
            <div style={s.emptyBox}>
              Brak wyników INR. Przejdź do kalkulatora, aby dodać pierwszy pomiar.
            </div>
          ) : (
            inrEntries.map((entry) => {
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
            })
          )}
          <button style={s.inrLinkBtn} onClick={() => navigate('/app/kalkulator-inr')}>
            Kalkulator INR i pełna historia
            <ArrowForwardIosIcon style={{ fontSize: '13px', marginLeft: '6px' }} />
          </button>
        </div>

        </>)}
      </main>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
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
    marginBottom: '12px',
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
    marginBottom: '24px',
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: '16px',
    color: '#2E2E2E',
    marginBottom: '12px',
    paddingLeft: '2px',
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
