import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Modal, Portal, TextInput, Text, Checkbox, Button } from 'react-native-paper';
import { colors } from '../theme/colors';
import { fuzzyMatch } from '../lib/patientProfileOptions';

interface Props {
  visible: boolean;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  onClose: () => void;
  title: string;
}

export function MultiSelectModal({ visible, options, value, onChange, onClose, title }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter((o) => fuzzyMatch(o, query.trim()));
  }, [options, query]);

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <Text variant="titleMedium" style={styles.title}>{title}</Text>
        <TextInput
          mode="outlined"
          placeholder="Szukaj..."
          value={query}
          onChangeText={setQuery}
          dense
          style={styles.search}
          autoCorrect={false}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          style={styles.list}
          renderItem={({ item }) => {
            const checked = value.includes(item);
            return (
              <Pressable onPress={() => toggle(item)} style={styles.row}>
                <Checkbox status={checked ? 'checked' : 'unchecked'} color={colors.red} />
                <Text style={styles.rowText}>{item}</Text>
              </Pressable>
            );
          }}
        />
        <Button mode="contained" buttonColor={colors.red} onPress={onClose} style={styles.done}>
          Gotowe ({value.length})
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: '85%',
  },
  title: { marginBottom: 12, fontWeight: '700' },
  search: { marginBottom: 8 },
  list: { maxHeight: 400, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowText: { flex: 1, color: colors.grey1 },
  done: { marginTop: 4 },
});
