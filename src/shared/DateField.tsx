import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors, spacing } from '../app/theme';

function parseYmd(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function displayDate(value: string): string {
  const parsed = parseYmd(value);
  if (!parsed) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  allowClear = true,
  clearLabel = 'Clear',
  doneLabel = 'Done',
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  doneLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseYmd(value) ?? new Date(), [value]);

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    if (date) {
      onChange(formatYmd(date));
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.input, pressed && styles.pressed]}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? displayDate(value) : placeholder}
        </Text>
      </Pressable>
      {allowClear && value ? (
        <Pressable onPress={() => onChange('')} style={styles.clearBtn}>
          <Text style={styles.clearText}>{clearLabel}</Text>
        </Pressable>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          onChange={onPickerChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide">
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setOpen(false)}>
                  <Text style={styles.done}>{doneLabel}</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selected}
                mode="date"
                display="spinner"
                onChange={onPickerChange}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  pressed: { opacity: 0.85 },
  value: {
    color: colors.text,
    fontSize: 16,
  },
  placeholder: {
    color: colors.textMuted,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  done: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  iosPicker: {
    alignSelf: 'center',
  },
});
