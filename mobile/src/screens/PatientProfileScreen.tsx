import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { PageScroll } from '../components/PageScroll';
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
import { WrappedChip } from '../components/WrappedChip';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import {
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
import { MultiSelectModal } from '../components/MultiSelectModal';
import { SelectMenu } from '../components/SelectMenu';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { useSnackbar } from '../hooks/useSnackbar';
import { colors } from '../theme/colors';

function parseIsoDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyOp: Operacja = { typ: '', data: '', czas_it: '' };

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function PatientProfileScreen() {
  const { getToken } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<PatientProfileData>(EMPTY_PATIENT_PROFILE);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [wadyOpen, setWadyOpen] = useState(false);
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

  const load = useCallback(async () => {
    try {
      const api = makeApi(getToken);
      const data = await api.getPatientProfile();
      if (data && Object.keys(data).length > 0) {
        const normalized = { ...data } as Partial<PatientProfileData> & { wada_serca?: string | string[] };
        if (typeof normalized.wada_serca === 'string') {
          normalized.wada_serca = normalized.wada_serca ? [normalized.wada_serca] : [];
        }
        setProfile({ ...EMPTY_PATIENT_PROFILE, ...(normalized as Partial<PatientProfileData>) });
      }
    } catch {
      // first visit — leave defaults
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

  const updateProfile = (updater: (p: PatientProfileData) => PatientProfileData) => {
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
    updateProfile((p) => ({ ...p, przebyte_operacje: [...p.przebyte_operacje, { ...emptyOp }] }));

  const removeOp = (index: number) => {
    Alert.alert('Usunąć operację?', 'Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () =>
          updateProfile((p) => ({
            ...p,
            przebyte_operacje: p.przebyte_operacje.filter((_, i) => i !== index),
          })),
      },
    ]);
  };

  // Debounced autosave: 1s after last edit. Snapshots profile at save start;
  // only clears dirty if no further edits happened during the round-trip.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      const snapshot = profile;
      setSaveStatus('saving');
      try {
        const api = makeApi(getToken);
        await api.putPatientProfile(snapshot);
        if (profileRef.current === snapshot) setDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (e) {
        showSnackbar(e instanceof Error ? `Błąd zapisu: ${e.message}` : 'Błąd zapisu');
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [dirty, profile, getToken, showSnackbar]);

  // Stable callback captured via refs so the header IconButton sees the latest
  // showSnackbar / getToken without re-running setOptions on every render.
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="account-plus"
            iconColor={colors.red}
            onPress={shareInviteLink}
            accessibilityLabel="Dołącz opiekuna"
            size={22}
          />
          <LogoutButton />
        </View>
      ),
    });
  }, [navigation, shareInviteLink]);

  if (fetching) {
    return <ScreenSkeleton />;
  }

  return (
    <View style={styles.page}>
      <PageScroll refreshing={refreshing} onRefresh={refresh}>
        <View style={styles.statusBar}>
          {saveStatus === 'saving' && <Text style={styles.statusSaving}>Zapisywanie…</Text>}
          {saveStatus === 'saved' && <Text style={styles.statusSaved}>Zapisane ✓</Text>}
        </View>
        <SectionCard title="Podstawowe informacje">
          <TextInput
            mode="outlined"
            label="Imię i nazwisko"
            value={profile.imie_nazwisko}
            onChangeText={(v) => set('imie_nazwisko', v)}
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
            <Card key={i} style={styles.opCard} mode="outlined">
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
          <Button mode="outlined" icon="plus-circle-outline" onPress={addOp} textColor={colors.red} style={{ borderColor: colors.red, borderStyle: 'dashed', alignSelf: 'flex-start' }}>
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
      </PageScroll>

      <MultiSelectModal
        visible={wadyOpen}
        options={WADY_SERCA}
        value={profile.wada_serca}
        onChange={(v) => set('wada_serca', v)}
        onClose={() => setWadyOpen(false)}
        title="Wady serca"
      />

      {snackbarEl}
    </View>
  );
}

function SwitchRow({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={styles.switchRow} onPress={() => onChange(!value)}>
      <Text style={styles.switchLabel}>{value ? 'Tak' : 'Nie'}</Text>
      <Switch value={value} onValueChange={onChange} color={colors.red} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, color: colors.grey1 },
  chips: { flexDirection: 'column' },
  opCard: { backgroundColor: colors.surfaceTint },
  opHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  opNum: { fontWeight: '600', color: colors.grey1 },
  opField: { marginBottom: 12 },
  statusBar: { minHeight: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusSaving: { color: colors.grey2, fontSize: 12 },
  statusSaved: { color: colors.successFg, fontSize: 12, fontWeight: '600' },
});
