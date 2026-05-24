import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import type { DocumentType, TravelDocument } from '@products/bsafe/travel-tools/types';
import { DateTimePicker } from '../components/DateTimePicker';

const DOC_ICONS: Record<DocumentType, string> = {
  passport: 'document-text',
  visa: 'card',
  insurance: 'shield-checkmark',
  flight: 'airplane',
  hotel: 'bed',
  vaccination: 'medical',
  license: 'car',
  other: 'folder',
};

const DOC_COLORS: Record<DocumentType, string> = {
  passport: colors.brandDark,
  visa: colors.info,
  insurance: colors.success,
  flight: colors.highlight,
  hotel: colors.accent,
  vaccination: colors.warning,
  license: colors.textSecondary,
  other: colors.textTertiary,
};

const DOC_TYPES: DocumentType[] = [
  'passport', 'visa', 'insurance', 'flight', 'hotel', 'vaccination', 'license', 'other',
];

const DOC_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  insurance: 'Insurance',
  flight: 'Flight',
  hotel: 'Hotel',
  vaccination: 'Vaccination',
  license: 'License',
  other: 'Other',
};

function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const days = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() < Date.now();
}

function getExpiryInfo(expiryDate?: string): { label: string; color: string } | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T12:00:00`);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: 'Expired', color: colors.textTertiary };
  if (days === 0) return { label: 'Expires today', color: colors.error };
  if (days < 30) return { label: `Expires in ${days} days`, color: colors.error };
  if (days <= 90) return { label: `Expires in ${days} days`, color: colors.warning };
  return { label: `Expires in ${days} days`, color: colors.success };
}

interface AddDocModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Omit<TravelDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

function AddDocModal({ visible, onClose, onAdd }: AddDocModalProps) {
  const [type, setType] = useState<DocumentType>('passport');
  const [title, setTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setType('passport'); setTitle(''); setDocNumber(''); setExpiry(''); setNotes(''); };

  const handleAdd = async () => {
    if (!title.trim() || !docNumber.trim()) {
      Alert.alert('Required', 'Title and document number are required.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({ type, title: title.trim(), documentNumber: docNumber.trim(), expiryDate: expiry.trim() || undefined, notes: notes.trim() || undefined });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Add Document</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={modal.body}>
          <Text style={modal.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modal.typeRow}>
            {DOC_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[modal.typeChip, type === t && modal.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[modal.typeChipText, type === t && modal.typeChipTextActive]}>
                  {DOC_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={modal.label}>Title *</Text>
          <TextInput style={modal.input} value={title} onChangeText={setTitle} placeholder="e.g. My Passport" placeholderTextColor={colors.placeholder} />
          <Text style={modal.label}>Document Number *</Text>
          <TextInput style={modal.input} value={docNumber} onChangeText={setDocNumber} placeholder="e.g. AB1234567" placeholderTextColor={colors.placeholder} />
          <DateTimePicker label="Expiry Date" value={expiry} onChange={setExpiry} placeholder="Select expiry date" mode="date" />
          <Text style={modal.label}>Notes</Text>
          <TextInput style={[modal.input, modal.multiline]} value={notes} onChangeText={setNotes} placeholder="Optional notes..." placeholderTextColor={colors.placeholder} multiline numberOfLines={3} />
          <TouchableOpacity style={modal.addBtn} onPress={handleAdd} disabled={saving}>
            <Text style={modal.addBtnText}>{saving ? 'Saving…' : 'Add Document'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function DocumentsScreen() {
  const navigation = useNavigation();
  const { travelTools } = useAppContext();
  const { documents, addDocument, deleteDocument } = travelTools;
  const [showAdd, setShowAdd] = useState(false);

  const confirmDelete = (doc: TravelDocument) => {
    Alert.alert('Delete document', `Delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDocument(doc.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const expiryInfo = getExpiryInfo(item.expiryDate);
          const iconColor = DOC_COLORS[item.type];
          return (
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: iconColor + '22' }]}>
                <Ionicons name={DOC_ICONS[item.type] as never} size={22} color={iconColor} />
              </View>
              <View style={styles.info}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docNum}>{item.documentNumber}</Text>
                {expiryInfo && (
                  <View style={[styles.expiryBadge, { backgroundColor: expiryInfo.color + '20' }]}>
                    <Text style={[styles.expiryBadgeText, { color: expiryInfo.color }]}>
                      {expiryInfo.label}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{DOC_LABELS[item.type]}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No documents saved</Text>
            <Text style={styles.emptySub}>Add passports, visas, insurance and more</Text>
          </View>
        }
      />
      <AddDocModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addDocument} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  addBtn: { padding: 4 },
  list: { padding: spacing.base },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  docTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  docNum: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: 'monospace' },
  expiryBadge: { alignSelf: 'flex-start', borderRadius: 999, marginTop: 4, paddingHorizontal: 8, paddingVertical: 2 },
  expiryBadgeText: { ...typography.caption, fontWeight: '700' },
  typeBadge: { backgroundColor: colors.brandDark + '15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { ...typography.caption, color: colors.brandDark },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  emptySub: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.xs, textAlign: 'center' },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { padding: spacing.base, gap: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 4 },
  typeRow: { marginBottom: spacing.sm },
  typeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.sm },
  typeChipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  typeChipText: { ...typography.bodySmall, color: colors.textSecondary },
  typeChipTextActive: { color: colors.textInverse },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: spacing.md, ...typography.body, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  multiline: { height: 80, textAlignVertical: 'top' },
  addBtn: { backgroundColor: colors.brandDark, borderRadius: 12, padding: spacing.base, alignItems: 'center', marginTop: spacing.sm },
  addBtnText: { ...typography.button, color: colors.textInverse },
});
