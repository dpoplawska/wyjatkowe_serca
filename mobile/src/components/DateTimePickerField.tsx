import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import dayjs from 'dayjs';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  onClear?: () => void;
}

export function DateTimePickerField({ label, value, onChange, onClear }: Props) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const display = value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '';

  return (
    <>
      <Pressable onPress={() => setDatePickerOpen(true)}>
        <TextInput
          mode="outlined"
          label={label}
          value={display}
          editable={false}
          right={
            <TextInput.Icon
              icon={onClear && value ? 'close' : 'calendar-clock'}
              onPress={() => {
                if (onClear && value) onClear();
                else setDatePickerOpen(true);
              }}
            />
          }
          onPressIn={() => setDatePickerOpen(true)}
        />
      </Pressable>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={datePickerOpen}
        onDismiss={() => setDatePickerOpen(false)}
        date={value ?? new Date()}
        onConfirm={(params) => {
          setDatePickerOpen(false);
          if (params.date) {
            const next = new Date(params.date);
            if (value) {
              next.setHours(value.getHours(), value.getMinutes());
            } else {
              const now = new Date();
              next.setHours(now.getHours(), now.getMinutes());
            }
            onChange(next);
            setTimeout(() => setTimePickerOpen(true), 150);
          }
        }}
      />

      <TimePickerModal
        locale="en"
        visible={timePickerOpen}
        onDismiss={() => setTimePickerOpen(false)}
        onConfirm={({ hours, minutes }) => {
          setTimePickerOpen(false);
          const base = value ?? new Date();
          const next = new Date(base);
          next.setHours(hours, minutes, 0, 0);
          onChange(next);
        }}
        hours={value?.getHours() ?? new Date().getHours()}
        minutes={value?.getMinutes() ?? 0}
      />
    </>
  );
}
