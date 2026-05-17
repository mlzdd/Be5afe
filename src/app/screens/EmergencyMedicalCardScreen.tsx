import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { EMPTY_MEDICAL_CARD } from '@products/bsafe/travel-tools/useMedicalCard';
import type { MedicalCard } from '@products/bsafe/travel-tools/types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export function EmergencyMedicalCardScreen() {
  const navigation = useNavigation();
  const { travelTools } = useAppContext();
  const { medicalCard: card, saveMedicalCard } = travelTools;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MedicalCard>(EMPTY_MEDICAL_CARD);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(card);
  }, [card]);

  const startEdit = () => { setDraft(card); setEditing(true); };

  const saveCard = async () => {
    await saveMedicalCard(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const cancelEdit = () => {
    setDraft(card);
    setEditing(false);
  };

  const field = (key: keyof MedicalCard) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const isEmpty = !card.bloodType && !card.allergies && !card.conditions && !card.medications;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Medical Card</Text>
        {!editing ? (
          <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
            <Ionicons name="pencil" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveCard} style={styles.saveBtn}>
              <Text style={styles.saveText}>{saved ? 'Saved!' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {isEmpty && !editing && (
          <View style={styles.emptyBanner}>
            <Ionicons name="medical" size={32} color={colors.error} />
            <Text style={styles.emptyTitle}>No medical info saved</Text>
            <Text style={styles.emptySub}>In an emergency, first responders may need this information.</Text>
            <TouchableOpacity style={styles.fillBtn} onPress={startEdit}>
              <Text style={styles.fillBtnText}>Fill in my medical card</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Blood Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water" size={18} color={colors.error} />
            <Text style={styles.sectionTitle}>Blood Type</Text>
          </View>
          {editing ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {BLOOD_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt}
                  style={[styles.chip, draft.bloodType === bt && styles.chipActive]}
                  onPress={() => setDraft((p) => ({ ...p, bloodType: bt }))}
                >
                  <Text style={[styles.chipText, draft.bloodType === bt && styles.chipTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.value, !card.bloodType && styles.empty]}>
              {card.bloodType || 'Not set'}
            </Text>
          )}
        </View>

        {/* Allergies */}
        <FieldSection
          icon="alert-circle"
          iconColor={colors.warning}
          title="Allergies"
          value={card.allergies}
          draftValue={draft.allergies}
          editing={editing}
          onEdit={field('allergies')}
          placeholder="e.g. Penicillin, peanuts, latex"
          multiline
        />

        {/* Medical Conditions */}
        <FieldSection
          icon="heart"
          iconColor={colors.error}
          title="Medical Conditions"
          value={card.conditions}
          draftValue={draft.conditions}
          editing={editing}
          onEdit={field('conditions')}
          placeholder="e.g. Diabetes Type 2, asthma, epilepsy"
          multiline
        />

        {/* Medications */}
        <FieldSection
          icon="medkit"
          iconColor={colors.info}
          title="Current Medications"
          value={card.medications}
          draftValue={draft.medications}
          editing={editing}
          onEdit={field('medications')}
          placeholder="e.g. Metformin 500mg daily, Ventolin as needed"
          multiline
        />

        {/* Emergency Notes */}
        <FieldSection
          icon="document-text"
          iconColor={colors.textSecondary}
          title="Emergency Notes"
          value={card.emergencyNotes}
          draftValue={draft.emergencyNotes}
          editing={editing}
          onEdit={field('emergencyNotes')}
          placeholder="Any other important information for first responders"
          multiline
        />

        {/* Doctor */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color={colors.brandDark} />
            <Text style={styles.sectionTitle}>Home Doctor</Text>
          </View>
          {editing ? (
            <View style={styles.fieldGroup}>
              <TextInput
                style={styles.input}
                value={draft.doctorName}
                onChangeText={field('doctorName')}
                placeholder="Doctor's name"
                placeholderTextColor={colors.placeholder}
              />
              <TextInput
                style={styles.input}
                value={draft.doctorPhone}
                onChangeText={field('doctorPhone')}
                placeholder="Doctor's phone"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          ) : (
            <View style={styles.fieldGroup}>
              <Text style={[styles.value, !card.doctorName && styles.empty]}>
                {card.doctorName || 'Not set'}
              </Text>
              {card.doctorPhone ? <Text style={styles.subValue}>{card.doctorPhone}</Text> : null}
            </View>
          )}
        </View>

        {/* Organ donor */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => editing && setDraft((p) => ({ ...p, organDonor: !p.organDonor }))}
            disabled={!editing}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-circle" size={18} color={colors.error} />
              <Text style={styles.sectionTitle}>Organ Donor</Text>
            </View>
            <View style={[styles.toggle, (editing ? draft.organDonor : card.organDonor) && styles.toggleOn]}>
              <Text style={styles.toggleText}>{(editing ? draft.organDonor : card.organDonor) ? 'Yes' : 'No'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FieldSectionProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string;
  draftValue: string;
  editing: boolean;
  onEdit: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}

function FieldSection({ icon, iconColor, title, value, draftValue, editing, onEdit, placeholder, multiline }: FieldSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as never} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {editing ? (
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          value={draftValue}
          onChangeText={onEdit}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={[styles.value, !value && styles.empty]}>{value || 'Not set'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  editBtn: { padding: 4 },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, borderWidth: 1, borderColor: colors.brandLight },
  cancelText: { ...typography.bodySmall, color: colors.brandLight },
  saveBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, backgroundColor: colors.success },
  saveText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '700' },
  body: { padding: spacing.base, gap: spacing.md },
  emptyBanner: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: spacing.lg, alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.error + '30' },
  emptyTitle: { ...typography.h4, color: colors.error },
  emptySub: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  fillBtn: { backgroundColor: colors.brandDark, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  fillBtnText: { ...typography.button, color: colors.textInverse },
  section: { backgroundColor: colors.card, borderRadius: 14, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.h4, color: colors.textPrimary },
  value: { ...typography.body, color: colors.textPrimary },
  subValue: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { color: colors.textTertiary, fontStyle: 'italic' },
  chipRow: { marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.sm },
  chipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  chipText: { ...typography.bodySmall, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: spacing.md, ...typography.body, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  fieldGroup: { gap: spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  toggleOn: { backgroundColor: colors.success },
  toggleText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '700' },
});
