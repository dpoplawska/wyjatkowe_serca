import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  useMediaQuery,
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MedicationIcon from '@mui/icons-material/Medication';
import { useAuth } from './AuthContext.tsx';
import AppHeader from './AppHeader.tsx';
import { shared } from './appStyles.ts';
import { API } from './config.ts';

// ── Frequency options ─────────────────────────────────────────────────────────

const CZESTOTLIWOSCI = [
  { label: 'Co 4 godziny', value: 'co_4h' },
  { label: 'Co 6 godzin', value: 'co_6h' },
  { label: 'Trzy razy dziennie', value: 'trzy_razy_dziennie' },
  { label: 'Dwa razy dziennie', value: 'dwa_razy_dziennie' },
  { label: 'Raz dziennie', value: 'raz_dziennie' },
  { label: 'Co 2 dni', value: 'co_2_dni' },
  { label: 'Raz w tygodniu', value: 'raz_w_tygodniu' },
];

const FREQUENCY_HOURS: Record<string, number> = {
  raz_dziennie: 24,
  dwa_razy_dziennie: 12,
  trzy_razy_dziennie: 8,
  co_6h: 6,
  co_4h: 4,
  co_2_dni: 48,
  raz_w_tygodniu: 168,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lek {
  id: string;
  nazwa: string;
  data_pierwszej_dawki: string;
  godzina_pierwszej_dawki: string;
  czestotliwosc: string;
  czas_trwania_typ: string;
  czas_trwania_wartosc: number;
  sledzenie: boolean;
  ostatnia_dawka: string;
  historia_dawek: string[];
  nastepna_dawka_override: string;
}

const emptyLek = (): Lek => ({
  id: crypto.randomUUID(),
  nazwa: '',
  data_pierwszej_dawki: '',
  godzina_pierwszej_dawki: '',
  czestotliwosc: '',
  czas_trwania_typ: '',
  czas_trwania_wartosc: 0,
  sledzenie: false,
  ostatnia_dawka: '',
  historia_dawek: [],
  nastepna_dawka_override: '',
});

// ── Completion check ──────────────────────────────────────────────────────────

function isDone(lek: Lek): boolean {
  if (lek.czas_trwania_typ === 'dawki' && lek.czas_trwania_wartosc > 0) {
    return lek.historia_dawek.length >= lek.czas_trwania_wartosc;
  }
  if (lek.czas_trwania_typ === 'dni' && lek.czas_trwania_wartosc > 0 && lek.historia_dawek.length > 0) {
    const firstDose = new Date(lek.historia_dawek[lek.historia_dawek.length - 1]);
    firstDose.setDate(firstDose.getDate() + lek.czas_trwania_wartosc);
    return Date.now() >= firstDose.getTime();
  }
  return false;
}

// ── Next dose calculation ─────────────────────────────────────────────────────

function getNextDoseTime(lek: Lek): Date | null {
  if (!lek.sledzenie || !lek.ostatnia_dawka) return null;

  if (lek.nastepna_dawka_override) return new Date(lek.nastepna_dawka_override);

  const intervalMs = (FREQUENCY_HOURS[lek.czestotliwosc] ?? 24) * 3_600_000;
  return new Date(new Date(lek.ostatnia_dawka).getTime() + intervalMs);
}

function formatNextDose(next: Date): string {
  const now = new Date();
  const hh = next.getHours().toString().padStart(2, '0');
  const mm = next.getMinutes().toString().padStart(2, '0');
  const time = `${hh}:${mm}`;

  const todayStr = now.toDateString();
  const nextStr = next.toDateString();
  const tomorrowStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString();

  if (nextStr === todayStr) return `dziś o ${time}`;
  if (nextStr === tomorrowStr) return `jutro o ${time}`;
  const day = next.getDate().toString().padStart(2, '0');
  const month = (next.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month} o ${time}`;
}

function formatHistoryEntry(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Medications() {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const { user, loading, logout, getToken } = useAuth();
  const [leki, setLeki] = useState<Lek[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/medications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.leki)) {
            setLeki(data.leki);
          }
        }
      } catch {
        // first visit — no medications yet
      } finally {
        setFetching(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div style={s.loadingPage}>Ładowanie...</div>;
  if (!user) return <Navigate to="/app" replace />;

  const updateLek = <K extends keyof Lek>(index: number, field: K, value: Lek[K]) =>
    setLeki((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

  const addLek = () => setLeki((prev) => [...prev, emptyLek()]);

  const removeLek = (index: number) => setLeki((prev) => prev.filter((_, i) => i !== index));

  const saveLeki = async (updatedLeki: Lek[], successMessage: string) => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/medications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leki: updatedLeki }),
      });
      if (!res.ok) throw new Error();
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Błąd podczas zapisywania. Spróbuj ponownie.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => saveLeki(leki, 'Leki zostały zapisane.');

  const handleSaveOverride = (index: number, override: string) => {
    const updated = leki.map((lek, i) =>
      i === index ? { ...lek, nastepna_dawka_override: override } : lek
    );
    setLeki(updated);
    saveLeki(updated, override ? 'Czas następnej dawki zaktualizowany.' : 'Zmiana czasu dawki usunięta.');
  };

  const handleMarkGiven = (index: number, at?: string) => {
    const now = at ?? new Date().toISOString();
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
    saveLeki(updated, 'Podanie leku zapisane.');
  };

  const handleUndoGiven = (index: number) => {
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
    saveLeki(updated, 'Cofnięto ostatnie podanie.');
  };

  return (
    <div style={s.page}>
      <AppHeader user={user} logout={logout} />

      <main style={s.main}>
        <h2 style={s.pageTitle}>Leki</h2>

        {fetching ? (
          <div style={s.centerLoader}><CircularProgress style={{ color: '#EC1A3B' }} /></div>
        ) : (
          <>
            {leki.some((l) => l.sledzenie) && (
              <div style={s.shortlistCard}>
                <button style={s.shortlistToggle} onClick={() => setShortlistOpen((v) => !v)}>
                  <span>Harmonogram dawek</span>
                  <span style={s.shortlistChevron}>{shortlistOpen ? '▲' : '▼'}</span>
                </button>
                {shortlistOpen && (
                  <div style={s.shortlistBody}>
                    {[
                      ...leki.filter((l) => l.sledzenie && !isDone(l)),
                      ...leki.filter((l) => l.sledzenie && isDone(l)),
                    ].map((lek, i) => {
                      const globalIndex = leki.indexOf(lek);
                      const nextDose = getNextDoseTime(lek);
                      const done = isDone(lek);
                      return (
                        <div key={lek.id} style={{ ...s.shortlistRow, ...(i > 0 ? s.shortlistRowBorder : {}), ...(done ? s.shortlistRowDone : {}), ...(isMobile ? { flexDirection: 'column', alignItems: 'stretch' } : {}) }}>
                          <div style={s.shortlistName}>{lek.nazwa || <em style={{ color: '#aaa' }}>bez nazwy</em>}</div>
                          {done ? (
                            <div style={s.shortlistDoneLabel}>zakończony</div>
                          ) : (
                            <>
                              <div style={{ ...s.shortlistNext, ...(isMobile ? { textAlign: 'left' } : {}) }}>{nextDose ? <>następna:{isMobile ? ' ' : '\n'}{formatNextDose(nextDose)}</> : '—'}</div>
                              <button onClick={() => handleMarkGiven(globalIndex)} style={{ ...s.shortlistPodanoBtn, ...(isMobile ? { width: '100%' } : {}) }}>
                                <MedicationIcon style={{ fontSize: '16px' }} />
                                Zapisz podanie
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {leki.map((lek, i) => (
              <LekCard
                key={lek.id}
                lek={lek}
                index={i}
                onChange={(field, value) => updateLek(i, field, value)}
                onRemove={() => removeLek(i)}
                onMarkGiven={(at) => handleMarkGiven(i, at)}
                onUndoGiven={() => handleUndoGiven(i)}
                onSaveOverride={(override) => handleSaveOverride(i, override)}
              />
            ))}

            <button onClick={addLek} style={s.addBtn}>
              <AddCircleOutlineIcon style={{ fontSize: '20px' }} />
              Dodaj lek
            </button>

            <div style={s.saveRow}>
              <button onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, ...(saving ? s.saveBtnDisabled : {}) }}>
                {saving ? <><CircularProgress size={18} style={{ color: '#fff', marginRight: '8px' }} />Zapisywanie...</> : 'Zapisz leki'}
              </button>
            </div>
          </>
        )}
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

// ── LekCard ───────────────────────────────────────────────────────────────────

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
  onMarkGiven: (at: string) => void;
  onUndoGiven: () => void;
  onSaveOverride: (override: string) => void;
}) {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showOverridePicker, setShowOverridePicker] = useState(false);
  const [overrideValue, setOverrideValue] = useState<Dayjs | null>(null);
  const [showGivenPicker, setShowGivenPicker] = useState(false);
  const [givenValue, setGivenValue] = useState<Dayjs | null>(null);
  const nextDose = getNextDoseTime(lek);
  const sortedHistory = [...lek.historia_dawek].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const historyToShow = showFullHistory ? sortedHistory : sortedHistory.slice(0, 3);

  const handleOpenOverride = () => {
    setOverrideValue(nextDose ? dayjs(nextDose) : dayjs());
    setShowOverridePicker(true);
  };

  const handleApplyOverride = () => {
    if (overrideValue && overrideValue.isValid()) {
      onSaveOverride(overrideValue.toISOString());
      setShowOverridePicker(false);
    }
  };

  const handleClearOverride = () => {
    onSaveOverride('');
    setShowOverridePicker(false);
  };

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <button style={s.cardToggle} onClick={() => setCollapsed((v) => !v)}>
          <span style={s.cardNum}>{lek.nazwa || `Lek ${index + 1}`}</span>
          <span style={s.cardChevron}>{collapsed ? '▼' : '▲'}</span>
        </button>
        <IconButton size="small" onClick={onRemove} title="Usuń lek" style={{ color: '#EC1A3B' }}>
          <DeleteOutlineIcon />
        </IconButton>
      </div>

      {!collapsed && <Divider style={{ marginBottom: '16px' }} />}

      {!collapsed && <div style={s.cardFields}>
        {/* Nazwa leku */}
        <TextField
          label="Nazwa leku"
          value={lek.nazwa}
          onChange={(e) => onChange('nazwa', e.target.value)}
          fullWidth
        />

        {/* Częstotliwość */}
        <FormControl fullWidth>
          <InputLabel>Częstotliwość</InputLabel>
          <Select
            value={lek.czestotliwosc}
            label="Częstotliwość"
            onChange={(e) => onChange('czestotliwosc', e.target.value)}
          >
            {CZESTOTLIWOSCI.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Czas trwania */}
        <div style={s.czasRow}>
          <FormControl style={{ flex: 1 }}>
            <InputLabel>Czas trwania</InputLabel>
            <Select
              value={lek.czas_trwania_typ}
              label="Czas trwania"
              onChange={(e) => onChange('czas_trwania_typ', e.target.value)}
            >
              <MenuItem value="bezterminowo">Bezterminowo</MenuItem>
              <MenuItem value="dni">Liczba dni</MenuItem>
              <MenuItem value="dawki">Liczba dawek</MenuItem>
            </Select>
          </FormControl>

          {(lek.czas_trwania_typ === 'dni' || lek.czas_trwania_typ === 'dawki') && (
            <TextField
              label={lek.czas_trwania_typ === 'dni' ? 'Liczba dni' : 'Liczba dawek'}
              type="number"
              value={lek.czas_trwania_wartosc || ''}
              onChange={(e) => onChange('czas_trwania_wartosc', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
              style={{ width: '140px' }}
            />
          )}
        </div>

        {/* Śledzenie harmonogramu */}
        <FormControlLabel
          control={
            <Switch
              checked={lek.sledzenie}
              onChange={(e) => onChange('sledzenie', e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC1A3B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#EC1A3B' } }}
            />
          }
          label="Śledzenie harmonogramu"
          sx={{ fontFamily: 'Quicksand' }}
        />

        {lek.sledzenie && (
          <>
            {isDone(lek) ? (
              <>
                <div style={s.doneBox}>
                  Kurs leku zakończony — wszystkie dawki zostały przyjęte.
                </div>
                <button onClick={onUndoGiven} style={{ ...s.cofnijBtn, ...(isMobile ? { width: '100%' } : {}) }}>
                  Cofnij ostatnie podanie
                </button>
              </>
            ) : (
              <>
                {nextDose && (
                  <div style={{ ...s.nextDose, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
                    <span>
                      Następna dawka: <strong>{formatNextDose(nextDose)}</strong>
                      {lek.nastepna_dawka_override && <span style={s.overrideBadge}>zmieniony</span>}
                    </span>
                    <button onClick={handleOpenOverride} style={{ ...s.zmienBtn, ...(isMobile ? { width: '100%' } : {}) }}>Zmień</button>
                  </div>
                )}
                {showOverridePicker && (
                  <div style={s.overrideBox}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <DatePicker
                          label="Data"
                          value={overrideValue}
                          onChange={(d) => d && setOverrideValue((prev) => d.hour(prev?.hour() ?? 0).minute(prev?.minute() ?? 0))}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                        <TimePicker
                          label="Godzina"
                          value={overrideValue}
                          onChange={(t) => t && setOverrideValue((prev) => (prev ?? t).hour(t.hour()).minute(t.minute()))}
                          ampm={false}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </div>
                    </LocalizationProvider>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={handleApplyOverride} style={s.zastosujBtn}>Zastosuj</button>
                      <button onClick={() => setShowOverridePicker(false)} style={s.cofnijBtn}>Anuluj</button>
                      {lek.nastepna_dawka_override && (
                        <button onClick={handleClearOverride} style={s.cofnijBtn}>Usuń zmianę</button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button
                    onClick={() => { setGivenValue(dayjs()); setShowGivenPicker(true); }}
                    style={{ ...s.podanoBtn, ...(isMobile ? { width: '100%', alignSelf: 'auto' } : {}) }}
                  >
                    <MedicationIcon style={{ fontSize: '18px' }} />
                    Zapisz podanie leku
                  </button>
                  {lek.historia_dawek.length > 0 && (
                    <button onClick={onUndoGiven} style={{ ...s.cofnijBtn, ...(isMobile ? { width: '100%' } : {}) }}>
                      Cofnij ostatnie podanie
                    </button>
                  )}
                </div>
                {showGivenPicker && (
                  <div style={s.overrideBox}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <DatePicker
                          label="Data"
                          value={givenValue}
                          onChange={(d) => d && setGivenValue((prev) => d.hour(prev?.hour() ?? 0).minute(prev?.minute() ?? 0))}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                        <TimePicker
                          label="Godzina"
                          value={givenValue}
                          onChange={(t) => t && setGivenValue((prev) => (prev ?? t).hour(t.hour()).minute(t.minute()))}
                          ampm={false}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </div>
                    </LocalizationProvider>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          if (givenValue && givenValue.isValid()) {
                            onMarkGiven(givenValue.toISOString());
                            setShowGivenPicker(false);
                          }
                        }}
                        style={s.zastosujBtn}
                      >
                        Potwierdź
                      </button>
                      <button onClick={() => setShowGivenPicker(false)} style={s.cofnijBtn}>Anuluj</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {lek.historia_dawek.length > 0 && (
              <div style={s.historyBox}>
                <div style={s.historyLabel}>Historia podań:</div>
                <ul style={s.historyList}>
                  {historyToShow.map((iso, i) => (
                    <li key={i} style={s.historyItem}>{formatHistoryEntry(iso)}</li>
                  ))}
                </ul>
                {lek.historia_dawek.length > 3 && (
                  <button onClick={() => setShowFullHistory((v) => !v)} style={s.historyToggle}>
                    {showFullHistory ? 'Zwiń' : 'Pokaż całą historię'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  ...shared,
  shortlistCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  shortlistToggle: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '16px 20px',
    fontWeight: 700,
    fontSize: '15px',
    color: '#2E2E2E',
    cursor: 'pointer',
  },
  shortlistChevron: {
    fontSize: '11px',
    color: '#616161',
  },
  shortlistBody: {
    borderTop: '1px solid #f0f0f0',
  },
  shortlistRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    flexWrap: 'wrap' as const,
  },
  shortlistRowBorder: {
    borderTop: '1px solid #f7f7f7',
  },
  shortlistName: {
    flex: 1,
    minWidth: '80px',
    fontWeight: 600,
    fontSize: '14px',
    color: '#2E2E2E',
    wordBreak: 'break-word' as const,
  },
  shortlistNext: {
    fontSize: '13px',
    color: '#616161',
    textAlign: 'right' as const,
    whiteSpace: 'pre-line' as const,
    flexShrink: 1,
  },
  shortlistRowDone: {
    opacity: 0.5,
  },
  shortlistDoneLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2E7D32',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    padding: '4px 10px',
    whiteSpace: 'nowrap' as const,
  },
  shortlistPodanoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: 'none',
    border: '1.5px solid #2383C5',
    borderRadius: '6px',
    color: '#2383C5',
    fontWeight: 600,
    fontSize: '13px',
    padding: '5px 10px',
    cursor: 'pointer',
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '20px 24px',
    marginBottom: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  cardNum: {
    fontWeight: 700,
    fontSize: '15px',
    color: '#EC1A3B',
  },
  cardChevron: {
    fontSize: '11px',
    color: '#616161',
  },
  cardFields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  czasRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  doneBox: {
    fontSize: '14px',
    color: '#2E7D32',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  nextDose: {
    fontSize: '14px',
    color: '#2E2E2E',
    backgroundColor: '#e3f0fb',
    borderRadius: '8px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  overrideBadge: {
    marginLeft: '8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#2383C5',
    backgroundColor: '#e3f0fb',
    borderRadius: '4px',
    padding: '2px 6px',
  },
  zmienBtn: {
    background: 'none',
    border: '1.5px solid #2383C5',
    borderRadius: '6px',
    color: '#2383C5',
    fontWeight: 600,
    fontSize: '12px',
    padding: '4px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  overrideBox: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '14px',
  },
  zastosujBtn: {
    background: '#EC1A3B',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    padding: '8px 16px',
    cursor: 'pointer',
  },
  podanoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'none',
    border: '1.5px solid #2383C5',
    borderRadius: '8px',
    color: '#2383C5',
    fontWeight: 600,
    fontSize: '14px',
    padding: '8px 16px',
    cursor: 'pointer',
    alignSelf: 'flex-start' as const,
  },
  cofnijBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    background: 'none',
    border: '1.5px solid #616161',
    borderRadius: '8px',
    color: '#616161',
    fontWeight: 600,
    fontSize: '14px',
    padding: '8px 14px',
    cursor: 'pointer',
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
  },
  historyBox: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '12px',
  },
  historyLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#616161',
    marginBottom: '6px',
  },
  historyList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  historyItem: {
    fontSize: '13px',
    color: '#616161',
    padding: '3px 0',
  },
  historyToggle: {
    background: 'none',
    border: 'none',
    color: '#2383C5',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
    textDecoration: 'underline',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: '1.5px dashed #EC1A3B',
    borderRadius: '8px',
    color: '#EC1A3B',
    fontWeight: 600,
    fontSize: '14px',
    padding: '10px 18px',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};
