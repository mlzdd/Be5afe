import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useUserPreferences } from '@modules/user-preferences/UserPreferencesContext';

interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number;
}

// Common travel currencies with approximate rates (relative to USD)
const CURRENCIES: CurrencyRate[] = [
  { code: 'USD', name: 'US Dollar',          symbol: '$',  rateToUSD: 1.0 },
  { code: 'EUR', name: 'Euro',               symbol: '€',  rateToUSD: 0.92 },
  { code: 'GBP', name: 'British Pound',      symbol: '£',  rateToUSD: 0.79 },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',  rateToUSD: 149.5 },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$', rateToUSD: 1.53 },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$', rateToUSD: 1.36 },
  { code: 'CHF', name: 'Swiss Franc',        symbol: 'Fr', rateToUSD: 0.90 },
  { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥',  rateToUSD: 7.24 },
  { code: 'HKD', name: 'Hong Kong Dollar',   symbol: 'HK$',rateToUSD: 7.82 },
  { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$', rateToUSD: 1.34 },
  { code: 'THB', name: 'Thai Baht',          symbol: '฿',  rateToUSD: 35.1 },
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',  rateToUSD: 83.1 },
  { code: 'MXN', name: 'Mexican Peso',       symbol: '$',  rateToUSD: 17.2 },
  { code: 'BRL', name: 'Brazilian Real',     symbol: 'R$', rateToUSD: 4.97 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R',  rateToUSD: 18.6 },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ',rateToUSD: 3.67 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$',rateToUSD: 1.63 },
  { code: 'KRW', name: 'South Korean Won',   symbol: '₩',  rateToUSD: 1330 },
  { code: 'VND', name: 'Vietnamese Dong',    symbol: '₫',  rateToUSD: 24500 },
  { code: 'IDR', name: 'Indonesian Rupiah',  symbol: 'Rp', rateToUSD: 15700 },
];

const STORAGE_KEY = '@be5afe_currency_converter';

function convert(amount: number, from: CurrencyRate, to: CurrencyRate): number {
  const usd = amount / from.rateToUSD;
  return usd * to.rateToUSD;
}

function formatResult(value: number, code: string): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (code === 'JPY' || code === 'KRW' || code === 'VND' || code === 'IDR') {
    return Math.round(value).toLocaleString();
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PickerProps {
  selected: CurrencyRate;
  onSelect: (c: CurrencyRate) => void;
}

function CurrencyPicker({ selected, onSelect }: PickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(true)}>
        <Text style={styles.pickerCode}>{selected.code}</Text>
        <Text style={styles.pickerName}>{selected.name}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={styles.pickerDropdown}>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(c) => c.code}
            style={styles.pickerList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, item.code === selected.code && styles.pickerItemActive]}
                onPress={() => { onSelect(item); setOpen(false); }}
              >
                <Text style={[styles.pickerItemCode, item.code === selected.code && styles.pickerItemCodeActive]}>
                  {item.code}
                </Text>
                <Text style={styles.pickerItemName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </>
  );
}

export function CurrencyConverterScreen() {
  const navigation = useNavigation();
  const { preferences } = useUserPreferences();
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState<CurrencyRate>(CURRENCIES[0]);
  const [to, setTo] = useState<CurrencyRate>(CURRENCIES[1]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw) as { from?: string; to?: string; amount?: string };
        const savedFrom = CURRENCIES.find((currency) => currency.code === saved.from);
        const savedTo = CURRENCIES.find((currency) => currency.code === saved.to);
        if (saved.amount) setAmount(saved.amount);
        if (savedFrom) setFrom(savedFrom);
        if (savedTo) setTo(savedTo);
        return;
      }

      const preferred = CURRENCIES.find((currency) => currency.code === preferences.displayCurrency.code);
      if (preferred) setFrom(preferred);
    }).catch(() => {});
  }, [preferences.displayCurrency.code]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      amount,
      from: from.code,
      to: to.code,
    })).catch(() => {});
  }, [amount, from.code, to.code]);

  const numericAmount = parseFloat(amount) || 0;
  const result = convert(numericAmount, from, to);

  const swap = useCallback(() => {
    setFrom(to);
    setTo(from);
  }, [from, to]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Currency Converter</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.placeholder}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>From</Text>
              <CurrencyPicker selected={from} onSelect={setFrom} />
            </View>
            <TouchableOpacity style={styles.swapBtn} onPress={swap}>
              <Ionicons name="swap-horizontal" size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>To</Text>
              <CurrencyPicker selected={to} onSelect={setTo} />
            </View>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>{numericAmount} {from.code} =</Text>
            <Text style={styles.resultAmount}>{to.symbol}{formatResult(result, to.code)}</Text>
            <Text style={styles.resultCode}>{to.code}</Text>
          </View>

          <Text style={styles.disclaimer}>* Indicative rates only. Check your bank for exact rates.</Text>
        </View>

        <View style={styles.ratesCard}>
          <Text style={styles.ratesTitle}>Common rates vs {from.code}</Text>
          {CURRENCIES.filter((c) => c.code !== from.code).slice(0, 10).map((c) => {
            const rate = convert(1, from, c);
            return (
              <View key={c.code} style={styles.rateRow}>
                <Text style={styles.rateCode}>{c.code}</Text>
                <Text style={styles.rateName}>{c.name}</Text>
                <Text style={styles.rateValue}>{c.symbol}{formatResult(rate, c.code)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  body: { padding: spacing.base, gap: spacing.base },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  fieldLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  amountInput: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, padding: spacing.md, ...typography.h3, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flex: { flex: 1 },
  swapBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandDark, alignItems: 'center', justifyContent: 'center', marginBottom: 0 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, padding: spacing.md, backgroundColor: colors.inputBackground },
  pickerCode: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  pickerName: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  pickerDropdown: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: colors.background, elevation: 10 },
  pickerList: { flex: 1 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemActive: { backgroundColor: colors.brandDark + '15' },
  pickerItemCode: { ...typography.body, color: colors.textPrimary, fontWeight: '700', width: 50 },
  pickerItemCodeActive: { color: colors.brandDark },
  pickerItemName: { ...typography.bodySmall, color: colors.textSecondary },
  resultBox: { backgroundColor: colors.brandDark + '0d', borderRadius: 12, padding: spacing.lg, alignItems: 'center', gap: 4 },
  resultLabel: { ...typography.bodySmall, color: colors.textSecondary },
  resultAmount: { ...typography.h1, color: colors.brandDark },
  resultCode: { ...typography.body, color: colors.textSecondary },
  disclaimer: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
  ratesCard: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg, gap: spacing.sm, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  ratesTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  rateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  rateCode: { ...typography.body, color: colors.textPrimary, fontWeight: '700', width: 50 },
  rateName: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  rateValue: { ...typography.body, color: colors.textPrimary },
});
