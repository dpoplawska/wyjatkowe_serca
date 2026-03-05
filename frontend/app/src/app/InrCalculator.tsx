import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { TextField, Divider, CircularProgress, Alert, Snackbar } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from './AuthContext.tsx';
import AppHeader from './AppHeader.tsx';
import { shared } from './appStyles.ts';
import { API } from './config.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InrEntry {
  id: string;
  date: string; // ISO string
  inr: number;
  pt: number;
  pt_normal: number;
  isi: number;
  note: string;
}

// ── INR interpretation ────────────────────────────────────────────────────────

function getInterpretation(inr: number): { label: string; color: string; bg: string } {
  if (inr < 1.5) return { label: 'Poniżej zakresu terapeutycznego', color: '#b45309', bg: '#fef3c7' };
  if (inr <= 2.0) return { label: 'Dolna granica zakresu terapeutycznego', color: '#a16207', bg: '#fef9c3' };
  if (inr <= 3.0) return { label: 'Zakres terapeutyczny (2,0–3,0)', color: '#166534', bg: '#dcfce7' };
  if (inr <= 3.5) return { label: 'Zakres terapeutyczny dla protez zastawkowych (2,5–3,5)', color: '#166534', bg: '#dcfce7' };
  if (inr <= 4.0) return { label: 'Powyżej zakresu — skontaktuj się z lekarzem', color: '#9a3412', bg: '#ffedd5' };
  return { label: 'Bardzo wysokie — ryzyko krwawienia, pilny kontakt z lekarzem', color: '#991b1b', bg: '#fee2e2' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InrCalculator() {
  const { user, loading, logout, getToken } = useAuth();

  const [pt, setPt] = useState('');
  const [ptNormal, setPtNormal] = useState('12');
  const [isi, setIsi] = useState('1.0');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<InrEntry[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/inr`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data?.entries) setHistory(data.entries);
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

  const ptVal = parseFloat(pt);
  const ptNormalVal = parseFloat(ptNormal);
  const isiVal = parseFloat(isi);
  const canCalculate = ptVal > 0 && ptNormalVal > 0 && isiVal > 0;

  const handleCalculate = () => {
    if (!canCalculate) return;
    const inr = Math.pow(ptVal / ptNormalVal, isiVal);
    setResult(Math.round(inr * 100) / 100);
  };

  const persistHistory = async (entries: InrEntry[], successMsg: string) => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/inr`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entries }),
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
    if (result === null) return;
    const entry: InrEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      inr: result,
      pt: ptVal,
      pt_normal: ptNormalVal,
      isi: isiVal,
      note: note.trim(),
    };
    const updated = [entry, ...history];
    setHistory(updated);
    persistHistory(updated, 'Wynik INR zapisany.');
    setPt('');
    setNote('');
    setResult(null);
  };

  const handleDelete = (id: string) => {
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    persistHistory(updated, 'Wpis usunięty.');
  };

  const interpretation = result !== null ? getInterpretation(result) : null;

  return (
    <div style={s.page}>
      <AppHeader user={user} logout={logout} />

      <main style={s.main}>
        <h2 style={s.pageTitle}>Kalkulator INR</h2>

        {fetching ? (
          <div style={s.centerLoader}><CircularProgress style={{ color: '#EC1A3B' }} /></div>
        ) : (<>

        <div style={s.infoBox}>
          <strong>INR (International Normalized Ratio)</strong> to wskaźnik krzepliwości krwi, używany do monitorowania
          leczenia przeciwzakrzepowego (np. warfaryna, acenokumarol).
          <br />Wzór: <strong>INR = (PT pacjenta / PT norma)^ISI</strong>
        </div>

        {/* Calculator card */}
        <div style={s.card}>
          <div style={s.cardTitle}>Oblicz INR</div>
          <Divider style={{ marginBottom: '20px' }} />

          <div style={s.fields}>
            <TextField
              label="Czas protrombinowy pacjenta (PT) [s]"
              type="number"
              value={pt}
              onChange={(e) => { setPt(e.target.value); setResult(null); }}
              inputProps={{ min: 1, step: 0.1 }}
              fullWidth
              placeholder="np. 28"
            />

            <button
              style={s.advancedToggle}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? '▲ Ukryj parametry laboratoryjne' : '▼ Parametry laboratoryjne (ISI, PT norma)'}
            </button>

            {showAdvanced && (
              <>
                <TextField
                  label="PT norma laboratorium (MNPT) [s]"
                  type="number"
                  value={ptNormal}
                  onChange={(e) => { setPtNormal(e.target.value); setResult(null); }}
                  inputProps={{ min: 1, step: 0.1 }}
                  fullWidth
                  helperText="Wartość podana przez laboratorium, zwykle 11–14 s. Domyślnie: 12 s."
                />
                <TextField
                  label="ISI (International Sensitivity Index)"
                  type="number"
                  value={isi}
                  onChange={(e) => { setIsi(e.target.value); setResult(null); }}
                  inputProps={{ min: 0.1, step: 0.01 }}
                  fullWidth
                  helperText="Wartość podana przez laboratorium lub producenta odczynnika. Domyślnie: 1,0."
                />
              </>
            )}

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              style={{ ...s.calcBtn, ...(!canCalculate ? s.calcBtnDisabled : {}) }}
            >
              Oblicz INR
            </button>

            {result !== null && interpretation && (
              <div style={{ ...s.resultBox, backgroundColor: interpretation.bg }}>
                <div style={s.resultValue}>
                  INR = <span style={{ color: interpretation.color }}>{result.toFixed(2)}</span>
                </div>
                <div style={{ ...s.resultLabel, color: interpretation.color }}>
                  {interpretation.label}
                </div>
              </div>
            )}

            {result !== null && (
              <>
                <TextField
                  label="Notatka (opcjonalnie)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  fullWidth
                  placeholder="np. kontrola po zmianie dawki"
                  multiline
                  rows={2}
                />
                <button onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, ...(saving ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}>
                  {saving ? <><CircularProgress size={16} style={{ color: '#fff', marginRight: '8px' }} />Zapisywanie...</> : 'Zapisz wynik w historii'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reference ranges */}
        <div style={s.card}>
          <div style={s.cardTitle}>Zakresy terapeutyczne</div>
          <Divider style={{ marginBottom: '16px' }} />
          <div style={s.rangesGrid}>
            {[
              { range: '< 2,0', label: 'Poniżej terapeutycznego', color: '#b45309', bg: '#fef3c7' },
              { range: '2,0 – 3,0', label: 'Migotanie przedsionków, zakrzepica, protezy biologiczne', color: '#166534', bg: '#dcfce7' },
              { range: '2,5 – 3,5', label: 'Protezy zastawkowe mechaniczne', color: '#166534', bg: '#dcfce7' },
              { range: '> 4,0', label: 'Ryzyko krwawienia — konsultacja lekarska', color: '#991b1b', bg: '#fee2e2' },
            ].map((r) => (
              <div key={r.range} style={{ ...s.rangeRow, backgroundColor: r.bg }}>
                <span style={{ ...s.rangeValue, color: r.color }}>{r.range}</span>
                <span style={{ ...s.rangeLabel, color: r.color }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={s.card}>
            <div style={s.cardTitle}>Historia pomiarów</div>
            <Divider style={{ marginBottom: '0' }} />
            {history.map((entry, i) => {
              const interp = getInterpretation(entry.inr);
              return (
                <div
                  key={entry.id}
                  style={{ ...s.historyRow, ...(i > 0 ? s.historyRowBorder : {}) }}
                >
                  <div style={s.historyMain}>
                    <div style={s.historyLeft}>
                      <div style={s.historyDate}>{formatDate(entry.date)}</div>
                      {entry.note && <div style={s.historyNote}>{entry.note}</div>}
                    </div>
                    <div style={s.historyRight}>
                      <div style={{ ...s.historyInr, color: interp.color, backgroundColor: interp.bg }}>
                        {entry.inr.toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={s.deleteBtn}
                        title="Usuń wpis"
                      >
                        <DeleteOutlineIcon style={{ fontSize: '18px' }} />
                      </button>
                    </div>
                  </div>
                  <div style={s.historyDetails}>PT: {entry.pt} s · norma: {entry.pt_normal} s · ISI: {entry.isi}</div>
                </div>
              );
            })}
          </div>
        )}
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
  infoBox: {
    backgroundColor: '#e3f0fb',
    borderRadius: '10px',
    padding: '14px 18px',
    fontSize: '14px',
    color: '#1a3a5c',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
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
  },
  fields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  advancedToggle: {
    background: '#f0f7fd',
    border: 'none',
    borderRadius: '8px',
    color: '#2383C5',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    width: '100%',
  },
  resultBox: {
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  resultValue: {
    fontWeight: 700,
    fontSize: '22px',
    color: '#2E2E2E',
  },
  resultLabel: {
    fontSize: '14px',
    fontWeight: 600,
  },
  calcBtn: {
    backgroundColor: '#2383C5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '15px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    alignSelf: 'flex-start' as const,
  },
  calcBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  saveBtn: {
    backgroundColor: '#2383C5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    alignSelf: 'flex-start' as const,
    display: 'flex',
    alignItems: 'center',
  },
  rangesGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  rangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  rangeValue: {
    fontWeight: 700,
    fontSize: '14px',
    whiteSpace: 'nowrap' as const,
    minWidth: '80px',
  },
  rangeLabel: {
    fontSize: '13px',
    lineHeight: '1.4',
  },
  historyRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '12px 4px',
    gap: '4px',
  },
  historyRowBorder: {
    borderTop: '1px solid #f0f0f0',
  },
  historyMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  historyLeft: {
    flex: 1,
    minWidth: 0,
  },
  historyDate: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2E2E2E',
  },
  historyNote: {
    fontSize: '13px',
    color: '#616161',
    marginTop: '2px',
  },
  historyDetails: {
    fontSize: '12px',
    color: '#999',
    marginTop: '2px',
  },
  historyRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  historyInr: {
    fontWeight: 700,
    fontSize: '18px',
    borderRadius: '8px',
    padding: '4px 12px',
    minWidth: '52px',
    textAlign: 'center' as const,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#EC1A3B',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
};
