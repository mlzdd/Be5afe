import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@shared/theme';
import { getCategoryIcon } from '@products/bsafe/trips/tripUtils';
import type { Activity } from '@products/bsafe/trips/types';

type Category = Activity['category'];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'flight',      label: 'Flight'      },
  { value: 'train',       label: 'Train'       },
  { value: 'bus',         label: 'Bus'         },
  { value: 'ship',        label: 'Ship'        },
  { value: 'drive',       label: 'Drive'       },
  { value: 'car-rental',  label: 'Car Rental'  },
  { value: 'hotel',       label: 'Hotel'       },
  { value: 'restaurant',  label: 'Restaurant'  },
  { value: 'tour',        label: 'Tour'        },
  { value: 'shopping',    label: 'Shopping'    },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'other',       label: 'Other'       },
];

interface Props {
  visible: boolean;
  dayDate: string;
  onClose: () => void;
  onAdd: (activity: Omit<Activity, 'id'>) => Promise<void>;
}

export function AddActivityModal({ visible, dayDate, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<Category>('sightseeing');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(''); setTime(''); setCategory('sightseeing');
    setLocation(''); setNotes(''); setPrice('');
  };

  const handleAdd = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Title is required.'); return; }
    if (!time.trim()) { Alert.alert('Required', 'Time is required.'); return; }
    const priceNum = price ? parseFloat(price) : undefined;
    if (price && (isNaN(priceNum!) || priceNum! < 0)) {
      Alert.alert('Invalid price', 'Enter a valid positive number.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        title: title.trim(),
        time: time.trim(),
        category,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        price: priceNum,
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
          <Text style={s.title}>Add Activity</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.dayLabel}>{dayDate}</Text>

          <View style={s.field}>
            <Text style={s.label}>Title *</Text>
            <TextInput
              style={s.input} value={title} onChangeText={setTitle}
              placeholder="e.g. Visit Wat Pho" placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Time *</Text>
            <TextInput
              style={s.input} value={time} onChangeText={setTime}
              placeholder="e.g. 09:00" placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[s.chip, category === c.value && s.chipActive]}
                  onPress={() => setCategory(c.value)}
                >
                  <Ionicons
                    name={getCategoryIcon(c.value) as never}
                    size={14}
                    color={category === c.value ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={[s.chipText, category === c.value && s.chipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Location</Text>
            <TextInput
              style={s.input} value={location} onChangeText={setLocation}
              placeholder="Optional address or venue" placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Price</Text>
            <TextInput
              style={s.input} value={price} onChangeText={setPrice}
              placeholder="e.g. 25.00" placeholderTextColor={colors.placeholder}
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
            <Text style={s.btnText}>{saving ? 'Saving…' : 'Add Activity'}</Text>
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
  dayLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs },
  body: { padding: spacing.base, gap: spacing.md },
  field: { gap: 6 },
  label: { ...typography.label, color: colors.textSecondary },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: spacing.md, ...typography.body, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  multiline: { height: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  btn: { backgroundColor: colors.brandDark, borderRadius: 12, padding: spacing.base, alignItems: 'center', marginTop: spacing.sm },
  btnText: { ...typography.button, color: colors.textInverse },
});
