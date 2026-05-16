import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Banner } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { isGoogleSignInConfigured } from '../auth/firebase';
import { listDevUsers } from '../api/client';
import { DevUser } from '../types/api';
import { useSnackbar } from '../hooks/useSnackbar';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const { signInAsDevUser, signInWithGoogle } = useAuth();
  const [devUsers, setDevUsers] = useState<DevUser[] | null>(null);
  const [loadingDev, setLoadingDev] = useState(true);
  const [devError, setDevError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar(4000);

  useEffect(() => {
    (async () => {
      try {
        const users = await listDevUsers();
        setDevUsers(users);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'błąd';
        // /dev/users only works when backend is in ENV=dev. If the deployed
        // backend is in prod, this 404s — that's expected.
        setDevError(msg);
      } finally {
        setLoadingDev(false);
      }
    })();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isGoogleSignInConfigured) {
      showSnackbar('Brak googleWebClientId w app.json -> extra.');
      return;
    }
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      showSnackbar(e instanceof Error ? `Logowanie nieudane: ${e.message}` : 'Logowanie nieudane');
    } finally {
      setSigningIn(false);
    }
  };

  const googleDisabled = !isGoogleSignInConfigured || signingIn;
  const googleHint = !isGoogleSignInConfigured
    ? 'Brak googleWebClientId w app.json. Pobierz go z Firebase Console → Authentication → Google → Web SDK config.'
    : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Wyjątkowe Serca</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Aplikacja dla pacjentów</Text>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Zaloguj się</Text>
          <Button
            mode="contained"
            icon="google"
            onPress={handleGoogleSignIn}
            style={styles.googleBtn}
            disabled={googleDisabled}
            loading={signingIn}
          >
            Zaloguj przez Google
          </Button>
          {googleHint && <Text style={styles.hint}>{googleHint}</Text>}
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Konta deweloperskie</Text>
          <Text style={styles.hint}>
            Dostępne tylko gdy backend działa w trybie ENV=dev. Pozwalają zalogować się jako
            istniejący pacjent bez logowania Google.
          </Text>

          {loadingDev && (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.red} />
            </View>
          )}

          {devError && !loadingDev && (
            <Banner
              visible
              icon="information"
              style={styles.banner}
            >
              {`Lista kont deweloperskich niedostępna (${devError}). Backend jest w trybie produkcyjnym lub niedostępny.`}
            </Banner>
          )}

          {devUsers && devUsers.length === 0 && !loadingDev && (
            <Text style={styles.hint}>Brak kont deweloperskich.</Text>
          )}

          {devUsers?.map((u) => (
            <Button
              key={u.uid}
              mode="outlined"
              icon="account"
              style={styles.devUserBtn}
              onPress={() => signInAsDevUser(u.uid, u.email)}
            >
              {u.email}
            </Button>
          ))}
        </Card.Content>
      </Card>

      {snackbarEl}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.greyBg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 32,
  },
  title: { color: colors.red, fontWeight: '700' },
  subtitle: { color: colors.grey2, marginTop: 4 },
  card: { marginBottom: 16 },
  cardTitle: { color: colors.grey1, marginBottom: 12 },
  googleBtn: { marginTop: 4 },
  hint: { color: colors.grey2, fontSize: 13, marginTop: 12, lineHeight: 18 },
  loader: { paddingVertical: 16, alignItems: 'center' },
  banner: { marginTop: 8, backgroundColor: 'transparent' },
  devUserBtn: { marginTop: 8 },
});
