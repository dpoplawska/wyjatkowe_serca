import React, { useMemo, useState } from 'react';
import { View, Pressable, FlatList, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  TextInput,
  Text,
  Button,
} from 'react-native-paper';
import { colors } from '../theme/colors';
import { fuzzyMatch } from '../lib/patientProfileOptions';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  searchable?: boolean;
}

export function SelectMenu({ label, value, onChange, options, searchable }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const enableSearch = searchable ?? options.length > 10;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter((o) => fuzzyMatch(o, query.trim()));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View>
      <Pressable onPress={() => setOpen(true)}>
        <TextInput
          mode="outlined"
          label={label}
          value={value}
          editable={false}
          multiline
          right={<TextInput.Icon icon="menu-down" onPress={() => setOpen(true)} />}
          onPressIn={() => setOpen(true)}
        />
      </Pressable>

      <Portal>
        <Modal visible={open} onDismiss={close} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={styles.title}>{label}</Text>
          {enableSearch && (
            <TextInput
              mode="outlined"
              placeholder="Szukaj..."
              value={query}
              onChangeText={setQuery}
              dense
              style={styles.search}
              autoCorrect={false}
            />
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  onPress={() => { onChange(item); close(); }}
                  style={[styles.row, selected && styles.rowSelected]}
                >
                  <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{item}</Text>
                </Pressable>
              );
            }}
          />
          <Button mode="text" onPress={close} textColor={colors.grey2}>Anuluj</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: '85%',
  },
  title: { marginBottom: 12, fontWeight: '700' },
  search: { marginBottom: 8 },
  list: { maxHeight: 480, marginBottom: 8 },
  row: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLighter },
  rowSelected: { backgroundColor: colors.blueTint },
  rowText: { color: colors.grey1, fontSize: 14, lineHeight: 19 },
  rowTextSelected: { color: colors.blue, fontWeight: '700' },
});
