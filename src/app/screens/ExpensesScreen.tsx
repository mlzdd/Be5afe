import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { useExpenses } from '@modules/expenses/useExpenses';
import { useUserPreferences } from '@modules/user-preferences/UserPreferencesContext';
import {
  CATEGORY_CONFIG,
  getBudgetStatus,
  formatAmount,
} from '@modules/expenses/types';
import type { Expense, ExpenseCategory, Budget } from '@modules/expenses/types';

const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'];

function groupByCurrency(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.currency] = (totals[e.currency] ?? 0) + e.amount;
  }
  return totals;
}

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  defaultCurrency: string;
}

function AddExpenseModal({ visible, onClose, onSave, defaultCurrency }: AddExpenseModalProps) {
  const colors = useTheme();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);

  function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    onSave({
      amount: num,
      currency,
      category,
      description: description.trim() || undefined,
      date: new Date().toISOString(),
    });
    setAmount('');
    setDescription('');
    setCategory('food');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' }}>Add Expense</Text>
            <TouchableOpacity onPress={handleSave} style={{ padding: 4 }}>
              <Text style={{ ...typography.body, fontWeight: '700', color: colors.brandDark }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
            {/* Amount row */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md }}>
                <TextInput
                  style={{ ...typography.h2, color: colors.textPrimary, paddingVertical: spacing.sm }}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, justifyContent: 'center' }}>
                <TextInput
                  style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700', width: 50, textAlign: 'center' }}
                  value={currency}
                  onChangeText={(v) => setCurrency(v.toUpperCase().slice(0, 3))}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSelected ? cfg.color : colors.inputBackground,
                      borderWidth: 1,
                      borderColor: isSelected ? cfg.color : colors.border,
                    }}
                  >
                    <Ionicons name={cfg.icon as any} size={14} color={isSelected ? '#fff' : colors.textSecondary} />
                    <Text style={{ ...typography.caption, fontWeight: '600', color: isSelected ? '#fff' : colors.textSecondary }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md }}>
              <TextInput
                style={{ ...typography.body, color: colors.textPrimary, paddingVertical: spacing.sm }}
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

interface SetBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (b: Budget) => void;
  current: Budget | null;
  defaultCurrency: string;
}

function SetBudgetModal({ visible, onClose, onSave, current, defaultCurrency }: SetBudgetModalProps) {
  const colors = useTheme();
  const [amount, setAmount] = useState(current ? String(current.amount) : '');
  const [currency, setCurrency] = useState(current?.currency ?? defaultCurrency);

  function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid amount'); return; }
    onSave({ amount: num, currency });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' }}>Set Budget</Text>
          <TouchableOpacity onPress={handleSave} style={{ padding: 4 }}>
            <Text style={{ ...typography.body, fontWeight: '700', color: colors.brandDark }}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md }}>
              <TextInput
                style={{ ...typography.h2, color: colors.textPrimary, paddingVertical: spacing.sm }}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={{ backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, justifyContent: 'center' }}>
              <TextInput
                style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700', width: 50, textAlign: 'center' }}
                value={currency}
                onChangeText={(v) => setCurrency(v.toUpperCase().slice(0, 3))}
                maxLength={3}
                autoCapitalize="characters"
              />
            </View>
          </View>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            Set a total budget for your trip. You'll see a progress bar as you spend.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const STATUS_COLORS = { safe: '#4CAF50', warning: '#FF9800', danger: '#F44336' };

