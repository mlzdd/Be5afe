import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';

const STORAGE_KEY = '@be5afe_insurance';

interface InsurancePolicy {
  provider: string;
  policyNumber: string;
  coverStart: string;
  coverEnd: string;
  emergencyNumber: string;
  notes?: string;
  updatedAt: string;
}

const EMPTY: InsurancePolicy = {
  provider: '',
  policyNumber: '',
  coverStart: '',
  coverEnd: '',
  emergencyNumber: '',
  notes: '',
  updatedAt: '',
};

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function coverBadge(days: number | null): { label: string; color: string } | null {
  if (days === null) return null;
  if (days < 0) return { label: 'Expired', color: '#9E9E9E' };
  if (days < 30) return { label: `Expires in ${days}d`, color: '#F44336' };
  if (days < 90) return { label: `Expires in ${days}d`, color: '#FF9800' };
  return { label: `Active · ${days}d left`, color: '#4CAF50' };
}

interface EditModalProps {
  visible: boolean;
  initial: InsurancePolicy;
  onClose: () => void;
  onSave: (p: InsurancePolicy) => void;
}

function EditModal({ visible, initial, onClose, onSave }: EditModalProps) {
  const colors = useTheme();
  const [form, setForm] = useState<InsurancePolicy>(initial);

  useEffect(() => { setForm(initial); }, [initial, visible]);

  function field(key: keyof InsurancePolicy, label: string, placeholder: string, hint?: string) {
    return (
      <View key={key} style={{ marginBottom: spacing.md }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
        {hint && <Text style={{ ...typography.caption, color: colors.textTertiary, marginBottom: 4 }}>{hint}</Text>}
        <View style={{ backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md }}>
          <TextInput
            style={{ ...typography.body, color: colors.textPrimary, paddingVertical: spacing.sm }}
            value={form[key] as string}
            onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' }}>Insurance Details</Text>
            <TouchableOpacity onPress={() => onSave({ ...form, updatedAt: new Date().toISOString() })} style={{ padding: 4 }}>
              <Text style={{ ...typography.body, fontWeight: '700', color: colors.brandDark }}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            {field('provider', 'PROVIDER', 'e.g. World Nomads, SafetyWing')}
            {field('policyNumber', 'POLICY NUMBER', 'e.g. WN-123456')}
            {field('coverStart', 'COVER START DATE', 'YYYY-MM-DD', 'Format: 2025-06-01')}
            {field('coverEnd', 'COVER END DATE', 'YYYY-MM-DD', 'Format: 2025-12-31')}
            {field('emergencyNumber', 'EMERGENCY CLAIM NUMBER', 'e.g. +44 800 123 456')}
            {field('notes', 'NOTES', 'Policy number, cover limits, special conditions...')}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export function InsuranceScreen() {
  const colors = useTheme();
  const navigation = useNavigation();
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPolicy(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  async function handleSave(p: InsurancePolicy) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setPolicy(p);
    setShowEdit(false);
  }

  function handleDelete() {
    Alert.alert('Remove policy?', 'This will clear your saved insurance details.', [
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setPolicy(null);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const days = policy ? daysUntil(policy.coverEnd) : null;
  const badge = coverBadge(days);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
      backgroundColor: colors.brandDark, gap: spacing.sm,
    },
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h2, color: '#fff', flex: 1 },
    content: { flex: 1 },
    emptyCard: {
      margin: spacing.lg, backgroundColor: colors.card, borderRadius: 16,
      padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
      gap: spacing.md,
    },
    emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.inputBackground, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    addBtn: {
      backgroundColor: colors.brandDark, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
      borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    },
    addBtnText: { ...typography.body, fontWeight: '700', color: '#fff' },
    policyCard: {
      margin: spacing.md, backgroundColor: colors.card, borderRadius: 16,
      padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    policyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    policyName: { ...typography.h3, color: colors.textPrimary },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { ...typography.caption, fontWeight: '700', color: '#fff' },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    rowValue: { ...typography.body, color: colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    emergencyCard: {
      margin: spacing.md, marginTop: 0, backgroundColor: '#F44336',
      borderRadius: 12, padding: spacing.md,
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    },
    emergencyText: { ...typography.body, fontWeight: '700', color: '#fff', flex: 1 },
    emergencyNum: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    actions: { flexDirection: 'row', gap: spacing.sm, margin: spacing.md, marginTop: 0 },
    editBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: spacing.sm, borderRadius: 10, borderWidth: 1, borderColor: colors.brandDark,
    },
    editBtnText: { ...typography.body, fontWeight: '700', color: colors.brandDark },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    },
    deleteBtnText: { ...typography.caption, fontWeight: '600', color: colors.textTertiary },
    providerNote: {
      margin: spacing.md, padding: spacing.md, backgroundColor: colors.inputBackground,
      borderRadius: 10,
    },
    providerNoteText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  }), [colors]);

  if (isLoading) return null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Insurance</Text>
        {policy && (
          <TouchableOpacity style={s.backBtn} onPress={() => setShowEdit(true)}>
            <Ionicons name="pencil-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {!policy ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="shield-checkmark-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={s.emptyTitle}>No insurance stored</Text>
            <Text style={s.emptyBody}>
              Save your travel insurance details here for quick access in an emergency — policy number, emergency claim line, and cover dates.
            </Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowEdit(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.addBtnText}>Add Insurance Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.policyCard}>
              <View style={s.policyHeader}>
                <Text style={s.policyName}>{policy.provider || 'Insurance Policy'}</Text>
                {badge && (
                  <View style={[s.badge, { backgroundColor: badge.color }]}>
                    <Text style={s.badgeText}>{badge.label}</Text>
                  </View>
                )}
              </View>
              {[
                ['POLICY NUMBER', policy.policyNumber || '—'],
                ['COVER START', policy.coverStart || '—'],
                ['COVER END', policy.coverEnd || '—'],
              ].map(([label, value]) => (
                <View key={label} style={s.row}>
                  <Text style={s.rowLabel}>{label}</Text>
                  <Text style={s.rowValue}>{value}</Text>
                </View>
              ))}
              {policy.notes ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={s.rowLabel}>NOTES</Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                    {policy.notes}
                  </Text>
                </View>
              ) : null}
            </View>

            {policy.emergencyNumber ? (
              <TouchableOpacity
                style={s.emergencyCard}
                onPress={() => Linking.openURL(`tel:${policy.emergencyNumber.replace(/\s/g, '')}`)}
              >
                <Ionicons name="call" size={24} color="#fff" />
                <View>
                  <Text style={s.emergencyText}>Emergency Claim Line</Text>
                  <Text style={s.emergencyNum}>{policy.emergencyNumber}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ) : null}

            <View style={s.actions}>
              <TouchableOpacity style={s.editBtn} onPress={() => setShowEdit(true)}>
                <Ionicons name="pencil-outline" size={16} color={colors.brandDark} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                <Text style={s.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={s.providerNote}>
          <Text style={s.providerNoteText}>
            Looking for travel insurance? World Nomads, SafetyWing, and Battleface are popular providers for travellers. Compare policies at their websites before you travel.
          </Text>
        </View>
      </ScrollView>

      <EditModal
        visible={showEdit}
        initial={policy ?? EMPTY}
        onClose={() => setShowEdit(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
