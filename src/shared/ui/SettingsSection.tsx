import React, { Children, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const colors = useTheme();
  const rows = Children.toArray(children);

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.body,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {rows.map((child, index) => (
          <View key={index}>
            {child}
            {index < rows.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.label,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  body: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.base,
  },
});
