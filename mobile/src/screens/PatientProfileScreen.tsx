import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Share } from 'react-native';
import { PageScroll } from '../components/PageScroll';
import { confirmDelete } from '../lib/confirm';
import {
  Text,
  TextInput,
  Button,
  Switch,
  IconButton,
  Card,
} from 'react-native-paper';
import { ScreenSkeleton } from '../components/ScreenSkeleton';
import { useNavigation } from '@react-navigation/native';
import { TabScreenNav } from '../navigation/types';
import { WrappedChip } from '../components/WrappedChip';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { readCacheSync, writeCache } from '../lib/dataCache';
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator';
import {
  MeFlags,
  PatientDocument,
  PatientProfileData,
  Operacja,
  EMPTY_PATIENT_PROFILE,
} from '../types/api';
import {
  GRUPY_KRWI,
  WADY_SERCA,
  ZABURZENIA_RYTMU_TYPY,
  ROZRUSZNIKI,
  ZESPOLY_GENETYCZNE_TYPY,
} from '../lib/patientProfileOptions';
import { SectionCard } from '../components/SectionCard';
import { DocumentsSection } from '../components/DocumentsSection';
import { MultiSelectModal } from '../components/MultiSelectModal';
import { SelectMenu } from '../components/SelectMenu';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { SaveStatusPill, SaveStatus } from '../components/SaveStatusPill';
import { useSnackbar } from '../hooks/useSnackbar';
import { parseIsoDate, toIsoDate, newId } from '../lib/format';
import { generatePatientPdf } from '../lib/pdfReport';
import { colors } from '../theme/colors';

const emptyOp = (): Operacja => ({ id: newId(), typ: '', data: '', czas_it: '' });

// Server/cache payload → screen state. Returns null when there is nothing to show.
function normalizeProfile(data: Partial<PatientProfileData> | null | undefined): PatientProfileData | null {
  if (!data || Object.keys(data).length === 0) return null;
  const normalized = { ...data } as Partial<PatientProfileData> & { wada_serca?: string | string[] };
  if (typeof normalized.wada_serca === 'string') {
    normalized.wada_serca = normalized.wada_serca ? [normalized.wada_serca] : [];
  }
  if (Array.isArray(normalized.przebyte_operacje)) {
    normalized.przebyte_operacje = normalized.przebyte_operacje.map(
      (op) => ({ ...op, id: op.id ?? newId() }),
    );
  }
  return { ...EMPTY_PATIENT_PROFILE, ...(normalized as Partial<PatientProfileData>) };
}

