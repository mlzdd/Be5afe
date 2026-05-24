import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';

interface SectionHeaderAction {
  label: string;
  onPress: () => void;
}

interface SectionHeaderProps {
  title: string;
  action?: SectionHeaderAction;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.75}
          onPress={action.onPress}
          style={styles.action}
        >
          <Text style={[styles.actionText, { color: colors.brandDark }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
  },
  action: {
    paddingLeft: spacing.base,
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.label,
  },
});
