import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Switch, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { makeApi } from '../api/client';
import { AdminUser } from '../types/api';
import { useSnackbar } from '../hooks/useSnackbar';
import { colors } from '../theme/colors';

// Foundation-only screen: mark which accounts may upload medical
// documentation. Reachable from the profile header when /me says isAdmin.
export default function AdminUsersScreen() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { show: showSnackbar, element: snackbarEl } = useSnackbar();

  const load = useCallback(async () => {
    try {
      setUsers(await makeApi(getToken).adminListUsers());
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Nie udało się pobrać listy');
    } finally {
      setLoading(false);
    }
  }, [getToken, showSnackbar]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggle = async (u: AdminUser, approved: boolean) => {
    setBusy(u.uid);
    try {
      await makeApi(getToken).adminSetApproval(u.uid, approved);
      setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, uploadApproved: approved } : x)));
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Nie udało się zapisać');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={users}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Włącz przełącznik, aby pozwolić użytkownikowi wgrywać dokumentację medyczną (PDF).
          </Text>
        }
        ListEmptyComponent={<Text style={styles.hint}>Brak użytkowników.</Text>}
        renderItem={({ item: u }) => (
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.name} numberOfLines={1}>
                {u.name || u.email || u.uid}
                {u.isAdmin ? '  · admin' : ''}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>{u.email || u.uid}</Text>
            </View>
            {busy === u.uid ? (
              <ActivityIndicator size={20} color={colors.blue} />
            ) : (
              <Switch
                value={u.uploadApproved}
                onValueChange={(v) => toggle(u, v)}
                color={colors.blue}
                accessibilityLabel={`Zatwierdź wgrywanie: ${u.email || u.uid}`}
              />
            )}
          </View>
        )}
      />
      {snackbarEl}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.greyBg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greyBg },
  list: { padding: 16, gap: 8 },
  hint: { fontSize: 13, color: colors.grey2, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.grey1 },
  meta: { fontSize: 12, color: colors.grey2, marginTop: 2 },
});