export default function PatientProfileScreen() {
  const { getToken, user } = useAuth();
  const uid = user?.uid;
  const navigation = useNavigation<TabScreenNav>();
  // Hydrated cache (memory) read synchronously so the first frame already
  // shows data — no skeleton flash when a cached copy exists.
  const [initialCache] = useState(() =>
    uid ? normalizeProfile(readCacheSync<Partial<PatientProfileData>>(uid, 'patient-profile')) : null,
  );
  const [profile, setProfile] = useState<PatientProfileData>(initialCache ?? EMPTY_PATIENT_PROFILE);
  const [fetching, setFetching] = useState(initialCache === null);
  const [revalidating, setRevalidating] = useState(false);
  // Edit gate: until the first revalidation settles, the on-screen data may be
  // a stale cached copy — editing it would make the next full-document PUT
  // overwrite newer changes from another device. Unlocks on failure too, so
  // being offline never makes the app read-only.
  const [synced, setSynced] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [wadyOpen, setWadyOpen] = useState(false);
  const [access, setAccess] = useState<{ isGuest: boolean; ownerName?: string }>({ isGuest: false });
  const [guests, setGuests] = useState<{ uid: string; email: string }[]>([]);
  const [me, setMe] = useState<MeFlags>({ isAdmin: false, uploadApproved: false });
  const [docs, setDocs] = useState<PatientDocument[]>(
    () => (uid ? readCacheSync<PatientDocument[]>(uid, 'documents') : null) ?? [],
  );
  const creatingInviteRef = useRef(false);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar();
  const showSnackbarRef = useRef(showSnackbar);
  showSnackbarRef.current = showSnackbar;
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  // Track the most-recently-edited profile so we can detect "user typed while
  // save was in flight" and avoid clearing the dirty flag in that case.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  // Mirror of `dirty` readable inside async loads: a background refresh must
  // not overwrite edits made while the request was in flight.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const load = useCallback(async () => {
    setRevalidating(true);
    try {
      const api = makeApi(getToken);
      const [data, accessData, guestList, meFlags, docList] = await Promise.all([
        api.getPatientProfile(),
        api.getAccessStatus().catch(() => ({ isGuest: false, ownerName: undefined })),
        api.listGuests().catch(() => []),
        api.getMe().catch(() => ({ isAdmin: false, uploadApproved: false })),
        api.listDocuments().catch(() => null),
      ]);
      setAccess({ isGuest: accessData.isGuest, ownerName: accessData.ownerName });
      setGuests(guestList);
      setMe(meFlags);
      if (docList) {
        setDocs(docList);
        if (uid) writeCache(uid, 'documents', docList);
      }
      const normalized = normalizeProfile(data);
      if (normalized) {
        if (uid) writeCache(uid, 'patient-profile', data);
        if (!dirtyRef.current) setProfile(normalized);
      }
    } catch {
      // First-visit empty response or transient network blip — keep defaults.
    } finally {
      setFetching(false);
      setRevalidating(false);
      setSynced(true);
    }
  }, [getToken, uid]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const updateDocs = useCallback((update: (prev: PatientDocument[]) => PatientDocument[]) => {
    setDocs((prev) => {
      const next = update(prev);
      if (uid) writeCache(uid, 'documents', next);
      return next;
    });
  }, [uid]);

  const updateProfile = (updater: (p: PatientProfileData) => PatientProfileData) => {
    if (!synced) {
      showSnackbar('Trwa odświeżanie danych — spróbuj za chwilę.');
      return;
    }
    setDirty(true);
    setProfile(updater);
  };

  const set = <K extends keyof PatientProfileData>(key: K, value: PatientProfileData[K]) =>
    updateProfile((p) => ({ ...p, [key]: value }));

  const updateOp = (index: number, field: keyof Operacja, value: string) =>
    updateProfile((p) => {
      const ops = [...p.przebyte_operacje];
      ops[index] = { ...ops[index], [field]: value };
      return { ...p, przebyte_operacje: ops };
    });

  const addOp = () =>
    updateProfile((p) => ({ ...p, przebyte_operacje: [...p.przebyte_operacje, emptyOp()] }));

  const removeOp = (index: number) => {
    confirmDelete({
      title: 'Usunąć operację?',
      onConfirm: () =>
        updateProfile((p) => ({
          ...p,
          przebyte_operacje: p.przebyte_operacje.filter((_, i) => i !== index),
        })),
    });
  };

  // Debounced autosave: 1s after last edit. Snapshots profile at save start;
  // only clears dirty if no further edits happened during the round-trip.
  // The 'saving' pill is shown immediately on edit (not after the debounce
  // completes) so the user sees feedback right away.
  useEffect(() => {
    if (!dirty) return;
    setSaveStatus('saving');
    const t = setTimeout(async () => {
      const snapshot = profile;
      try {
        const api = makeApi(getToken);
        await api.putPatientProfile(snapshot);
        if (uid) writeCache(uid, 'patient-profile', snapshot);
        if (profileRef.current === snapshot) setDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (e) {
        showSnackbar(e instanceof Error ? `Błąd zapisu: ${e.message}` : 'Błąd zapisu');
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [dirty, profile, getToken, uid, showSnackbar]);

  // Stable callback captured via refs so the header IconButton sees the latest
  // showSnackbar / getToken without re-running setOptions on every render.
  const handleRevokeGuest = (guestUid: string, email: string) => {
    confirmDelete({
      title: 'Odebrać dostęp?',
      message: `${email} nie będzie już mógł widzieć Twojego profilu.`,
      onConfirm: async () => {
        try {
          const api = makeApi(getTokenRef.current);
          await api.revokeGuest(guestUid);
          showSnackbarRef.current('Dostęp odebrany');
          await load();
        } catch (e) {
          showSnackbarRef.current(e instanceof Error ? e.message : 'Nie udało się odłączyć');
        }
      },
    });
  };

  const handleUnlinkAccess = () => {
    confirmDelete({
      title: 'Odłączyć konto opiekuna?',
      message: 'Wrócisz do swojego własnego profilu. Możesz w każdej chwili przyjąć nowe zaproszenie.',
      onConfirm: async () => {
        try {
          const api = makeApi(getTokenRef.current);
          await api.unlinkAccess();
          showSnackbarRef.current('Odłączono');
          await load();
        } catch (e) {
          showSnackbarRef.current(e instanceof Error ? e.message : 'Nie udało się odłączyć');
        }
      },
    });
  };

  const shareInviteLink = useCallback(async () => {
    if (creatingInviteRef.current) return;
    creatingInviteRef.current = true;
    try {
      const api = makeApi(getTokenRef.current);
      const { token } = await api.createInvite();
      const link = `https://wyjatkoweserca.pl/app/accept?token=${token}`;
      await Share.share({
        message: `Dołącz do mojego profilu w aplikacji Wyjątkowe Serca: ${link}\n\nLink wygasa po 7 dniach.`,
      });
    } catch (e) {
      showSnackbarRef.current(e instanceof Error ? e.message : 'Nie udało się wygenerować linku');
    } finally {
      creatingInviteRef.current = false;
    }
  }, []);

  const generatingPdfRef = useRef(false);
  const exportPdf = useCallback(async () => {
    if (generatingPdfRef.current) return;
    generatingPdfRef.current = true;
    try {
      showSnackbarRef.current('Generowanie PDF…');
      await generatePatientPdf(getTokenRef.current);
    } catch (e) {
      showSnackbarRef.current(e instanceof Error ? `Błąd PDF: ${e.message}` : 'Nie udało się wygenerować PDF');
    } finally {
      generatingPdfRef.current = false;
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="file-pdf-box"
            iconColor={colors.blue}
            onPress={exportPdf}
            accessibilityLabel="Eksportuj PDF"
            size={22}
          />
          <IconButton
            icon="account-plus"
            iconColor={colors.blue}
            onPress={shareInviteLink}
            accessibilityLabel="Dołącz opiekuna"
            size={22}
          />
          {me.isAdmin && (
            <IconButton
              icon="account-check-outline"
              iconColor={colors.blue}
              onPress={() => navigation.navigate('AdminUsers')}
              accessibilityLabel="Zatwierdzanie użytkowników"
              size={22}
            />
          )}
          <LogoutButton />
        </View>
      ),
    });
  }, [navigation, shareInviteLink, exportPdf, me.isAdmin]);

  if (fetching) {
    return <ScreenSkeleton />;
  }

  return (
    <View style={styles.page}>
      <PageScroll refreshing={refreshing} onRefresh={refresh}>
        {access.isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              {access.ownerName
                ? `Masz dostęp do profilu: ${access.ownerName}`
                : 'Masz dostęp do profilu opiekuna.'}
            </Text>
            <Button mode="text" compact onPress={handleUnlinkAccess} textColor={colors.dangerFg}>
              Odłącz
            </Button>
          </View>
        )}
        <SectionCard title="Podstawowe informacje">
          <TextInput
            mode="outlined"
            label="Imię i nazwisko"
            value={profile.imie_nazwisko}
            onChangeText={(v) => set('imie_nazwisko', v)}
            multiline
          />

          <SelectMenu
            label="Grupa krwi"
            value={profile.grupa_krwi}
            onChange={(v) => set('grupa_krwi', v)}
            options={GRUPY_KRWI}
          />

          <Pressable onPress={() => setWadyOpen(true)}>
            <TextInput
              mode="outlined"
              label="Wady serca"
              value={profile.wada_serca.length ? `${profile.wada_serca.length} wybranych` : ''}
              editable={false}
              right={<TextInput.Icon icon="menu-down" onPress={() => setWadyOpen(true)} />}
              onPressIn={() => setWadyOpen(true)}
            />
          </Pressable>
          {profile.wada_serca.length > 0 && (
            <View style={styles.chips}>
              {profile.wada_serca.map((w) => (
                <WrappedChip
                  key={w}
                  label={w}
                  onClose={() => set('wada_serca', profile.wada_serca.filter((x) => x !== w))}
                />
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Zaburzenia rytmu">
          <SwitchRow
            value={profile.zaburzenia_rytmu}
            onChange={(v) => set('zaburzenia_rytmu', v)}
          />
          {profile.zaburzenia_rytmu && (
            <>
              <SelectMenu
                label="Rodzaj zaburzenia"
                value={profile.zaburzenia_rytmu_typ}
                onChange={(v) => set('zaburzenia_rytmu_typ', v)}
                options={ZABURZENIA_RYTMU_TYPY}
              />
              {profile.zaburzenia_rytmu_typ === 'Inne' && (
                <TextInput
                  mode="outlined"
                  label="Opisz zaburzenie rytmu"
                  value={profile.zaburzenia_rytmu_opis}
                  onChangeText={(v) => set('zaburzenia_rytmu_opis', v)}
                  multiline
                  numberOfLines={3}
                />
              )}
            </>
          )}
        </SectionCard>

        <SectionCard title="Rozrusznik serca">
          <SwitchRow
            value={profile.rozrusznik_serca}
            onChange={(v) => set('rozrusznik_serca', v)}
          />
          {profile.rozrusznik_serca && (
            <SelectMenu
              label="Rodzaj rozrusznika"
              value={profile.rozrusznik_serca_typ}
              onChange={(v) => set('rozrusznik_serca_typ', v)}
              options={ROZRUSZNIKI}
            />
          )}
        </SectionCard>

        <SectionCard title="Przebyte operacje">
          {profile.przebyte_operacje.map((op, i) => (
            <Card key={op.id ?? i} style={styles.opCard} mode="outlined">
              <Card.Content>
                <View style={styles.opHeader}>
                  <Text style={styles.opNum}>Operacja {i + 1}</Text>
                  <IconButton icon="delete-outline" iconColor={colors.red} onPress={() => removeOp(i)} />
                </View>
                <TextInput
                  mode="outlined"
                  label="Typ operacji"
                  value={op.typ}
                  onChangeText={(v) => updateOp(i, 'typ', v)}
                  multiline
                  style={styles.opField}
                />
                <View style={styles.opField}>
                  <DateTimePickerField
                    label="Data operacji"
                    mode="date"
                    value={parseIsoDate(op.data)}
                    onChange={(d) => updateOp(i, 'data', toIsoDate(d))}
                    onClear={() => updateOp(i, 'data', '')}
                  />
                </View>
                <TextInput
                  mode="outlined"
                  label="Czas na intensywnej terapii (dni)"
                  value={op.czas_it}
                  onChangeText={(v) => updateOp(i, 'czas_it', v)}
                  keyboardType="numeric"
                />
              </Card.Content>
            </Card>
          ))}
          <Button mode="outlined" icon="plus-circle-outline" onPress={addOp} textColor={colors.blue} style={{ borderColor: colors.blue, borderStyle: 'dashed', alignSelf: 'flex-start' }}>
            Dodaj operację
          </Button>
        </SectionCard>

        <SectionCard title="Powikłania">
          <SwitchRow
            value={profile.powiklania}
            onChange={(v) => set('powiklania', v)}
          />
          {profile.powiklania && (
            <TextInput
              mode="outlined"
              label="Opis powikłań"
              value={profile.powiklania_opis}
              onChangeText={(v) => set('powiklania_opis', v)}
              multiline
              numberOfLines={4}
            />
          )}
        </SectionCard>

        <SectionCard title="Dodatkowe choroby">
          <SwitchRow
            value={profile.dodatkowe_choroby}
            onChange={(v) => set('dodatkowe_choroby', v)}
          />
          {profile.dodatkowe_choroby && (
            <TextInput
              mode="outlined"
              label="Dodatkowe choroby"
              value={profile.dodatkowe_choroby_opis}
              onChangeText={(v) => set('dodatkowe_choroby_opis', v)}
              multiline
              numberOfLines={4}
            />
          )}
        </SectionCard>

        <SectionCard title="Zespoły genetyczne">
          <SwitchRow
            value={profile.zespoly_genetyczne}
            onChange={(v) => set('zespoly_genetyczne', v)}
          />
          {profile.zespoly_genetyczne && (
            <>
              <SelectMenu
                label="Zespół genetyczny"
                value={profile.zespoly_genetyczne_typ}
                onChange={(v) => set('zespoly_genetyczne_typ', v)}
                options={ZESPOLY_GENETYCZNE_TYPY}
              />
              {profile.zespoly_genetyczne_typ === 'Inne' && (
                <TextInput
                  mode="outlined"
                  label="Opisz zespół genetyczny"
                  value={profile.zespoly_genetyczne_opis}
                  onChangeText={(v) => set('zespoly_genetyczne_opis', v)}
                  multiline
                  numberOfLines={3}
                />
              )}
            </>
          )}
        </SectionCard>

        <DocumentsSection
          docs={docs}
          onDocsChange={updateDocs}
          getToken={getToken}
          uploadApproved={me.uploadApproved}
          showSnackbar={showSnackbar}
        />

        {guests.length > 0 && (
          <SectionCard title="Osoby z dostępem do profilu">
            {guests.map((g) => (
              <View key={g.uid} style={styles.guestRow}>
                <Text style={styles.guestEmail} numberOfLines={1}>{g.email}</Text>
                <IconButton
                  icon="account-remove-outline"
                  iconColor={colors.dangerFg}
                  onPress={() => handleRevokeGuest(g.uid, g.email)}
                  accessibilityLabel={`Odbierz dostęp ${g.email}`}
                />
              </View>
            ))}
          </SectionCard>
        )}
      </PageScroll>

      <SaveStatusPill status={saveStatus} />

      <MultiSelectModal
        visible={wadyOpen}
        options={WADY_SERCA}
        value={profile.wada_serca}
        onChange={(v) => set('wada_serca', v)}
        onClose={() => setWadyOpen(false)}
        title="Wady serca"
      />

      <BackgroundRefreshIndicator visible={revalidating && !refreshing} />
      {snackbarEl}
    </View>
  );
}

function SwitchRow({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={styles.switchRow} onPress={() => onChange(!value)}>
      <Text style={styles.switchLabel}>{value ? 'Tak' : 'Nie'}</Text>
      <Switch value={value} onValueChange={onChange} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.blueTint,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  guestBannerText: {
    flex: 1,
    color: colors.infoFgStrong,
    fontSize: 13,
    fontWeight: '600',
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  guestEmail: {
    flex: 1,
    fontSize: 14,
    color: colors.grey1,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, color: colors.grey1 },
  chips: { flexDirection: 'column' },
  opCard: { backgroundColor: colors.surfaceTint },
  opHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  opNum: { fontWeight: '600', color: colors.grey1 },
  opField: { marginBottom: 12 },
});
