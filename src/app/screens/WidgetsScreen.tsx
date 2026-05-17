import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { WIDGET_METADATA } from '@products/bsafe/widgets/types';

export function WidgetsScreen() {
  const navigation = useNavigation();
  const { widgets } = useAppContext();

  const confirmRemove = (id: string, label: string) => {
    Alert.alert('Remove widget', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => widgets.removeWidget(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>My Dashboard</Text>
      </View>
      <FlatList
        data={widgets.widgets}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const meta = WIDGET_METADATA[item.type];
          return (
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: meta.iconColor + '20' }]}>
                <Ionicons name={meta.icon as never} size={24} color={meta.iconColor} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{meta.title}</Text>
                <Text style={styles.sub}>{meta.description}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmRemove(item.id, meta.title)}>
                <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="grid-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No widgets added yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  list: { padding: spacing.base },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
