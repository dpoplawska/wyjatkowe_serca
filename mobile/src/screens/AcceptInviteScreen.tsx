import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Snackbar } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { RootStackParamList, RootStackNav } from '../navigation/types';
import { colors } from '../theme/colors';

type R = RouteProp<RootStackParamList, 'AcceptInvite'>;

export default function AcceptInviteScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<RootStackNav>();
  const { user, getToken } = useAuth();
  const token = route.params?.token;

  const [info, setInfo] = useState<{ childName: string; hasExistingData: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const api = makeApi(getToken);
        const data = await api.getInvite(token);
        setInfo({ childName: data.childName, hasExistingData: data.hasExistingData });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nie udało się pobrać zaproszenia');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Zaloguj się, aby zaakceptować zaproszenie.</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Text>Brakuje tokenu zaproszenia.</Text>
      </View>
    );
  }

  const accept = async () => {
    setSubmitting(true);
    try {
      const api = makeApi(getToken);
      await api.acceptInvite(token);
      setSnackbar('Dostęp przyznany');
      setTimeout(() => navigation.replace('Main'), 800);
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : 'Błąd');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.red} />
      ) : error ? (
        <Card><Card.Content><Text>{error}</Text></Card.Content></Card>
      ) : info ? (
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>Zaproszenie</Text>
            <Text style={{ marginBottom: 12 }}>
              {info.childName
                ? `Otrzymujesz dostęp do profilu: ${info.childName}.`
                : 'Otrzymujesz dostęp do profilu pacjenta.'}
            </Text>
            {info.hasExistingData && (
              <Text style={{ color: colors.red, marginBottom: 12 }}>
                Uwaga: masz już własne dane w aplikacji. Zaakceptowanie zaproszenia
                spowoduje wyświetlanie danych właściciela zaproszenia. Twoje obecne
                dane zostaną zachowane, ale niewidoczne.
              </Text>
            )}
            <Button mode="contained" onPress={accept} loading={submitting} disabled={submitting} buttonColor={colors.red}>
              Akceptuję
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      <Snackbar visible={snackbar !== null} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.greyBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
