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
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useAuth } from './AuthContext.tsx';
import AppHeader from './AppHeader.tsx';

const API = 'https://wyjatkowe-serca-38835307240.europe-central2.run.app';

// ── Frequency options ─────────────────────────────────────────────────────────

const CZESTOTLIWOSCI = [
  { label: 'Raz dziennie', value: 'raz_dziennie' },
  { label: 'Dwa razy dziennie', value: 'dwa_razy_dziennie' },
  { label: 'Trzy razy dziennie', value: 'trzy_razy_dziennie' },
  { label: 'Co 6 godzin', value: 'co_6h' },
  { label: 'Co 4 godziny', value: 'co_4h' },
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
});

// ── Next dose calculation ─────────────────────────────────────────────────────

function getNextDoseTime(lek: Lek): Date | null {
  if (!lek.sledzenie || !lek.data_pierwszej_dawki || !lek.godzina_pierwszej_dawki) return null;
  const first = new Date(`${lek.data_pierwszej_dawki}T${lek.godzina_pierwszej_dawki}`);
  if (isNaN(first.getTime())) return null;
  const intervalMs = (FREQUENCY_HOURS[lek.czestotliwosc] ?? 24) * 3_600_000;
  const now = Date.now();
  if (first.getTime() > now) return first;
  const n = Math.floor((now - first.getTime()) / intervalMs);
  return new Date(first.getTime() + (n + 1) * intervalMs);
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function Medications() {
  const { user, loading, logout, getToken } = useAuth();
  const [leki, setLeki] = useState<Lek[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/medications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leki }),
      });
      if (!res.ok) throw new Error();
      setSnackbar({ open: true, message: 'Leki zostały zapisane.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Błąd podczas zapisywania. Spróbuj ponownie.', severity: 'error' });
    } finally {
      setSaving(false);
    }
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
            {leki.map((lek, i) => (
              <LekCard
                key={lek.id}
                lek={lek}
                index={i}
                onChange={(field, value) => updateLek(i, field, value)}
                onRemove={() => removeLek(i)}
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
}: {
  lek: Lek;
  index: number;
  onChange: <K extends keyof Lek>(field: K, value: Lek[K]) => void;
  onRemove: () => void;
}) {
  const nextDose = getNextDoseTime(lek);

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <span style={s.cardNum}>Lek {index + 1}</span>
        <IconButton size="small" onClick={onRemove} title="Usuń lek" style={{ color: '#EC1A3B' }}>
          <DeleteOutlineIcon />
        </IconButton>
      </div>
      <Divider style={{ marginBottom: '16px' }} />

      <div style={s.cardFields}>
        {/* Nazwa leku */}
        <TextField
          label="Nazwa leku"
          value={lek.nazwa}
          onChange={(e) => onChange('nazwa', e.target.value)}
          fullWidth
        />

        {/* Data pierwszej dawki */}
        <TextField
          label="Data pierwszej dawki"
          type="date"
          value={lek.data_pierwszej_dawki}
          onChange={(e) => onChange('data_pierwszej_dawki', e.target.value)}
          InputLabelProps={{ shrink: true }}
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
            <TextField
              label="Godzina pierwszej dawki"
              type="time"
              value={lek.godzina_pierwszej_dawki}
              onChange={(e) => onChange('godzina_pierwszej_dawki', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {nextDose && (
              <div style={s.nextDose}>
                Następna dawka: <strong>{formatNextDose(nextDose)}</strong>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f8f8',
    fontFamily: 'Quicksand, sans-serif',
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Quicksand, sans-serif',
    color: '#616161',
  },
  main: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '32px 24px 64px',
  },
  pageTitle: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 700,
    fontSize: '24px',
    color: '#2E2E2E',
    marginBottom: '24px',
  },
  centerLoader: {
    display: 'flex',
    justifyContent: 'center',
    padding: '64px 0',
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
  cardNum: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 700,
    fontSize: '15px',
    color: '#EC1A3B',
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
  nextDose: {
    fontFamily: 'Quicksand, sans-serif',
    fontSize: '14px',
    color: '#2E2E2E',
    backgroundColor: '#fde8ec',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: '1.5px dashed #EC1A3B',
    borderRadius: '8px',
    color: '#EC1A3B',
    fontFamily: 'Quicksand, sans-serif',
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
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#EC1A3B',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 700,
    fontSize: '16px',
    padding: '14px 36px',
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
};
