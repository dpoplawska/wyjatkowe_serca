import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  ActivityIndicator,
  Snackbar,
  IconButton,
  Card,
  Dialog,
  Portal,
} from 'react-native-paper';
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
import { colors } from '../theme/colors';

const emptyOp: Operacja = { typ: '', data: '', czas_it: '' };

export default function PatientProfileScreen() {
  const { getToken } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<PatientProfileData>(EMPTY_PATIENT_PROFILE);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wadyOpen, setWadyOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [shareDialog, setShareDialog] = useState<{ open: boolean; link: string; loading: boolean }>({
    open: false,
    link: '',
    loading: false,
  });

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

  const set = <K extends keyof PatientProfileData>(key: K, value: PatientProfileData[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const updateOp = (index: number, field: keyof Operacja, value: string) =>
    setProfile((p) => {
      const ops = [...p.przebyte_operacje];
      ops[index] = { ...ops[index], [field]: value };
      return { ...p, przebyte_operacje: ops };
    });

  const addOp = () =>
    setProfile((p) => ({ ...p, przebyte_operacje: [...p.przebyte_operacje, { ...emptyOp }] }));

  const removeOp = (index: number) =>
    setProfile((p) => ({ ...p, przebyte_operacje: p.przebyte_operacje.filter((_, i) => i !== index) }));

  const save = async () => {
    setSaving(true);
    try {
      const api = makeApi(getToken);
      await api.putPatientProfile(profile);
      setSnackbar('Profil zapisany.');
    } catch (e) {
      setSnackbar(e instanceof Error ? `Błąd: ${e.message}` : 'Błąd podczas zapisywania.');
    } finally {
      setSaving(false);
    }
  };

  const createShareLink = async () => {
    setShareDialog({ open: true, link: '', loading: true });
    try {
      const api = makeApi(getToken);
      const { token } = await api.createInvite();
      const link = `https://wyjatkoweserca.pl/app/accept?token=${token}`;
      setShareDialog({ open: true, link, loading: false });
    } catch (e) {
      setShareDialog({ open: false, link: '', loading: false });
      setSnackbar(e instanceof Error ? e.message : 'Nie udało się wygenerować linku');
    }
  };

  const shareLink = async () => {
    if (!shareDialog.link) return;
    try {
      await Share.share({ message: shareDialog.link });
    } catch {
      // ignore
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="account-plus"
            iconColor={colors.red}
            onPress={createShareLink}
            accessibilityLabel="Dołącz opiekuna"
            size={22}
          />
          <LogoutButton />
        </View>
      ),
    });
  }, [navigation]);

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
                <TextInput
                  mode="outlined"
                  label="Data operacji (YYYY-MM-DD)"
                  value={op.data}
                  onChangeText={(v) => updateOp(i, 'data', v)}
                  placeholder="np. 2024-05-20"
                  style={styles.opField}
                />
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

        <Button mode="contained" onPress={save} loading={saving} disabled={saving} style={styles.saveBtn}>
          Zapisz profil
        </Button>
      </ScrollView>

      <MultiSelectModal
        visible={wadyOpen}
        options={WADY_SERCA}
        value={profile.wada_serca}
        onChange={(v) => set('wada_serca', v)}
        onClose={() => setWadyOpen(false)}
        title="Wady serca"
      />

      <Portal>
        <Dialog visible={shareDialog.open} onDismiss={() => setShareDialog({ open: false, link: '', loading: false })}>
          <Dialog.Title>Dołącz opiekuna</Dialog.Title>
          <Dialog.Content>
            {shareDialog.loading ? (
              <ActivityIndicator color={colors.red} />
            ) : (
              <>
                <Text style={{ marginBottom: 12, color: colors.grey2, fontSize: 13 }}>
                  Wyślij ten link nowemu opiekunowi. Po zalogowaniu uzyska pełny dostęp do
                  profilu. Link wygaśnie po 7 dniach.
                </Text>
                <View style={styles.linkBox}>
                  <Text selectable style={styles.linkText}>{shareDialog.link}</Text>
                </View>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShareDialog({ open: false, link: '', loading: false })}>Zamknij</Button>
            <Button mode="contained" onPress={shareLink} disabled={!shareDialog.link}>
              Udostępnij
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snackbar !== null} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar ?? ''}
      </Snackbar>
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
  scroll: { padding: 16, paddingBottom: 48 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, color: colors.grey1 },
  chips: { flexDirection: 'column' },
  opCard: { backgroundColor: colors.surfaceTint },
  opHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  opNum: { fontWeight: '600', color: colors.grey1 },
  opField: { marginBottom: 12 },
  saveBtn: { marginTop: 8, paddingVertical: 6 },
  linkBox: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  linkText: { fontFamily: 'monospace', fontSize: 12, color: colors.grey1 },
});
