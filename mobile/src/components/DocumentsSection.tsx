import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, IconButton, Icon, Text, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import { SectionCard } from './SectionCard';
import { DateTimePickerField } from './DateTimePickerField';
import { confirmDelete } from '../lib/confirm';
import { makeApi, TokenProvider } from '../api/client';
import { PatientDocument } from '../types/api';
import { pickPdf, uploadPdf, openDocument, PickedPdf } from '../lib/documents';
import { formatDate, formatBytes, toIsoDate } from '../lib/format';
import { colors } from '../theme/colors';

interface Props {
  // The parent screen owns the list (loaded and cached alongside the
  // profile); this section only renders it and applies local edits.
  docs: PatientDocument[];
  onDocsChange: (update: (prev: PatientDocument[]) => PatientDocument[]) => void;
  getToken: TokenProvider;
  // Whether the *signed-in account* may upload. Viewing follows profile
  // access, so guests see the owner's documents regardless.
  uploadApproved: boolean;
  showSnackbar: (msg: string) => void;
}

const byDateDesc = (a: PatientDocument, b: PatientDocument) => b.date.localeCompare(a.date);

export function DocumentsSection({ docs, onDocsChange, getToken, uploadApproved, showSnackbar }: Props) {
  const [pending, setPending] = useState<(PickedPdf & { date: Date }) | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const choose = async () => {
    try {
      const file = await pickPdf();
      if (file) setPending({ ...file, date: new Date() });
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Nie udało się wybrać pliku');
    }
  };

  const upload = async () => {
    if (!pending) return;
    setUploading(true);
    try {
      const saved = await uploadPdf(getToken, pending, toIsoDate(pending.date));
      onDocsChange((prev) => [saved, ...prev].sort(byDateDesc));
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
      await openDocument(getToken, doc);
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
          await makeApi(getToken).deleteDocument(doc.id);
          onDocsChange((prev) => prev.filter((d) => d.id !== doc.id));
          showSnackbar('Dokument usunięty');
        } catch (e) {
          showSnackbar(e instanceof Error ? e.message : 'Nie udało się usunąć dokumentu');
        }
      },
    });
  };

  return (
    <SectionCard title="Dokumentacja medyczna">
      {docs.length === 0 ? (
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
              <Text style={styles.meta}>{formatDate(doc.date)} · {formatBytes(doc.size)}</Text>
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
          {pending && (
            <Dialog.Content style={styles.dialogBody}>
              <Text style={styles.name} numberOfLines={2}>{pending.name}</Text>
              <Text style={styles.meta}>{formatBytes(pending.size)}</Text>
              <DateTimePickerField
                label="Data dokumentu"
                value={pending.date}
                onChange={(date) => setPending({ ...pending, date })}
                mode="date"
              />
            </Dialog.Content>
          )}
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
