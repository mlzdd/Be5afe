import React, { ComponentProps, ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface SettingsRowProps {
  label: string;
  value?: string;
  right?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SettingsRow({
  label,
  value,
  right,
  icon,
  onPress,
  disabled = false,
  style,
}: SettingsRowProps) {
  const colors = useTheme();
  const content = (
    <>
      {icon ? (
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.spacer} />
      {right ?? (
        <>
          {value ? (
            <Text numberOfLines={1} style={[styles.value, { color: colors.textSecondary }]}>
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          ) : null}
        </>
      )}
    </>
  );

  const rowStyle = [styles.row, disabled ? styles.disabled : null, style];

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.75}
        disabled={disabled}
        onPress={onPress}
        style={rowStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    ...typography.body,
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
  },
  value: {
    ...typography.bodySmall,
    marginLeft: spacing.md,
    maxWidth: '45%',
  },
  disabled: {
    opacity: 0.5,
  },
});
