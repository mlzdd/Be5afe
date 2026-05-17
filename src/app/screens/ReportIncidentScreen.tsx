import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCountryByName } from '@modules/regional-data/lookup';
import { colors, spacing, typography } from '@shared/theme';
import type { ScamSeverity } from '@products/bsafe/scam-reports';
import { useAppContext } from '../AppContext';

const SEVERITIES: ScamSeverity[] = ['low', 'medium', 'high'];

export function ReportIncidentScreen() {
  const navigation = useNavigation();
  const { auth, location, scamReports } = useAppContext();
  const defaultCountryName = location.selectedCountryName ?? 'Thailand';
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [countryName, setCountryName] = useState(defaultCountryName);
  const [localityText, setLocalityText] = useState(location.selectedCityName ?? '');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ScamSeverity>('medium');

  const country = useMemo(() => getCountryByName(countryName.trim()), [countryName]);
  const canSubmit =
    !!auth.user &&
    !!country &&
    title.trim().length > 0 &&
    category.trim().length > 0 &&
    description.trim().length >= 20 &&
    !scamReports.isSubmitting;

  async function onSubmit() {
    if (!auth.user) {
      Alert.alert('Sign in required', 'Please sign in before submitting a scam report.');
      return;
    }
    if (!country) {
      Alert.alert('Choose a supported country', 'Enter a country name that Be5afe recognises.');
      return;
    }
    if (!canSubmit) {
      Alert.alert('Add a little more detail', 'Please complete every field and describe what happened in at least 20 characters.');
      return;
    }

    try {
      await scamReports.submitReport({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        countryId: country.iso2,
        countryName: country.name,
        localityText: localityText.trim() || undefined,
        severity,
      });
      Alert.alert('Report submitted', 'Thanks — your report is now in the moderation queue.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not submit report', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Report Incident</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {!auth.user && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>Sign in is required so moderators can review abuse and follow up if needed.</Text>
          </View>
        )}
        <Field label="Short title" value={title} onChangeText={setTitle} placeholder="e.g. Driver refused the meter" />
        <Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. taxi, ATM, fake police" />
        <Field label="Country" value={countryName} onChangeText={setCountryName} placeholder="e.g. Thailand" />
        <Field label="Area or city" value={localityText} onChangeText={setLocalityText} placeholder="Optional" />
        <View style={styles.field}>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityRow}>
            {SEVERITIES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setSeverity(item)}
                style={[styles.severityButton, severity === item && styles.severityButtonActive]}
              >
                <Text style={[styles.severityText, severity === item && styles.severityTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Field
          label="What happened?"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the incident, what was requested, and what helped you recognise it."
          multiline
        />
        <Text style={styles.helper}>Reports start as community submissions. BSafe reviews them before they can become editorial guidance.</Text>
        <TouchableOpacity
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitText}>{scamReports.isSubmitting ? 'Submitting…' : 'Submit report'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  multiline?: boolean;
  value: string;
  onChangeText(value: string): void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  body: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.xl },
  notice: { backgroundColor: colors.warning + '18', borderRadius: 12, padding: spacing.md },
  noticeText: { ...typography.bodySmall, color: colors.textPrimary },
  field: { gap: spacing.xs },
  label: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '700' },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multilineInput: { minHeight: 120, textAlignVertical: 'top' },
  severityRow: { flexDirection: 'row', gap: spacing.sm },
  severityButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  severityButtonActive: { borderColor: colors.warning, backgroundColor: colors.warning + '18' },
  severityText: { ...typography.bodySmall, color: colors.textSecondary, textTransform: 'capitalize' },
  severityTextActive: { color: colors.warning, fontWeight: '700' },
  helper: { ...typography.caption, color: colors.textSecondary },
  submit: { backgroundColor: colors.brandDark, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' },
  submitDisabled: { opacity: 0.45 },
  submitText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
