import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@shared/theme';
import type { Booking } from '@products/bsafe/trips/types';
import { DateTimePicker } from '../../components/DateTimePicker';

type BookingType = Booking['type'];

const BOOKING_TYPES: { value: BookingType; label: string; icon: string }[] = [
  { value: 'flight', label: 'Flight',  icon: 'airplane'       },
  { value: 'hotel',  label: 'Hotel',   icon: 'bed'            },
  { value: 'car',    label: 'Car',     icon: 'car'            },
  { value: 'tour',   label: 'Tour',    icon: 'compass'        },
  { value: 'other',  label: 'Other',   icon: 'receipt-outline' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (booking: Omit<Booking, 'id'>) => Promise<void>;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

export function AddBookingModal({ visible, onClose, onAdd }: Props) {
  const [type, setType] = useState<BookingType>('flight');
  const [title, setTitle] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType('flight'); setTitle(''); setConfirmationNumber('');
    setDate(''); setPrice(''); setNotes('');
  };

  const handleAdd = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Title is required.'); return; }
    if (date && !isValidDate(date)) { Alert.alert('Invalid date', 'Date must be YYYY-MM-DD.'); return; }
    const priceNum = price ? parseFloat(price) : undefined;
    if (price && (isNaN(priceNum!) || priceNum! < 0)) {
      Alert.alert('Invalid price', 'Enter a valid positive number.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        type,
        title: title.trim(),
        confirmationNumber: confirmationNumber.trim() || undefined,
        date: date || undefined,
        price: priceNum,
        notes: notes.trim() || undefined,
        status: 'planning',
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Add Booking</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          <View style={s.field}>
            <Text style={s.label}>Type</Text>
            <View style={s.typeRow}>
              {BOOKING_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.typeBtn, type === t.value && s.typeBtnActive]}
                  onPress={() => setType(t.value)}
                >
                  <Ionicons
                    name={t.icon as never}
                    size={18}
                    color={type === t.value ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={[s.typeLabel, type === t.value && s.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Title *</Text>
            <TextInput
              style={s.input} value={title} onChangeText={setTitle}
              placeholder="e.g. Bangkok → Chiang Mai" placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Confirmation number</Text>
            <TextInput
              style={s.input} value={confirmationNumber} onChangeText={setConfirmationNumber}
              placeholder="e.g. ABC123" placeholderTextColor={colors.placeholder}
              autoCapitalize="characters"
            />
          </View>

          <DateTimePicker label="Date" value={date} onChange={setDate} placeholder="Select date" mode="date" />

          <View style={s.field}>
            <Text style={s.label}>Price</Text>
            <TextInput
              style={s.input} value={price} onChangeText={setPrice}
              placeholder="e.g. 120.00" placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Notes</Text>
            <TextInput
              style={[s.input, s.multiline]} value={notes} onChangeText={setNotes}
              placeholder="Optional notes" placeholderTextColor={colors.placeholder}
              multiline numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={s.btn} onPress={handleAdd} disabled={saving}>
            <Text style={s.btnText}>{saving ? 'Saving…' : 'Add Booking'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { padding: spacing.base, gap: spacing.md },
  field: { gap: 6 },
  label: { ...typography.label, color: colors.textSecondary },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: spacing.md, ...typography.body, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  multiline: { height: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  typeBtnActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  typeLabel: { ...typography.caption, color: colors.textSecondary },
  typeLabelActive: { color: colors.textInverse },
  btn: { backgroundColor: colors.brandDark, borderRadius: 12, padding: spacing.base, alignItems: 'center', marginTop: spacing.sm },
  btnText: { ...typography.button, color: colors.textInverse },
});
