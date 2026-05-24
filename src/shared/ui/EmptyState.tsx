import React, { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.82}
          onPress={action.onPress}
          style={[styles.action, { backgroundColor: colors.brandDark }]}
        >
          <Text style={[styles.actionText, { color: colors.textInverse }]}>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  title: {
    ...typography.h4,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  action: {
    borderRadius: radius.full,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionText: {
    ...typography.button,
  },
});
