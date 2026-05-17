import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { countryEmergencyNumbers } from '@products/bsafe/emergency';
import type { EmergencyContact } from '@products/bsafe/emergency/types';

export function EmergencyScreen() {
  const navigation = useNavigation();
  const { emergency, location } = useAppContext();
  const [addingContact, setAddingContact] = useState(false);

  const countryName = location.selectedCountryName ?? 'United States';
  const numbers = countryEmergencyNumbers[countryName] ?? countryEmergencyNumbers['United States'];

  const call = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Cannot dial', number));
  };

  const confirmDelete = (contact: EmergencyContact) => {
    Alert.alert('Remove contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => emergency.deleteContact(contact.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Country emergency numbers */}
        <Text style={styles.section}>Emergency Numbers — {countryName}</Text>
        {[
          { label: 'Police', number: numbers.police, icon: 'shield', color: '#2196F3' },
          { label: 'Ambulance', number: numbers.ambulance, icon: 'medical', color: '#F44336' },
          { label: 'Fire', number: numbers.fire, icon: 'flame', color: '#FF9800' },
          ...(numbers.tourist ? [{ label: 'Tourist Police', number: numbers.tourist, icon: 'person', color: '#9C27B0' }] : []),
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.numberCard} onPress={() => call(item.number)}>
            <View style={[styles.iconBg, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as never} size={24} color={item.color} />
            </View>
            <View style={styles.numberInfo}>
              <Text style={styles.numberLabel}>{item.label}</Text>
              <Text style={styles.number}>{item.number}</Text>
            </View>
            <Ionicons name="call" size={20} color={item.color} />
          </TouchableOpacity>
        ))}

        {/* Personal contacts */}
        <View style={styles.contactsHeader}>
          <Text style={styles.section}>My Contacts</Text>
          <TouchableOpacity onPress={() => setAddingContact(true)}>
            <Ionicons name="add-circle" size={28} color={colors.brandDark} />
          </TouchableOpacity>
        </View>
        {emergency.contacts.map((c) => (
          <View key={c.id} style={styles.contactCard}>
            <Ionicons name="person-circle" size={40} color={colors.textSecondary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
              <Text style={styles.contactRelation}>{c.relationship}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity onPress={() => call(c.phone)} style={styles.actionBtn}>
                <Ionicons name="call" size={20} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(c)} style={styles.actionBtn}>
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {emergency.contacts.length === 0 && (
          <Text style={styles.empty}>No personal contacts yet. Tap + to add one.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  scroll: { padding: spacing.base, paddingBottom: spacing.xl },
  section: { ...typography.h4, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  numberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  numberInfo: { flex: 1 },
  numberLabel: { ...typography.bodySmall, color: colors.textSecondary },
  number: { ...typography.h4, color: colors.textPrimary },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md },
  contactInfo: { flex: 1 },
  contactName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  contactPhone: { ...typography.bodySmall, color: colors.textSecondary },
  contactRelation: { ...typography.caption, color: colors.textTertiary },
  contactActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { padding: spacing.sm },
  empty: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md },
});
