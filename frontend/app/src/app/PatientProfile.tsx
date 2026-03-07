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
  OutlinedInput,
  Chip,
  Box,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ShareIcon from '@mui/icons-material/Share';
import { useAuth } from './AuthContext.tsx';
import AppHeader from './AppHeader.tsx';
import { shared } from './appStyles.ts';
import { API } from './config.ts';

// ── Dropdown options ──────────────────────────────────────────────────────────

const GRUPY_KRWI = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

const WADY_SERCA = [
  'Anomalia Blanda-White\'a-Garlanda (ALCAPA)',
  'Anomalia Ebsteina',
  'Całkowity nieprawidłowy spływ żył płucnych (TAPVR)',
  'Hipoplazja lewego serca (HLHS)',
  'Koarktacja aorty',
  'Niedomykalność zastawki aortalnej',
  'Niedomykalność zastawki mitralnej',
  'Niedomykalność zastawki płucnej',
  'Odejście obu naczyń od prawej komory (DORV)',
  'Przetrwały przewód tętniczy (PDA)',
  'Serce jednokomorowe',
  'Tetralogia Fallota',
  'Transpozycja wielkich naczyń (TGA)',
  'Ubytek przegrody międzykomorowej (VSD)',
  'Ubytek przegrody międzyprzedsionkowej (ASD)',
  'Wspólny kanał przedsionkowo-komorowy (CAVC)',
  'Wspólny pień tętniczy',
  'Zarośnięcie zastawki trójdzielnej',
  'Zwężenie zastawki aortalnej',
  'Zwężenie zastawki mitralnej',
  'Zwężenie zastawki płucnej',
  'Inne',
];

const ZABURZENIA_RYTMU_TYPY = [
  'Blok przedsionkowo-komorowy I°',
  'Blok przedsionkowo-komorowy II°',
  'Blok przedsionkowo-komorowy III° (całkowity)',
  'Bradykardia zatokowa',
  'Częstoskurcz komorowy',
  'Częstoskurcz nadkomorowy (SVT)',
  'Migotanie przedsionków',
  'Trzepotanie przedsionków',
  'Zespół Wolffa-Parkinsona-White\'a (WPW)',
  'Inne',
];

const ROZRUSZNIKI = [
  'Kardiowerter-defibrylator (ICD)',
  'Kardiowerter-defibrylator resynchronizujący (CRT-D)',
  'Stymulator dwujamowy (DDD)',
  'Stymulator epikardialny',
  'Stymulator jednojamowy (VVI)',
  'Stymulator resynchronizujący (CRT-P)',
  'Inne',
];

