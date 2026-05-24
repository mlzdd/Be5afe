import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NativeDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';

interface DateTimePickerProps {
  label: string;
  value: string;
  mode: 'date' | 'time';
  placeholder: string;
  onChange(value: string): void;
}

export function DateTimePicker({ label, value, mode, placeholder, onChange }: DateTimePickerProps) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const date = parseValue(value, mode);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (!selected) return;
    onChange(mode === 'date' ? formatDate(selected) : formatTime(selected));
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => setOpen(true)}
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
      >
        <Text style={[styles.value, { color: value ? colors.textPrimary : colors.placeholder }]}>
          {value || placeholder}
        </Text>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {open ? (
        <NativeDateTimePicker
          value={date}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

function parseValue(value: string, mode: 'date' | 'time'): Date {
  if (mode === 'date' && value) {
    const parsed = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (mode === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return new Date();
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    ...typography.label,
  },
  input: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  value: {
    ...typography.body,
  },
});
