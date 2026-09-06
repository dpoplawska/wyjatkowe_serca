import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, IconButton, Icon, Text, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import { SectionCard } from './SectionCard';
import { DateTimePickerField } from './DateTimePickerField';
import { confirmDelete } from '../lib/confirm';
import { makeApi, TokenProvider } from '../api/client';
import { PatientDocument } from '../types/api';
import { pickPdf, uploadPdf, openDocument, formatBytes, PickedPdf } from '../lib/documents';
import dayjs from 'dayjs';
import { toIsoDate } from '../lib/format';
import { colors } from '../theme/colors';

interface Props {
  getToken: TokenProvider;
  // Whether the *signed-in account* may upload. Viewing follows profile
  // access, so guests see the owner's documents regardless.
  uploadApproved: boolean;
  showSnackbar: (msg: string) => void;
}

export function DocumentsSection({ getToken, uploadApproved, showSnackbar }: Props) {
  const [docs, setDocs] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PickedPdf | null>(null);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const load = useCallback(async () => {
    try {
      const list = await makeApi(getTokenRef.current).listDocuments();
      setDocs(list);
    } catch {
      // keep whatever we had
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const choose = async () => {
    try {
      const file = await pickPdf();
      if (!file) return;
      setPendingDate(new Date());
      setPending(file);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Nie udało się wybrać pliku');
    }
  };

  const upload = async () => {
    if (!pending) return;
    setUploading(true);
    try {
      const saved = await uploadPdf(getTokenRef.current, pending, toIsoDate(pendingDate));
      setDocs((prev) => [saved, ...prev].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)));
      setPending(null);
      showSnackbar('Dokument dodany');
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Nie udało się wysłać dokumentu');
    } finally {
      setUploading(false);
    }
  };

  const open = async (doc: PatientDocument) => {
    if (openingId) return;
    setOpeningId(doc.id);
    try {
      await openDocument(getTokenRef.current, doc);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Nie udało się otworzyć dokumentu');
    } finally {
      setOpeningId(null);
    }
  };

  const remove = (doc: PatientDocument) => {
    confirmDelete({
      title: 'Usunąć dokument?',
      message: `${doc.name} zostanie trwale usunięty.`,
      onConfirm: async () => {
        try {
          await makeApi(getTokenRef.current).deleteDocument(doc.id);
          setDocs((prev) => prev.filter((d) => d.id !== doc.id));
          showSnackbar('Dokument usunięty');
        } catch (e) {
          showSnackbar(e instanceof Error ? e.message : 'Nie udało się usunąć dokumentu');
        }
      },
    });
  };

  return (
    <SectionCard title="Dokumentacja medyczna">
      {loading ? (
        <ActivityIndicator color={colors.blue} />
      ) : docs.length === 0 ? (
        <Text style={styles.empty}>Brak dokumentów. Dodaj wypis, wynik badania lub konsultację w formacie PDF.</Text>
      ) : (
        docs.map((doc) => (
          <Pressable
            key={doc.id}
            onPress={() => open(doc)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`Otwórz ${doc.name}`}
          >
            <View style={styles.rowIcon}>
              {openingId === doc.id ? (
                <ActivityIndicator size={20} color={colors.blue} />
              ) : (
                <Icon source="file-pdf-box" color={colors.red} size={24} />
              )}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.name} numberOfLines={1}>{doc.name}</Text>
              <Text style={styles.meta}>{dayjs(doc.date).format('DD.MM.YYYY')} · {formatBytes(doc.size)}</Text>
            </View>
            <IconButton
              icon="delete-outline"
              iconColor={colors.red}
              onPress={() => remove(doc)}
              accessibilityLabel={`Usuń ${doc.name}`}
            />
          </Pressable>
        ))
      )}

      {uploadApproved ? (
        <Button mode="outlined" icon="file-upload-outline" onPress={choose} textColor={colors.blue}>
          Dodaj dokument PDF
        </Button>
      ) : (
        <Text style={styles.notice}>
          Wgrywanie dokumentów wymaga zatwierdzenia konta przez fundację. Skontaktuj się z nami, aby
          włączyć tę funkcję.
        </Text>
      )}

      <Portal>
        <Dialog visible={pending !== null} onDismiss={() => !uploading && setPending(null)}>
          <Dialog.Title>Dodaj dokument</Dialog.Title>
          <Dialog.Content style={styles.dialogBody}>
            <Text style={styles.name} numberOfLines={2}>{pending?.name}</Text>
            <Text style={styles.meta}>{pending ? formatBytes(pending.size) : ''}</Text>
            <DateTimePickerField label="Data dokumentu" value={pendingDate} onChange={setPendingDate} mode="date" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPending(null)} disabled={uploading}>Anuluj</Button>
            <Button mode="contained" onPress={upload} loading={uploading} disabled={uploading} buttonColor={colors.blue}>
              Wyślij
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  name: { fontSize: 14, color: colors.grey1, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.grey2, marginTop: 2 },
  empty: { fontSize: 13, color: colors.grey2 },
  notice: {
    fontSize: 13,
    color: colors.infoFgStrong,
    backgroundColor: colors.blueTint,
    borderRadius: 8,
    padding: 10,
  },
  dialogBody: { gap: 8 },
});
