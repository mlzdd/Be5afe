import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@shared/theme';

interface Props {
  title: string;
  navigation?: { goBack(): void };
}

export function PlaceholderScreen({ title, navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.coming}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, backgroundColor: colors.brandDark, flexDirection: 'row', alignItems: 'center' },
  back: { marginRight: spacing.md },
  backText: { ...typography.body, color: colors.textInverse },
  title: { ...typography.h3, color: colors.textInverse, flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coming: { ...typography.body, color: colors.textSecondary },
});