export function ExpensesScreen() {
  const colors = useTheme();
  const navigation = useNavigation();
  const { expenses, budget, isLoading, addExpense, deleteExpense, setBudget, clearBudget } = useExpenses();
  const { preferences } = useUserPreferences();
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | 'all'>('all');

  const displayCurrency = preferences.displayCurrency.code;

  const currencyTotals = useMemo(() => groupByCurrency(expenses), [expenses]);
  // For budget comparison: only meaningful when all expenses share one currency
  const singleCurrencyTotal = useMemo(() => {
    const currencies = Object.keys(currencyTotals);
    if (currencies.length === 1) return currencyTotals[currencies[0]];
    return null;
  }, [currencyTotals]);

  const filtered = useMemo(
    () => filterCat === 'all' ? expenses : expenses.filter((e) => e.category === filterCat),
    [expenses, filterCat]
  );

  const budgetStatus = (budget && singleCurrencyTotal !== null) ? getBudgetStatus(singleCurrencyTotal, budget.amount) : 'safe';
  const budgetPct = (budget && singleCurrencyTotal !== null) ? Math.min((singleCurrencyTotal / budget.amount) * 100, 100) : 0;

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete expense?', undefined, [
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [deleteExpense]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.brandDark,
      gap: spacing.sm,
    },
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h2, color: '#fff', flex: 1 },
    headerAction: { padding: 4 },
    budgetCard: {
      margin: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    budgetLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    budgetAmount: { ...typography.h2, color: colors.textPrimary },
    budgetMax: { ...typography.caption, color: colors.textSecondary },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: colors.inputBackground, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4 },
    budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    setBudgetBtn: { ...typography.caption, color: colors.brandDark, fontWeight: '600' },
    filterRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20,
      backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
    chipText: { ...typography.caption, fontWeight: '600', color: colors.textPrimary },
    chipTextActive: { color: '#fff' },
    expenseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    catIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    expDesc: { flex: 1 },
    expName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    expMeta: { ...typography.caption, color: colors.textSecondary },
    expAmount: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    addBtn: {
      position: 'absolute', bottom: 32, right: spacing.lg,
      backgroundColor: colors.brandDark, width: 56, height: 56,
      borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    },
    empty: { alignItems: 'center', paddingTop: 48, gap: spacing.sm },
    emptyText: { ...typography.body, color: colors.textSecondary },
  }), [colors]);

  if (isLoading) return null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Expenses</Text>
        <TouchableOpacity style={s.headerAction} onPress={() => setShowBudget(true)}>
          <Ionicons name="wallet-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Budget card */}
      <View style={s.budgetCard}>
        <View style={s.budgetRow}>
          <Text style={s.budgetLabel}>TOTAL SPENT</Text>
          {budget && <Text style={s.budgetMax}>of {formatAmount(budget.amount, budget.currency)}</Text>}
        </View>
        {Object.keys(currencyTotals).length === 0 ? (
          <Text style={s.budgetAmount}>—</Text>
        ) : Object.keys(currencyTotals).length === 1 ? (
          <Text style={s.budgetAmount}>{formatAmount(Object.values(currencyTotals)[0], Object.keys(currencyTotals)[0])}</Text>
        ) : (
          <View style={{ gap: 2 }}>
            {Object.entries(currencyTotals).map(([cur, amt]) => (
              <Text key={cur} style={s.budgetAmount}>{formatAmount(amt, cur)}</Text>
            ))}
            <Text style={{ ...s.budgetLabel, marginTop: 4 }}>Multiple currencies — add budget per currency</Text>
          </View>
        )}
        {budget && (
          <>
            <View style={[s.progressBar, { marginTop: spacing.sm }]}>
              <View
                style={[s.progressFill, {
                  width: `${budgetPct}%` as any,
                  backgroundColor: STATUS_COLORS[budgetStatus],
                }]}
              />
            </View>
            <View style={s.budgetFooter}>
              <Text style={s.budgetLabel}>
                {budgetStatus === 'danger' ? 'Over budget' : `${Math.round(budgetPct)}% used`}
              </Text>
              <TouchableOpacity onPress={() => clearBudget()}>
                <Text style={[s.setBudgetBtn, { color: colors.textTertiary }]}>Remove budget</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {!budget && (
          <TouchableOpacity onPress={() => setShowBudget(true)} style={{ marginTop: spacing.sm }}>
            <Text style={s.setBudgetBtn}>+ Set a budget</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          <TouchableOpacity
            style={[s.chip, filterCat === 'all' && s.chipActive]}
            onPress={() => setFilterCat('all')}
          >
            <Text style={[s.chipText, filterCat === 'all' && s.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[s.chip, filterCat === cat && { ...s.chipActive, backgroundColor: CATEGORY_CONFIG[cat].color, borderColor: CATEGORY_CONFIG[cat].color }]}
              onPress={() => setFilterCat(cat === filterCat ? 'all' : cat)}
            >
              <Text style={[s.chipText, filterCat === cat && s.chipTextActive]}>
                {CATEGORY_CONFIG[cat].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const cfg = CATEGORY_CONFIG[item.category];
          const d = new Date(item.date);
          return (
            <TouchableOpacity
              style={s.expenseItem}
              onLongPress={() => handleDelete(item.id)}
              activeOpacity={0.7}
            >
              <View style={[s.catIcon, { backgroundColor: cfg.color + '22' }]}>
                <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
              </View>
              <View style={s.expDesc}>
                <Text style={s.expName}>{item.description || cfg.label}</Text>
                <Text style={s.expMeta}>{cfg.label} · {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
              <Text style={s.expAmount}>{formatAmount(item.amount, item.currency)}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
            <Text style={s.emptyText}>No expenses yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddExpenseModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={addExpense}
        defaultCurrency={displayCurrency}
      />
      <SetBudgetModal
        visible={showBudget}
        onClose={() => setShowBudget(false)}
        onSave={setBudget}
        current={budget}
        defaultCurrency={displayCurrency}
      />
    </SafeAreaView>
  );
}
