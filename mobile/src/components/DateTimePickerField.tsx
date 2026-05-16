import React, { useState } from 'react';
import { Platform, Pressable, View, Modal, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  onClear?: () => void;
  // 'datetime' (default): two-step date → time. 'date': calendar only.
  mode?: 'datetime' | 'date';
}

// Native OS date+time picker. Android shows the system dialog as a sequence
// (date → time). iOS uses a wheel/inline picker inside a Modal because the
// component is declarative there.
export function DateTimePickerField({ label, value, onChange, onClear, mode = 'datetime' }: Props) {
  const display = value
    ? mode === 'date'
      ? dayjs(value).format('DD.MM.YYYY')
      : dayjs(value).format('DD.MM.YYYY, HH:mm')
    : '';

  const open = () => {
    const initial = value ?? new Date();
    if (Platform.OS === 'android') {
      openAndroid(initial, onChange, mode);
    } else {
      setIosOpen(true);
    }
  };

  // iOS-only state.
  const [iosOpen, setIosOpen] = useState(false);
  const [iosMode, setIosMode] = useState<'date' | 'time'>('date');
  const [iosDraft, setIosDraft] = useState<Date>(value ?? new Date());

  return (
    <>
      <Pressable onPress={open}>
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
                else open();
              }}
            />
          }
          onPressIn={open}
        />
      </Pressable>

      {Platform.OS === 'ios' && iosOpen && (
        <Modal transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.iosBackdrop} onPress={() => setIosOpen(false)}>
            <Pressable style={styles.iosSheet} onPress={() => { /* swallow */ }}>
              <Text style={styles.iosTitle}>
                {iosMode === 'date' ? 'Wybierz datę' : 'Wybierz godzinę'}
              </Text>
              <DateTimePicker
                value={iosDraft}
                mode={iosMode}
                display="spinner"
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  if (d) setIosDraft(d);
                }}
                locale="pl-PL"
              />
              <View style={styles.iosActions}>
                <Button onPress={() => setIosOpen(false)}>Anuluj</Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    if (mode === 'datetime' && iosMode === 'date') {
                      setIosMode('time');
                    } else {
                      onChange(iosDraft);
                      setIosOpen(false);
                    }
                  }}
                >
                  {mode === 'datetime' && iosMode === 'date' ? 'Dalej' : 'OK'}
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

function openAndroid(initial: Date, onChange: (d: Date) => void, mode: 'datetime' | 'date') {
  DateTimePickerAndroid.open({
    value: initial,
    mode: 'date',
    is24Hour: true,
    onChange: (event, datePart) => {
      if (event.type !== 'set' || !datePart) return;
      if (mode === 'date') {
        onChange(datePart);
        return;
      }
      DateTimePickerAndroid.open({
        value: datePart,
        mode: 'time',
        is24Hour: true,
        onChange: (event2, timePart) => {
          if (event2.type !== 'set' || !timePart) return;
          const merged = new Date(datePart);
          merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
          onChange(merged);
        },
      });
    },
  });
}

const styles = StyleSheet.create({
  iosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  iosSheet: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
  },
  iosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.grey1,
    marginBottom: 8,
    textAlign: 'center',
  },
  iosActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
