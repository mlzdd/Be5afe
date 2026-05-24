import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { colors, spacing, typography } from '@shared/theme';
import type { Trip } from '@products/bsafe/trips/types';
import { DateTimePicker } from '../../components/DateTimePicker';
import { LocationSelectorSheet } from '../../components/LocationSelectorSheet';
import { getCountryById } from '@modules/regional-data';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Omit<Trip, 'id' | 'itinerary' | 'bookings' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

export function AddTripModal({ visible, onClose, onAdd }: Props) {
  const locationSheetRef = useRef<BottomSheet>(null);
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDestination(''); setCountry(''); setStartDate('');
    setEndDate(''); setNotes('');
  };

  const handleAdd = async () => {
    if (!destination.trim()) { Alert.alert('Required', 'Destination is required.'); return; }
    if (!country.trim()) { Alert.alert('Required', 'Country is required.'); return; }
    if (!isValidDate(startDate)) { Alert.alert('Invalid date', 'Start date must be YYYY-MM-DD.'); return; }
    if (!isValidDate(endDate)) { Alert.alert('Invalid date', 'End date must be YYYY-MM-DD.'); return; }
    if (endDate < startDate) { Alert.alert('Invalid dates', 'End date must be on or after start date.'); return; }
    setSaving(true);
    try {
      await onAdd({ destination: destination.trim(), country: country.trim(), startDate, endDate, notes: notes.trim() || undefined });
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
          <Text style={s.title}>New Trip</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Field label="Destination *" value={destination} onChangeText={setDestination} placeholder="e.g. Bangkok" />
          <View style={s.field}>
            <Text style={s.label}>Country *</Text>
            <TouchableOpacity style={s.inputButton} onPress={() => locationSheetRef.current?.expand()}>
              <Text style={[s.inputButtonText, !country && { color: colors.placeholder }]}>
                {country || 'Select country'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <DateTimePicker label="Start date *" value={startDate} onChange={setStartDate} placeholder="Select start date" mode="date" />
          <DateTimePicker label="End date *" value={endDate} onChange={setEndDate} placeholder="Select end date" mode="date" />
          <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes about the trip" multiline />
          <TouchableOpacity style={s.btn} onPress={handleAdd} disabled={saving}>
            <Text style={s.btnText}>{saving ? 'Saving…' : 'Add Trip'}</Text>
          </TouchableOpacity>
        </ScrollView>
        <LocationSelectorSheet
          ref={locationSheetRef}
          onLocationSelect={(countryId) => {
            const selected = getCountryById(countryId as never);
            if (selected) setCountry(selected.name);
          }}
          onSelect={() => locationSheetRef.current?.close()}
        />
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; multiline?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.multiline]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.placeholder} multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
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
  inputButton: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: spacing.md, backgroundColor: colors.inputBackground, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputButtonText: { ...typography.body, color: colors.textPrimary },
  multiline: { height: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: colors.brandDark, borderRadius: 12, padding: spacing.base, alignItems: 'center', marginTop: spacing.sm },
  btnText: { ...typography.button, color: colors.textInverse },
});
