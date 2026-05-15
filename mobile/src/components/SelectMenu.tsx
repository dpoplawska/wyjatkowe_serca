import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

export function SelectMenu({ label, value, onChange, options }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable onPress={() => setOpen(true)}>
            <TextInput
              mode="outlined"
              label={label}
              value={value}
              editable={false}
              right={<TextInput.Icon icon="menu-down" onPress={() => setOpen(true)} />}
              onPressIn={() => setOpen(true)}
              outlineColor={colors.border}
              activeOutlineColor={colors.red}
            />
          </Pressable>
        }
        contentStyle={styles.menu}
      >
        {options.map((opt) => (
          <Menu.Item
            key={opt}
            onPress={() => { onChange(opt); setOpen(false); }}
            title={opt}
            titleStyle={{ color: opt === value ? colors.red : colors.grey1 }}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: { maxHeight: 400, backgroundColor: 'white' },
});
