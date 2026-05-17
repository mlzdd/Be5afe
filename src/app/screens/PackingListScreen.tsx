import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import type { PackingCategory, PackingItem } from '@products/bsafe/travel-tools/types';

const CATEGORIES: PackingCategory[] = ['clothing', 'toiletries', 'electronics', 'documents', 'medication', 'other'];

const CAT_LABELS: Record<PackingCategory, string> = {
  clothing: 'Clothing',
  toiletries: 'Toiletries',
  electronics: 'Electronics',
  documents: 'Documents',
  medication: 'Medication',
  other: 'Other',
};

const CAT_ICONS: Record<PackingCategory, string> = {
  clothing: 'shirt-outline',
  toiletries: 'water-outline',
  electronics: 'phone-portrait-outline',
  documents: 'document-text-outline',
  medication: 'medical-outline',
  other: 'cube-outline',
};

const CAT_COLORS: Record<PackingCategory, string> = {
  clothing: colors.info,
  toiletries: colors.accent,
  electronics: colors.highlight,
  documents: colors.brandDark,
  medication: colors.error,
  other: colors.textTertiary,
};

const TEMPLATES: Omit<PackingItem, 'id' | 'packed' | 'createdAt'>[] = [
  { name: 'Passport', category: 'documents' },
  { name: 'Travel insurance', category: 'documents' },
  { name: 'Phone + charger', category: 'electronics' },
  { name: 'Power bank', category: 'electronics' },
  { name: 'Adapter', category: 'electronics' },
  { name: 'Toothbrush + toothpaste', category: 'toiletries' },
  { name: 'Sunscreen', category: 'toiletries' },
  { name: 'T-shirts × 3', category: 'clothing' },
  { name: 'Underwear × 5', category: 'clothing' },
  { name: 'Comfortable walking shoes', category: 'clothing' },
];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Omit<PackingItem, 'id' | 'createdAt'>) => Promise<void>;
}

function AddItemModal({ visible, onClose, onAdd }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('clothing');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setCategory('clothing'); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd({ name: name.trim(), category, packed: false });
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
          <Text style={modal.title}>Add Item</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={modal.body}>
          <Text style={modal.label}>Item name</Text>
          <TextInput
            style={modal.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rain jacket"
            placeholderTextColor={colors.placeholder}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Text style={modal.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[modal.chip, category === c && modal.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[modal.chipText, category === c && modal.chipTextActive]}>
                  {CAT_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={modal.addBtn} onPress={handleAdd} disabled={saving || !name.trim()}>
            <Text style={modal.addBtnText}>{saving ? 'Adding…' : 'Add Item'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function PackingListScreen() {
  const navigation = useNavigation();
  const { travelTools } = useAppContext();
  const { items, togglePacked, deleteItem, addItem, addItemsFromTemplate, clearAllItems, getProgress } = travelTools;
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState<PackingCategory | 'all'>('all');

  const progress = getProgress();

  const filtered = filterCat === 'all' ? items : items.filter((i) => i.category === filterCat);
  const unpacked = filtered.filter((i) => !i.packed);
  const packed = filtered.filter((i) => i.packed);

  const confirmClear = () => {
    Alert.alert('Clear all items', 'Remove all items from your packing list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearAllItems() },
    ]);
  };

  const loadTemplate = () => {
    Alert.alert('Load template', 'Add starter packing items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load', onPress: () => addItemsFromTemplate(TEMPLATES) },
    ]);
  };

  const renderItem = ({ item }: { item: PackingItem }) => (
    <TouchableOpacity style={styles.item} onPress={() => togglePacked(item.id)} activeOpacity={0.7}>
      <View style={[styles.checkbox, item.packed && styles.checkboxDone]}>
        {item.packed && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
      </View>
      <View style={[styles.catDot, { backgroundColor: CAT_COLORS[item.category] }]} />
      <Text style={[styles.itemName, item.packed && styles.itemNameDone]}>{item.name}</Text>
      <TouchableOpacity onPress={() => deleteItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Packing List</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {items.length > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress.percentage}%` as `${number}%` }]} />
          <Text style={styles.progressText}>{progress.packed}/{progress.total} packed ({progress.percentage}%)</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={styles.catRowContent}>
        {(['all', ...CATEGORIES] as const).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catChip, filterCat === c && styles.catChipActive]}
            onPress={() => setFilterCat(c)}
          >
            {c !== 'all' && <Ionicons name={CAT_ICONS[c] as never} size={14} color={filterCat === c ? colors.textInverse : colors.textSecondary} />}
            <Text style={[styles.catChipText, filterCat === c && styles.catChipTextActive]}>
              {c === 'all' ? 'All' : CAT_LABELS[c]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Nothing packed yet</Text>
          <TouchableOpacity style={styles.templateBtn} onPress={loadTemplate}>
            <Text style={styles.templateBtnText}>Load starter template</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...unpacked, ...packed]}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            items.length > 0 ? (
              <TouchableOpacity style={styles.clearBtn} onPress={confirmClear}>
                <Text style={styles.clearBtnText}>Clear all items</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <AddItemModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addItem} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  addBtn: { padding: 4 },
  progressBar: { backgroundColor: colors.border, height: 6, position: 'relative', overflow: 'hidden' },
  progressFill: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: colors.success },
  progressText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', paddingTop: 2, paddingBottom: 2, backgroundColor: colors.background, position: 'relative', zIndex: 1 },
  catRow: { maxHeight: 48 },
  catRowContent: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 4 },
  catChipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  catChipText: { ...typography.bodySmall, color: colors.textSecondary },
  catChipTextActive: { color: colors.textInverse },
  list: { padding: spacing.base },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  itemNameDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  templateBtn: { backgroundColor: colors.brandDark, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  templateBtnText: { ...typography.button, color: colors.textInverse },
  clearBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  clearBtnText: { ...typography.bodySmall, color: colors.error },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { padding: spacing.base, gap: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: spacing.md, ...typography.body, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 6, marginRight: spacing.sm },
  chipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  chipText: { ...typography.bodySmall, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  addBtn: { backgroundColor: colors.brandDark, borderRadius: 12, padding: spacing.base, alignItems: 'center', marginTop: spacing.sm },
  addBtnText: { ...typography.button, color: colors.textInverse },
});