const ZESPOLY_GENETYCZNE_TYPY = [
  'Zespół DiGeorge\'a (22q11.2)',
  'Zespół Downa (trisomia 21)',
  'Zespół Ehlersa-Danlosa',
  'Zespół Marfana',
  'Zespół Noonan',
  'Zespół Turnera (45,X)',
  'Zespół Williamsa',
  'Inne',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Operacja {
  typ: string;
  data: string;
  czas_it: string;
}

interface ProfileData {
  imie_nazwisko: string;
  grupa_krwi: string;
  wada_serca: string[];
  zaburzenia_rytmu: boolean;
  zaburzenia_rytmu_typ: string;
  zaburzenia_rytmu_opis: string;
  rozrusznik_serca: boolean;
  rozrusznik_serca_typ: string;
  przebyte_operacje: Operacja[];
  powiklania: boolean;
  powiklania_opis: string;
  dodatkowe_choroby: boolean;
  dodatkowe_choroby_opis: string;
  zespoly_genetyczne: boolean;
  zespoly_genetyczne_typ: string;
  zespoly_genetyczne_opis: string;
}

const emptyProfile: ProfileData = {
  imie_nazwisko: '',
  grupa_krwi: '',
  wada_serca: [],
  zaburzenia_rytmu: false,
  zaburzenia_rytmu_typ: '',
  zaburzenia_rytmu_opis: '',
  rozrusznik_serca: false,
  rozrusznik_serca_typ: '',
  przebyte_operacje: [],
  powiklania: false,
  powiklania_opis: '',
  dodatkowe_choroby: false,
  dodatkowe_choroby_opis: '',
  zespoly_genetyczne: false,
  zespoly_genetyczne_typ: '',
  zespoly_genetyczne_opis: '',
};

const emptyOperacja: Operacja = { typ: '', data: '', czas_it: '' };

// ── Component ─────────────────────────────────────────────────────────────────

export default function PatientProfile() {
  const { user, loading, logout, getToken } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
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
        const res = await fetch(`${API}/patient-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            if (typeof data.wada_serca === 'string') {
              data.wada_serca = data.wada_serca ? [data.wada_serca] : [];
            }
            setProfile({ ...emptyProfile, ...data });
          }
        }
      } catch {
        // first visit — no profile yet
      } finally {
        setFetching(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div style={s.loadingPage}>Ładowanie...</div>;
  if (!user) return <Navigate to="/app" replace />;

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const updateOperacja = (index: number, field: keyof Operacja, value: string) =>
    setProfile((p) => {
      const ops = [...p.przebyte_operacje];
      ops[index] = { ...ops[index], [field]: value };
      return { ...p, przebyte_operacje: ops };
    });

  const addOperacja = () =>
    setProfile((p) => ({ ...p, przebyte_operacje: [...p.przebyte_operacje, { ...emptyOperacja }] }));

  const removeOperacja = (index: number) =>
    setProfile((p) => ({ ...p, przebyte_operacje: p.przebyte_operacje.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/patient-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      setSnackbar({ open: true, message: 'Profil został zapisany.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Błąd podczas zapisywania. Spróbuj ponownie.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setCopied(false);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const { token: inviteToken } = await res.json();
      setShareLink(`${window.location.origin}/app/accept?token=${inviteToken}`);
      setShareOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'Nie udało się wygenerować linku. Spróbuj ponownie.', severity: 'error' });
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => setCopied(true));
  };

  return (
    <div style={s.page}>
      <AppHeader user={user} logout={logout} />

      {/* Content */}
      <main style={s.main}>
        <div style={s.titleRow}>
          <h2 style={s.pageTitleInline}>Profil pacjenta</h2>
          <button onClick={handleShare} disabled={sharing} style={s.shareBtn}>
            <ShareIcon style={{ fontSize: 16 }} />
            {sharing ? 'Generowanie...' : 'Udostępnij dostęp'}
          </button>
        </div>

        <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: 700 }}>
            Udostępnij dostęp do profilu
          </DialogTitle>
          <DialogContent>
            <p style={{ fontFamily: 'Quicksand, sans-serif', fontSize: 14, color: '#616161', marginBottom: 12 }}>
              Wyślij ten link drugiemu opiekunowi. Po kliknięciu i zalogowaniu się kontem Google uzyska pełny dostęp do profilu pacjenta. Link wygaśnie po 7 dniach.
            </p>
            <div style={s.linkBox}>
              <span style={s.linkText}>{shareLink}</span>
            </div>
          </DialogContent>
          <DialogActions style={{ padding: '12px 24px 20px' }}>
            <Button onClick={() => setShareOpen(false)} style={{ fontFamily: 'Quicksand, sans-serif', color: '#616161' }}>
              Zamknij
            </Button>
            <Button
              onClick={handleCopy}
              variant="contained"
              style={{ fontFamily: 'Quicksand, sans-serif', backgroundColor: '#EC1A3B', fontWeight: 700 }}
            >
              {copied ? 'Skopiowano!' : 'Kopiuj link'}
            </Button>
          </DialogActions>
        </Dialog>

        {fetching ? (
          <div style={s.centerLoader}><CircularProgress style={{ color: '#EC1A3B' }} /></div>
        ) : (
          <>
            {/* Section: Podstawowe informacje */}
            <Section title="Podstawowe informacje">
              <TextField
                label="Imię i nazwisko"
                value={profile.imie_nazwisko}
                onChange={(e) => set('imie_nazwisko', e.target.value)}
                fullWidth
                variant="outlined"
              />

              <FormControl fullWidth>
                <InputLabel>Grupa krwi</InputLabel>
                <Select
                  value={profile.grupa_krwi}
                  label="Grupa krwi"
                  onChange={(e) => set('grupa_krwi', e.target.value)}
                >
                  {GRUPY_KRWI.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Wady serca</InputLabel>
                <Select
                  multiple
                  value={profile.wada_serca}
                  label="Wady serca"
                  onChange={(e) => set('wada_serca', e.target.value as string[])}
                  input={<OutlinedInput label="Wady serca" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((val) => <Chip key={val} label={val} size="small" />)}
                    </Box>
                  )}
                >
                  {WADY_SERCA.map((w) => (
                    <MenuItem key={w} value={w}>
                      <Checkbox
                        checked={profile.wada_serca.includes(w)}
                        sx={{ py: 0, color: '#EC1A3B', '&.Mui-checked': { color: '#EC1A3B' } }}
                      />
                      {w}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Section>

            {/* Section: Zaburzenia rytmu */}
            <Section title="Zaburzenia rytmu">
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.zaburzenia_rytmu}
                    onChange={(e) => set('zaburzenia_rytmu', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC1A3B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#EC1A3B' } }}
                  />
                }
                label={profile.zaburzenia_rytmu ? 'Tak' : 'Nie'}
                sx={{ fontFamily: 'Quicksand' }}
              />

              {profile.zaburzenia_rytmu && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Rodzaj zaburzenia</InputLabel>
                    <Select
                      value={profile.zaburzenia_rytmu_typ}
                      label="Rodzaj zaburzenia"
                      onChange={(e) => set('zaburzenia_rytmu_typ', e.target.value)}
                    >
                      {ZABURZENIA_RYTMU_TYPY.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {profile.zaburzenia_rytmu_typ === 'Inne' && (
                    <TextField
                      label="Opisz zaburzenie rytmu"
                      value={profile.zaburzenia_rytmu_opis}
                      onChange={(e) => set('zaburzenia_rytmu_opis', e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  )}
                </>
              )}
            </Section>

            {/* Section: Rozrusznik serca */}
            <Section title="Rozrusznik serca">
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.rozrusznik_serca}
                    onChange={(e) => set('rozrusznik_serca', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC1A3B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#EC1A3B' } }}
                  />
                }
                label={profile.rozrusznik_serca ? 'Tak' : 'Nie'}
                sx={{ fontFamily: 'Quicksand' }}
              />

              {profile.rozrusznik_serca && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Rodzaj rozrusznika</InputLabel>
                    <Select
                      value={profile.rozrusznik_serca_typ}
                      label="Rodzaj rozrusznika"
                      onChange={(e) => set('rozrusznik_serca_typ', e.target.value)}
                    >
                      {ROZRUSZNIKI.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </FormControl>

                </>
              )}
            </Section>

            {/* Section: Przebyte operacje */}
            <Section title="Przebyte operacje">
              {profile.przebyte_operacje.map((op, i) => (
                <div key={i} style={s.operacjaCard}>
                  <div style={s.operacjaHeader}>
                    <span style={s.operacjaNum}>Operacja {i + 1}</span>
                    <IconButton
                      size="small"
                      onClick={() => removeOperacja(i)}
                      title="Usuń operację"
                      style={{ color: '#EC1A3B' }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </div>
                  <Divider style={{ marginBottom: '16px' }} />
                  <div style={s.operacjaFields}>
                    <TextField
                      label="Typ operacji"
                      value={op.typ}
                      onChange={(e) => updateOperacja(i, 'typ', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Data operacji"
                      type="date"
                      value={op.data}
                      onChange={(e) => updateOperacja(i, 'data', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Czas na intensywnej terapii (dni)"
                      type="number"
                      value={op.czas_it}
                      onChange={(e) => updateOperacja(i, 'czas_it', e.target.value)}
                      inputProps={{ min: 0 }}
                      fullWidth
                    />
                  </div>
                </div>
              ))}

              <button onClick={addOperacja} style={s.addBtn}>
                <AddCircleOutlineIcon style={{ fontSize: '20px' }} />
                Dodaj operację
              </button>
            </Section>

            {/* Section: Powikłania */}
            <Section title="Powikłania">
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.powiklania}
                    onChange={(e) => set('powiklania', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC1A3B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#EC1A3B' } }}
                  />
                }
                label={profile.powiklania ? 'Tak' : 'Nie'}
                sx={{ fontFamily: 'Quicksand' }}
              />

              {profile.powiklania && (
                <TextField
                  label="Opis powikłań"
                  value={profile.powiklania_opis}
                  onChange={(e) => set('powiklania_opis', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Opisz powikłania..."
                />
              )}
            </Section>

            {/* Section: Dodatkowe choroby */}
            <Section title="Dodatkowe choroby">
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.dodatkowe_choroby}
                    onChange={(e) => set('dodatkowe_choroby', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC1A3B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#EC1A3B' } }}
                  />
                }
                label={profile.dodatkowe_choroby ? 'Tak' : 'Nie'}
                sx={{ fontFamily: 'Quicksand' }}
              />

              {profile.dodatkowe_choroby && (
                <TextField
                  label="Dodatkowe choroby"
                  value={profile.dodatkowe_choroby_opis}
                  onChange={(e) => set('dodatkowe_choroby_opis', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Wymień dodatkowe choroby..."
                />
              )}
            </Section>

            {/* Section: Zespoły genetyczne */}
            <Section title="Zespoły genetyczne">
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.zespoly_genetyczne}
                    onChange={(e) => set('zespoly_genetyczne', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC1A3B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#EC1A3B' } }}
                  />
                }
                label={profile.zespoly_genetyczne ? 'Tak' : 'Nie'}
                sx={{ fontFamily: 'Quicksand' }}
              />

              {profile.zespoly_genetyczne && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Zespół genetyczny</InputLabel>
                    <Select
                      value={profile.zespoly_genetyczne_typ}
                      label="Zespół genetyczny"
                      onChange={(e) => set('zespoly_genetyczne_typ', e.target.value)}
                    >
                      {ZESPOLY_GENETYCZNE_TYPY.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {profile.zespoly_genetyczne_typ === 'Inne' && (
                    <TextField
                      label="Opisz zespół genetyczny"
                      value={profile.zespoly_genetyczne_opis}
                      onChange={(e) => set('zespoly_genetyczne_opis', e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  )}
                </>
              )}
            </Section>

            {/* Save button */}
            <div style={s.saveRow}>
              <button onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, ...(saving ? s.saveBtnDisabled : {}) }}>
                {'Zapisz profil'}
              </button>
            </div>
          </>
        )}
      </main>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ fontFamily: 'Quicksand' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={s.section}>
      <h3 style={s.sectionTitle}>{title}</h3>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  ...shared,
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: '16px',
    color: '#EC1A3B',
    marginBottom: '20px',
    marginTop: 0,
    borderBottom: '2px solid #fde8ec',
    paddingBottom: '10px',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  operacjaCard: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#fafafa',
  },
  operacjaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  operacjaNum: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#2E2E2E',
  },
  operacjaFields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
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
    alignSelf: 'flex-start',
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  pageTitleInline: {
    fontWeight: 700,
    fontSize: '24px',
    color: '#2E2E2E',
    margin: 0,
  },
  shareBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: '1.5px solid #EC1A3B',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#EC1A3B',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  linkBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '12px 16px',
    wordBreak: 'break-all' as const,
  },
  linkText: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#2E2E2E',
  },
};
