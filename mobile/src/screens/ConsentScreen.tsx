import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Card, Checkbox } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { useSnackbar } from '../hooks/useSnackbar';
import { openPrivacyPolicy, openTerms } from '../lib/legalLinks';
import { colors } from '../theme/colors';

// Shown after sign-in until the account carries the current consent record.
// Wording is a placeholder until the foundation's lawyer signs it off; the
// backend CONSENT_VERSION bump re-prompts everyone when it changes.
export default function ConsentScreen() {
  const { getToken, signOutUser, setConsentAccepted } = useAuth();
  const [terms, setTerms] = useState(false);
  const [health, setHealth] = useState(false);
  const [saving, setSaving] = useState(false);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar(4000);

  const accept = async () => {
    setSaving(true);
    try {
      await makeApi(getToken).putConsent();
      setConsentAccepted(true);
    } catch (e) {
      showSnackbar(e instanceof Error ? `Nie udało się zapisać zgody: ${e.message}` : 'Nie udało się zapisać zgody');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Zanim zaczniesz</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Aplikacja przechowuje dane o zdrowiu dziecka. Potrzebujemy Twojej zgody.
        </Text>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.cardTitle}>Co zapisujemy</Text>
          <Text style={styles.body}>
            Profil pacjenta (wada serca, operacje, choroby towarzyszące), listę leków i dawek,
            pomiary, wyniki INR oraz wgrane przez Ciebie dokumenty medyczne. Dane są widoczne
            tylko dla Ciebie i osób, które sam zaprosisz do profilu.
          </Text>
          <Text style={styles.body}>
            Administratorem danych jest Fundacja Wyjątkowe Serca. Dane przechowujemy w
            infrastrukturze Google Cloud w Unii Europejskiej. W każdej chwili możesz usunąć
            konto wraz z danymi w ustawieniach profilu.
          </Text>
          <View style={styles.links}>
            <Button mode="text" compact icon="file-document-outline" onPress={openPrivacyPolicy}>
              Polityka prywatności
            </Button>
            <Button mode="text" compact icon="file-document-outline" onPress={openTerms}>
              Regulamin
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <ConsentRow
            checked={terms}
            onToggle={() => setTerms((v) => !v)}
            label="Akceptuję regulamin aplikacji i zapoznałem/am się z polityką prywatności."
          />
          <ConsentRow
            checked={health}
            onToggle={() => setHealth((v) => !v)}
            label="Wyrażam zgodę na przetwarzanie przez Fundację Wyjątkowe Serca danych o zdrowiu mojego dziecka (lub moich) w celu prowadzenia profilu pacjenta w aplikacji (art. 9 ust. 2 lit. a RODO). Zgodę mogę wycofać, usuwając konto."
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={accept}
        disabled={!terms || !health || saving}
        loading={saving}
        style={styles.acceptBtn}
      >
        Akceptuję i przechodzę dalej
      </Button>
      <Button mode="text" onPress={() => { signOutUser(); }} textColor={colors.grey2}>
        Nie zgadzam się, wyloguj
      </Button>

      {snackbarEl}
    </ScrollView>
  );
}

function ConsentRow({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable style={styles.row} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <Checkbox status={checked ? 'checked' : 'unchecked'} onPress={onToggle} color={colors.blue} />
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: colors.greyBg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 24 },
  title: { color: colors.red, fontWeight: '700' },
  subtitle: { color: colors.grey2, marginTop: 6, textAlign: 'center' },
  card: { marginBottom: 16, backgroundColor: colors.cardBg },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.grey1, marginBottom: 8 },
  body: { color: colors.grey1, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  links: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  rowLabel: { flex: 1, color: colors.grey1, fontSize: 14, lineHeight: 20, paddingTop: 8 },
  acceptBtn: { marginTop: 4, marginBottom: 8 },
});
